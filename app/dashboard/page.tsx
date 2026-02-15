// app/dashboard/page.tsx
export const dynamic = "force-dynamic";

import { listLogs } from "@/lib/storage/logStore";
import type { LogEntry } from "@/lib/kernel/logs";

type LoopId = "DAILY_ANCHOR" | "DAILY_REVIEW" | "WEEKLY_AUDIT";

type LoopRun = {
  loopId: LoopId;
  loopRunId: string;
  startedAt: string;
  dayKey: string;
  weekKey: string;
  requiredSteps: number;
  markedSteps: number;
  complete: boolean;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function weekKeyFromDate(ms: number) {
  const d = new Date(ms);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function computeRuns(logs: readonly LogEntry[]): LoopRun[] {
  const byRun = new Map<string, LogEntry[]>();

  for (const l of logs) {
    if (!l.loopRunId || !l.loopId) continue;
    if (!byRun.has(l.loopRunId)) byRun.set(l.loopRunId, []);
    byRun.get(l.loopRunId)!.push(l);
  }

  const runs: LoopRun[] = [];

  for (const entries of byRun.values()) {
    const start = entries.find((e) => e.type === "LOOP_CHECK");
    if (!start) continue;

    const loopId = start.loopId as LoopId;
    const startedAt = start.timestamp;
    const ms = Date.parse(startedAt);

    const stepOrders = new Set<number>();
    const marked = new Set<number>();

    for (const e of entries) {
      if (e.type === "STEP_CHECK" && typeof e.stepOrder === "number") {
        stepOrders.add(e.stepOrder);
        marked.add(e.stepOrder);
      }
    }

    const required = stepOrders.size;
    const done = marked.size;

    runs.push({
      loopId,
      loopRunId: start.loopRunId!,
      startedAt,
      dayKey: dayKey(startedAt),
      weekKey: weekKeyFromDate(ms),
      requiredSteps: required,
      markedSteps: done,
      complete: required > 0 && done === required,
    });
  }

  return runs.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function thisWeekKey() {
  return weekKeyFromDate(Date.now());
}

function compliance(runs: readonly LoopRun[]) {
  const today = todayKey();
  const week = thisWeekKey();

  const anchorToday = runs.some(
    (r) => r.loopId === "DAILY_ANCHOR" && r.dayKey === today && r.complete
  );

  const reviewToday = runs.some(
    (r) => r.loopId === "DAILY_REVIEW" && r.dayKey === today && r.complete
  );

  const auditThisWeek = runs.some(
    (r) => r.loopId === "WEEKLY_AUDIT" && r.weekKey === week && r.complete
  );

  return { anchorToday, reviewToday, auditThisWeek };
}

function anchorStreak(runs: readonly LoopRun[]) {
  const completedDays = new Set(
    runs
      .filter((r) => r.loopId === "DAILY_ANCHOR" && r.complete)
      .map((r) => r.dayKey)
  );

  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);

  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (!completedDays.has(key)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

function badge(ok: boolean) {
  return (
    <span className={`rounded border px-2 py-0.5 text-xs ${ok ? "" : "opacity-70"}`}>
      {ok ? "✅" : "❌"}
    </span>
  );
}

export default async function DashboardPage() {
  const logs = await listLogs(5000);
  const runs = computeRuns(logs);

  const { anchorToday, reviewToday, auditThisWeek } = compliance(runs);
  const streak = anchorStreak(runs);

  const last = logs[0];

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">VANTA — Dashboard</h1>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Loop Compliance</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded border p-3 flex justify-between">
            <span>Daily Anchor (today)</span>
            {badge(anchorToday)}
          </div>
          <div className="rounded border p-3 flex justify-between">
            <span>Daily Review (today)</span>
            {badge(reviewToday)}
          </div>
          <div className="rounded border p-3 flex justify-between">
            <span>Weekly Audit (this week)</span>
            {badge(auditThisWeek)}
          </div>
        </div>

        <div className="mt-4 rounded border p-3">
          <div className="text-sm opacity-70">Daily Anchor streak</div>
          <div className="mt-1 text-2xl font-semibold">{streak}</div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border p-4">
        <h2 className="text-lg font-medium">Most Recent Entry</h2>
        {!last ? (
          <p className="mt-2 text-sm opacity-70">No logs yet.</p>
        ) : (
          <div className="mt-2 text-sm">
            <div className="font-mono text-xs opacity-70">
              {last.timestamp} {last.type}
            </div>
            <div>{last.message}</div>
          </div>
        )}
      </div>
    </main>
  );
}
