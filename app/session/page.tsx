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

type HelperDefinition = {
  value: string;
  label: string;
  helper: string;
};

const OUTCOME_HELPERS: HelperDefinition[] = [
  {
    value: "reduced",
    label: "Reduced",
    helper: "Loop intensity dropped and the system regained traction.",
  },
  {
    value: "unresolved",
    label: "Unresolved",
    helper: "No meaningful change yet; loop remains active.",
  },
  {
    value: "escalated",
    label: "Escalated",
    helper: "Loop intensified or spread into additional failure patterns.",
  },
];

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

function classifyFromAnalysis(preview: Preview | null) {
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

  function handleAnalyze(trigger: string) {
    if (!trigger.trim()) return;

    const analysis = analyzeTrigger(trigger);
    startTransition(() => {
      setPreview(analysis);
    });
    return analysis;
  }

  const redirectSteps = renderRedirectSteps(preview?.redirect);
  const classification = classifyFromAnalysis(preview);

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

  const payload = {
    trigger,
    classification: classificationForSave,
    next_action: String(formData.get("next_action") ?? ""),
    outcome: String(formData.get("outcome") ?? ""),
    stability: Number(formData.get("stability") ?? 5),
    reference: String(formData.get("reference") ?? "") === "yes",
    impact: Number(formData.get("impact") ?? 3),
  };

    setIsSaving(true);
    setSaveError("");
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

      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !body.ok) {
        throw new Error(body.error ?? "Failed to save session.");
      }

      setShowSavedConfirmation(true);
      form.reset();
      setPreview(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <h1 className="text-2xl text-white">AXIS / Session</h1>
      <p className="text-sm text-zinc-300">The system structures. You decide.</p>

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

        {preview && (
          <div className="space-y-4 rounded-md border border-zinc-700 bg-zinc-800 p-4 text-zinc-100">
            <div>
              <div className="text-sm text-zinc-400">3. System Classification</div>
              <div className="font-medium">{formatClassification(classification)}</div>
            </div>

            <div>
              <div className="text-sm text-zinc-400">Detected Structure</div>
              <div className="font-medium">
                {renderPreviewValue(preview.fracture)}
              </div>
            </div>

            <div>
              <div className="text-sm text-zinc-400">Reframe</div>
              <div className="font-medium">
                {renderPreviewValue(preview.reframe)}
              </div>
            </div>

            <div>
              <div className="text-sm text-zinc-400">Signal Protocol</div>
              <ol className="ml-5 list-decimal space-y-1">
                {redirectSteps.length > 0 ? (
                  redirectSteps.map((step, i) => <li key={i}>{step}</li>)
                ) : (
                  <li>No steps available.</li>
                )}
              </ol>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-100" htmlFor="next_action">
            4. Next Action
          </label>
          <textarea
            id="next_action"
            name="next_action"
            required
            placeholder="e.g., Rewrite the event in factual terms and send one clear response."
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          />
          <p className="text-sm text-zinc-300">
            Enter the next concrete action to take now. Keep it short and specific.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-100" htmlFor="outcome">
            Outcome
          </label>
          <select
            id="outcome"
            name="outcome"
            required
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          >
            <option value="">Select outcome</option>
            {OUTCOME_HELPERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="space-y-1 rounded-md border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-300">
            <p className="text-zinc-200">Outcome helper definitions:</p>
            {OUTCOME_HELPERS.map((item) => (
              <p key={item.value}>
                <span className="font-medium">{item.label}:</span> {item.helper}
              </p>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isSaving}
          className="rounded-md bg-zinc-100 px-4 py-2 text-zinc-900 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "5. Save"}
        </button>

        {showSavedConfirmation && (
          <p className="text-sm text-zinc-300">
            Session logged.{" "}
            <a
              href="/dashboard"
              className="text-zinc-100 underline decoration-zinc-500 underline-offset-2 transition hover:decoration-zinc-300"
            >
              View in Dashboard →
            </a>
          </p>
        )}

        {saveError ? <p className="text-sm text-red-300">{saveError}</p> : null}
      </form>
    </main>
  );
}
