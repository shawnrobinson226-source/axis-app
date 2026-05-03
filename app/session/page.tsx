"use client";

import { useState, useTransition } from "react";
import PreflightChecklist from "@/components/vanta/PreflightChecklist";
import { analyzeTrigger } from "@/lib/kernel/v1/analyze";
import { getOrCreateOperatorId } from "@/lib/operator/client";

type PreviewValue =
  | string
  | {
      id?: string;
      label?: string;
      description?: string;
      signals?: string[];
    }
  | null
  | undefined;

type Preview = {
  fracture?: PreviewValue;
  reframe?: PreviewValue;
  redirect?: unknown;
};

type DistortionClass =
  | "narrative"
  | "emotional"
  | "behavioral"
  | "perceptual"
  | "continuity";

type SessionApiResponse = {
  ok?: boolean;
  error?: string;
  data?: {
    protocol_output?: string;
  };
};

const BELL_CONFIRMATION_TEXT = "I decline execution.";

function renderPreviewValue(value: PreviewValue) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "Unknown";
  if (typeof value.label === "string" && value.label.trim()) return value.label;
  if (typeof value.description === "string" && value.description.trim()) {
    return value.description;
  }
  if (typeof value.id === "string" && value.id.trim()) return value.id;
  return "Unknown";
}

function renderRedirectSteps(redirect: unknown): string[] {
  if (Array.isArray(redirect)) {
    return redirect.map((step) => String(step));
  }

  if (
    redirect &&
    typeof redirect === "object" &&
    "steps" in redirect &&
    Array.isArray((redirect as { steps?: unknown[] }).steps)
  ) {
    return ((redirect as { steps: unknown[] }).steps ?? []).map((step) =>
      String(step),
    );
  }

  return [];
}

function classifyFromAnalysis(preview: Preview | null): DistortionClass {
  const fractureId =
    preview?.fracture && typeof preview.fracture === "object"
      ? preview.fracture.id
      : "";

  switch (fractureId) {
    case "avoidance_loop":
    case "boundary_violation":
    case "over_responsibility":
      return "behavioral";
    case "rejection_sensitivity":
    case "shame_spike":
      return "emotional";
    case "comparison_spiral":
    case "self_worth_dependency":
    case "status_threat":
      return "narrative";
    case "control_loss":
    case "uncertainty_intolerance":
    default:
      return "perceptual";
  }
}

function formatClassification(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const AXIS_ACTION_FALLBACKS: Record<DistortionClass, string> = {
  narrative:
    "Write the claim in one sentence. Then write one observable fact that supports or weakens it.",
  emotional:
    "Pause for 60 seconds. Name the emotion once. Do not act until the timer ends.",
  behavioral:
    "Start the smallest physical step now and continue for two minutes without evaluating.",
  perceptual: "Write three facts and three assumptions. Act only on the facts.",
  continuity:
    "Name the objective, identify the deviation, and execute the next aligned step within five minutes.",
};

function fallbackActionFor(distortion: DistortionClass) {
  return AXIS_ACTION_FALLBACKS[distortion];
}

function getAxisAction(preview: Preview | null) {
  const distortion = classifyFromAnalysis(preview);
  const steps = renderRedirectSteps(preview?.redirect);
  return steps[0] || fallbackActionFor(distortion);
}

export default function SessionPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const operatorId =
    typeof window === "undefined" ? "" : getOrCreateOperatorId();
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("saved") === "1",
  );
  const [saveError, setSaveError] = useState("");
  const [protocolOutput, setProtocolOutput] = useState<string | null>(null);
  const [actionResolution, setActionResolution] = useState<
    "executed" | "not_executed" | null
  >(null);
  const [showBellCheckpoint, setShowBellCheckpoint] = useState(false);
  const [bellInput, setBellInput] = useState("");

  function handleAnalyze(trigger: string) {
    if (!trigger.trim()) return;

    const analysis = analyzeTrigger(trigger);
    startTransition(() => {
      setPreview(analysis);
    });
    setActionResolution(null);
    setShowBellCheckpoint(false);
    setBellInput("");
    return analysis;
  }

  const classification = classifyFromAnalysis(preview);
  const axisAction = preview ? getAxisAction(preview) : "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!operatorId) {
      setSaveError("Operator identity is required.");
      setShowSavedConfirmation(false);
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const trigger = String(formData.get("trigger") ?? "");
    const analysis = preview ?? handleAnalyze(trigger) ?? analyzeTrigger(trigger);
    const classificationForSave = classifyFromAnalysis(analysis);
    const actionForSave = getAxisAction(analysis);
    const outcomeForSave =
      actionResolution === "executed" ? "reduced" : "unresolved";

    const payload = {
      trigger,
      classification: classificationForSave,
      next_action: actionForSave,
      outcome: outcomeForSave,
      stability: Number(formData.get("stability") ?? 5),
      reference: String(formData.get("reference") ?? "") === "yes",
      impact: Number(formData.get("impact") ?? 3),
    };

    setIsSaving(true);
    setSaveError("");
    setProtocolOutput(null);
    setActionResolution(null);
    setShowBellCheckpoint(false);
    setBellInput("");
    setShowSavedConfirmation(false);

    try {
      const response = await fetch("/api/v1/session", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-operator-id": operatorId,
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as SessionApiResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Failed to save session.");
      }

      setProtocolOutput(
        typeof body.data?.protocol_output === "string" &&
          body.data.protocol_output.trim()
          ? body.data.protocol_output
          : "Protocol output unavailable.",
      );
      setShowSavedConfirmation(true);
      form.reset();
      setPreview(null);
      setActionResolution(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  }

  function confirmBellCheckpoint() {
    if (
  bellInput.trim().toLowerCase() !==
  BELL_CONFIRMATION_TEXT.toLowerCase()
) {
      return;
    }

    setActionResolution("not_executed");
    setShowBellCheckpoint(false);
    setBellInput("");
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <h1 className="text-2xl text-white">AXIS / Session</h1>
      <p className="text-sm text-zinc-300">
        AXIS classifies. AXIS returns one action. You execute or decline.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-100">1. Pre-Flight</p>
          <p className="text-sm text-zinc-300">
            Answer these checks before entering the session.
          </p>
        </div>

        <PreflightChecklist />

        <div className="space-y-2">
          <label className="text-zinc-200 text-sm" htmlFor="trigger">
            2. Describe Situation
          </label>

          <textarea
            id="trigger"
            name="trigger"
            required
            placeholder="e.g., I got critical feedback from my manager and immediately felt defensive."
            onBlur={(e) => handleAnalyze(e.target.value)}
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          />

          <p className="text-sm text-zinc-300">
            Describe the situation clearly. What is the problem, task, or
            decision you are facing?
          </p>

          <div className="space-y-1 text-xs text-zinc-400">
            <p>Examples:</p>
            <p>- I am trying to set something up but it keeps failing</p>
            <p>- I keep avoiding my workouts</p>
            <p>- I do not know how to start this project</p>
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-zinc-700 bg-zinc-800 p-4 text-zinc-100">
          <div>
            <div className="text-sm text-zinc-400">3. System Classification</div>
            <div className="font-medium">
              {preview
                ? formatClassification(classification)
                : "Classification appears after the situation is processed."}
            </div>
          </div>

          {preview ? (
            <div>
              <div className="text-sm text-zinc-400">Detected Structure</div>
              <div className="font-medium">
                {renderPreviewValue(preview.fracture)}
              </div>
            </div>
          ) : null}

          <div>
            <div className="text-sm text-zinc-400">4. AXIS Action</div>
            <div className="mt-2 rounded-md border border-zinc-700 bg-zinc-900 p-3 text-sm leading-6 text-zinc-100">
              {preview
                ? axisAction
                : "AXIS action appears after the situation is processed."}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-zinc-700 bg-zinc-900 p-4">
          <div className="text-sm font-medium text-zinc-100">
            5. Execution Decision
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setActionResolution("executed")}
              disabled={!preview}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Execute
            </button>
            <button
              type="button"
              onClick={() => {
                setBellInput("");
                setShowBellCheckpoint(true);
              }}
              disabled={!preview}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Not Executed / Ring Bell
            </button>
          </div>
          {actionResolution ? (
            <p className="text-sm text-zinc-400">
              {actionResolution === "executed"
                ? "Executed."
                : "Execution declined. Pattern remains active."}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!preview || isPending || isSaving}
          className="rounded-md bg-zinc-100 px-4 py-2 text-zinc-900 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Log Session"}
        </button>

        {showSavedConfirmation && (
          <div className="space-y-4 rounded-md border border-zinc-700 bg-zinc-900 p-4">
            <p className="text-sm text-zinc-300">
              Session logged.{" "}
              <a
                href="/dashboard"
                className="text-zinc-100 underline decoration-zinc-500 underline-offset-2 transition hover:decoration-zinc-300"
              >
                View in Dashboard →
              </a>
            </p>

            <div>
              <div className="text-sm font-medium text-zinc-100">
                Protocol Output
              </div>
              <pre className="mt-3 whitespace-pre-wrap rounded-md border border-zinc-800 bg-black p-4 text-sm leading-6 text-zinc-100">
                {protocolOutput ?? "Protocol output unavailable."}
              </pre>
            </div>

          </div>
        )}

        {showBellCheckpoint ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
            <div className="w-full max-w-lg space-y-5 rounded-md border border-zinc-700 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Ring the Bell</h2>
                <div className="space-y-3 text-sm leading-6 text-zinc-300">
                  <p>Execution declined. Pattern remains active.</p>
                  <p>To continue, type exactly:</p>
                  <p className="font-medium text-zinc-100">
                    {BELL_CONFIRMATION_TEXT}
                  </p>
                </div>
              </div>

              <input
                value={bellInput}
                onChange={(event) => setBellInput(event.target.value)}
                className="w-full rounded-md border border-zinc-600 bg-black p-3 text-zinc-50"
                aria-label="Bell confirmation"
              />

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBellCheckpoint(false);
                    setBellInput("");
                  }}
                  className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500"
                >
                  Return to Action
                </button>
                <button
                  type="button"
                  onClick={confirmBellCheckpoint}
                  disabled={bellInput !== BELL_CONFIRMATION_TEXT}
                  className="rounded-md bg-zinc-100 px-4 py-2 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Record Skip
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {saveError ? <p className="text-sm text-red-300">{saveError}</p> : null}
      </form>
    </main>
  );
}
