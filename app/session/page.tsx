"use client";

import { useMemo, useState, useTransition } from "react";
import { buildExecutionPlan } from "@/lib/engine/executionFlow";
import { getTool } from "@/lib/kernel/tools";
import {
  createLog,
  listLogs,
  startLoop,
  completeStep,
  completeLoop,
} from "./actions";
import type { LogEntry, StepStatus } from "@/lib/kernel/logs";
import type { ToolId } from "@/lib/kernel/tools";

type SelfReportOption =
  | "baseline"
  | "fog"
  | "drift"
  | "overwhelm"
  | "hesitation"
  | "contradiction"
  | "recovery";

const OPTIONS: { value: SelfReportOption; label: string }[] = [
  { value: "baseline", label: "Baseline" },
  { value: "fog", label: "Fog" },
  { value: "drift", label: "Drift" },
  { value: "overwhelm", label: "Overwhelm" },
  { value: "hesitation", label: "Hesitation" },
  { value: "contradiction", label: "Contradiction" },
  { value: "recovery", label: "Recovery" },
];

type LoopId = "DAILY_ANCHOR" | "DAILY_REVIEW" | "WEEKLY_AUDIT";

type ActiveLoop = {
  loopId: LoopId;
  loopRunId: string;
  name: string;
  steps: { order: number; label: string; toolId?: ToolId }[];
  completed: Record<number, StepStatus>;
};

export default function SessionPage() {
  const [selfReport, setSelfReport] = useState<SelfReportOption>("fog");
  const [minutesSinceLastAction, setMinutesSinceLastAction] = useState<number>(0);
  const [overloadFlag, setOverloadFlag] = useState<boolean>(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  const [activeLoop, setActiveLoop] = useState<ActiveLoop | null>(null);
  const [stepNote, setStepNote] = useState<string>("");

  const plan = useMemo(() => {
    return buildExecutionPlan({
      selfReport,
      minutesSinceLastAction,
      overloadFlag,
    });
  }, [selfReport, minutesSinceLastAction, overloadFlag]);

  const tool = useMemo(() => getTool(plan.toolId), [plan.toolId]);

  function refreshLogs() {
    startTransition(async () => {
      const items = await listLogs(20);
      setLogs(items as LogEntry[]);
    });
  }

  function logThisRun() {
    startTransition(async () => {
      await createLog({
        type: "TOOL_RUN",
        stateId: plan.stateId,
        modeId: plan.modeId,
        toolId: plan.toolId,
        message: `Guardian run: ${plan.toolId} (state ${plan.stateId}, mode ${plan.modeId}).`,
        level: overloadFlag ? 3 : undefined,
        tags: ["session"],
      });

      const items = await listLogs(20);
      setLogs(items as LogEntry[]);
    });
  }

  function beginLoop(loopId: LoopId) {
    startTransition(async () => {
      const started = await startLoop(loopId);
      setActiveLoop({
        loopId: started.loopId as LoopId,
        loopRunId: started.loopRunId,
        name: started.name,
        steps: [...started.steps],
        completed: {},
      });

      const items = await listLogs(20);
      setLogs(items as LogEntry[]);
    });
  }

  function markStep(
    step: { order: number; label: string; toolId?: ToolId },
    status: StepStatus
  ) {
    if (!activeLoop) return;

    startTransition(async () => {
      await completeStep({
        loopId: activeLoop.loopId,
        loopRunId: activeLoop.loopRunId,
        stepOrder: step.order,
        stepLabel: step.label,
        toolId: step.toolId,
        status,
        note: stepNote.trim() ? stepNote.trim() : undefined,
      });

      setActiveLoop((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          completed: { ...prev.completed, [step.order]: status },
        };
      });

      setStepNote("");
      const items = await listLogs(20);
      setLogs(items as LogEntry[]);
    });
  }

  function finishLoop() {
    if (!activeLoop) return;

    startTransition(async () => {
      await completeLoop({
        loopId: activeLoop.loopId,
        loopRunId: activeLoop.loopRunId,
      });
      setActiveLoop(null);
      const items = await listLogs(20);
      setLogs(items as LogEntry[]);
    });
  }

  const allStepsMarked =
    activeLoop && activeLoop.steps.every((s) => Boolean(activeLoop.completed[s.order]));

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">VANTA — Session</h1>

      <p className="mt-2 text-sm opacity-80">
        Guardian of Becoming • Future Projection:{" "}
        <span className="font-mono">{plan.futureProjectionName}</span>
      </p>

      {/* Inputs */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Inputs</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="grid gap-2 text-sm">
            <span className="opacity-70">Self-report</span>
            <select
              className="rounded border px-3 py-2"
              value={selfReport}
              onChange={(e) => setSelfReport(e.target.value as SelfReportOption)}
            >
              {OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span className="opacity-70">Minutes since last action</span>
            <input
              className="rounded border px-3 py-2"
              type="number"
              min={0}
              step={1}
              value={minutesSinceLastAction}
              onChange={(e) => setMinutesSinceLastAction(Number(e.target.value))}
            />
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={overloadFlag}
              onChange={(e) => setOverloadFlag(e.target.checked)}
            />
            <span className="opacity-80">Overload flag</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded border px-3 py-2 text-sm" onClick={logThisRun} disabled={isPending}>
            {isPending ? "Working..." : "Log this run"}
          </button>

          <button className="rounded border px-3 py-2 text-sm" onClick={refreshLogs} disabled={isPending}>
            {isPending ? "Working..." : "Refresh logs"}
          </button>

          <button className="rounded border px-3 py-2 text-sm" onClick={() => beginLoop("DAILY_ANCHOR")} disabled={isPending || Boolean(activeLoop)}>
            {isPending ? "Working..." : "Start Daily Anchor"}
          </button>

          <button className="rounded border px-3 py-2 text-sm" onClick={() => beginLoop("DAILY_REVIEW")} disabled={isPending || Boolean(activeLoop)}>
            {isPending ? "Working..." : "Start Daily Review"}
          </button>

          <button className="rounded border px-3 py-2 text-sm" onClick={() => beginLoop("WEEKLY_AUDIT")} disabled={isPending || Boolean(activeLoop)}>
            {isPending ? "Working..." : "Start Weekly Audit"}
          </button>
        </div>

        {activeLoop ? (
          <p className="mt-3 text-xs opacity-70">
            A loop is active. Finish it before starting another.
          </p>
        ) : null}
      </div>

      {/* Active Loop */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Active Loop</h2>

        {!activeLoop ? (
          <p className="mt-2 text-sm opacity-70">No active loop. Start one above.</p>
        ) : (
          <>
            <p className="mt-2 text-sm opacity-80">
              Running: <span className="font-mono">{activeLoop.name}</span>{" "}
              <span className="text-xs opacity-70">(run: {activeLoop.loopRunId})</span>
            </p>

            <label className="mt-4 grid gap-2 text-sm">
              <span className="opacity-70">Optional step note (saved on next step check)</span>
              <input
                className="rounded border px-3 py-2"
                value={stepNote}
                onChange={(e) => setStepNote(e.target.value)}
                placeholder="(optional) quick note"
              />
            </label>

            <ul className="mt-4 grid gap-2 text-sm">
              {activeLoop.steps.map((s) => {
                const status = activeLoop.completed[s.order];
                return (
                  <li key={s.order} className="rounded border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs opacity-70">
                          Step {s.order}{s.toolId ? ` • tool:${s.toolId}` : ""}
                        </div>
                        <div className="mt-1">{s.label}</div>
                        {status ? (
                          <div className="mt-1 text-xs opacity-70">
                            status: <span className="font-mono">{status}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="rounded border px-3 py-2 text-xs"
                          onClick={() => markStep(s, "done")}
                          disabled={isPending || Boolean(status)}
                        >
                          Done
                        </button>
                        <button
                          className="rounded border px-3 py-2 text-xs"
                          onClick={() => markStep(s, "skipped")}
                          disabled={isPending || Boolean(status)}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                className="rounded border px-3 py-2 text-sm"
                onClick={finishLoop}
                disabled={isPending || !allStepsMarked}
              >
                {isPending ? "Working..." : "Complete Loop"}
              </button>

              {!allStepsMarked ? (
                <p className="text-xs opacity-70">Mark every step Done/Skip to enable completion.</p>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Execution Plan */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Execution Plan</h2>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm opacity-70">State</dt>
            <dd className="font-mono">{plan.stateId}</dd>
          </div>
          <div>
            <dt className="text-sm opacity-70">Mode</dt>
            <dd className="font-mono">{plan.modeId}</dd>
          </div>
          <div>
            <dt className="text-sm opacity-70">Tool</dt>
            <dd className="font-mono">{plan.toolId}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <h3 className="text-sm font-medium opacity-70">Reasons</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {plan.reasons.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tool Steps */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Selected Tool</h2>
        <p className="mt-2 text-sm opacity-80">{tool.description}</p>

        <ol className="mt-4 grid gap-3">
          {tool.steps.map((step, idx) => (
            <li key={idx} className="rounded border p-3">
              <div className="text-xs uppercase tracking-wide opacity-70">
                {idx + 1}. {step.type}
              </div>
              <div className="mt-1 text-sm">{step.text}</div>
            </li>
          ))}
        </ol>
      </div>

      {/* Logs */}
      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Recent Logs</h2>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm opacity-70">
            No logs loaded yet. Click “Refresh logs”.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="rounded border p-3">
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-70">
                  <span className="font-mono">{l.timestamp}</span>
                  <span className="font-mono">{l.type}</span>
                  {l.loopId && <span className="font-mono">loop:{l.loopId}</span>}
                  {l.loopRunId && <span className="font-mono">run:{l.loopRunId}</span>}
                  {typeof l.stepOrder === "number" && <span className="font-mono">step:{l.stepOrder}</span>}
                  {l.status && <span className="font-mono">status:{l.status}</span>}
                  {l.toolId && <span className="font-mono">tool:{l.toolId}</span>}
                </div>
                <div className="mt-1">{l.message}</div>
                {l.note ? <div className="mt-1 text-xs opacity-70">note: {l.note}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
