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
  const [preview, setPreview] = useState<any>(null);
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

        <textarea
          name="trigger"
          required
          placeholder="What happened?"
          onBlur={(e) => handleAnalyze(e.target.value)}
          className="w-full border p-3 bg-black text-white"
        />

        {preview && (
          <div className="border p-4 bg-zinc-900 text-white space-y-3">
            <div>
              <strong>Fracture:</strong>{" "}
              {renderPreviewValue(preview.fracture)}
            </div>

            <div>
              <strong>Reframe:</strong> {renderPreviewValue(preview.reframe)}
            </div>

            <div>
              <strong>Suggested Action:</strong>
              <ul className="list-disc ml-5">
                {redirectSteps.length > 0 ? (
                  redirectSteps.map((step, i) => <li key={i}>{step}</li>)
                ) : (
                  <li>No suggested steps.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <select
          name="distortion_class"
          required
          className="w-full p-2 bg-black text-white"
        >
          <option value="">Select distortion</option>
          <option value="narrative">Narrative</option>
          <option value="emotional">Emotional</option>
          <option value="behavioral">Behavioral</option>
          <option value="perceptual">Perceptual</option>
          <option value="continuity">Continuity</option>
        </select>

        <textarea
          name="next_action"
          required
          placeholder="Next action"
          className="w-full border p-3 bg-black text-white"
        />

        <select
          name="outcome"
          required
          className="w-full p-2 bg-black text-white"
        >
          <option value="">Select outcome</option>
          <option value="reduced">Reduced</option>
          <option value="unresolved">Unresolved</option>
          <option value="escalated">Escalated</option>
        </select>

        <input
          type="number"
          name="clarity_0_10"
          min="0"
          max="10"
          required
          className="w-full p-2 bg-black text-white"
        />
        <input
          type="number"
          name="steps_completed"
          min="0"
          max="9"
          required
          className="w-full p-2 bg-black text-white"
        />

        <button
          type="submit"
          disabled={isPending}
          className="bg-white text-black px-4 py-2 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </form>
    </main>
  );
}