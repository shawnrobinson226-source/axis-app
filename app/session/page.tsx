"use client";

import { useState, useTransition } from "react";
import PreflightChecklist from "@/components/vanta/PreflightChecklist";
import { analyzeTrigger } from "@/lib/kernel/v1/analyze";
import { submitSessionForm } from "./actions";

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

const DISTORTION_HELPERS: HelperDefinition[] = [
  {
    value: "narrative",
    label: "Narrative",
    helper: "Story-level interpretation that may overfit to threat or failure.",
  },
  {
    value: "emotional",
    label: "Emotional",
    helper: "A felt state that is being treated as objective proof.",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    helper: "An action pattern that reinforces the loop instead of resolving it.",
  },
  {
    value: "perceptual",
    label: "Perceptual",
    helper: "Attention narrowing that misses context, options, or signal quality.",
  },
  {
    value: "continuity",
    label: "Continuity",
    helper: "Break in identity-consistent follow-through across time.",
  },
];

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

export default function SessionPage() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnalyze(trigger: string) {
    if (!trigger.trim()) return;

    startTransition(() => {
      const analysis = analyzeTrigger(trigger);
      setPreview(analysis);
    });
  }

  const redirectSteps = renderRedirectSteps(preview?.redirect);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <h1 className="text-2xl text-white">Session</h1>

      <form action={submitSessionForm} className="space-y-6">
        <input type="hidden" name="operator_id" value="op_legacy" />

        <PreflightChecklist />

        <div className="space-y-2">
          <label className="text-zinc-200 text-sm" htmlFor="trigger">
            What is happening right now?
          </label>

          <textarea
            id="trigger"
            name="trigger"
            required
            placeholder="Describe the situation..."
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
              <div className="text-sm text-zinc-400">Fracture</div>
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
              <div className="text-sm text-zinc-400">Protocol</div>
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
          <label
            className="text-sm font-medium text-zinc-100"
            htmlFor="distortion_class"
          >
            Distortion class
          </label>
          <select
            id="distortion_class"
            name="distortion_class"
            required
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          >
            <option value="">Select distortion</option>
            {DISTORTION_HELPERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="space-y-1 rounded-md border border-zinc-700 bg-zinc-900 p-3 text-xs text-zinc-300">
            <p className="text-zinc-200">Distortion helper definitions:</p>
            {DISTORTION_HELPERS.map((item) => (
              <p key={item.value}>
                <span className="font-medium">{item.label}:</span> {item.helper}
              </p>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-100" htmlFor="next_action">
            Next action
          </label>
          <textarea
            id="next_action"
            name="next_action"
            required
            placeholder="Next action"
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          />
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

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-zinc-100"
            htmlFor="clarity_0_10"
          >
            Continuity Score (0–10)
          </label>
          <input
            id="clarity_0_10"
            type="number"
            name="clarity_0_10"
            min="0"
            max="10"
            required
            placeholder="Continuity score (0-10)"
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          />
          <p className="text-sm text-zinc-300">
            Rate current continuity for this situation on a 0 to 10 scale. 0 =
            fully broken, 10 = fully aligned.
          </p>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-zinc-100"
            htmlFor="steps_completed"
          >
            Steps Completed
          </label>
          <input
            id="steps_completed"
            type="number"
            name="steps_completed"
            min="0"
            max="9"
            required
            placeholder="Steps completed (0-9)"
            className="w-full rounded-md border border-zinc-500 bg-zinc-800 p-3 text-zinc-50"
          />
          <p className="text-sm text-zinc-300">
            Enter how many execution steps were completed in this session so
            far.
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-100 px-4 py-2 text-zinc-900 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </main>
  );
}
