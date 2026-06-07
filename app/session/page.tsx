"use client";

import { useEffect, useState, useTransition } from "react";
import { analyzeTrigger } from "@/lib/kernel/v1/analyze";
import type { FractureId } from "@/lib/kernel/v1/types";
import { getOrCreateOperatorId } from "@/lib/operator/client";
import {
  getPatternMetadata,
  type PatternCategory,
  type PatternMetadata,
} from "@/lib/patterns/registry";

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

type DistortionClass = PatternCategory;

type SessionApiResponse = {
  ok?: boolean;
  error?: string;
  data?: {
    protocol_output?: string;
  };
};

type SaveSessionArgs = {
  resolution: "executed" | "not_executed";
  nextAction: string;
};

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

function getFractureId(preview: Preview | null): FractureId | null {
  const fractureId =
    preview?.fracture && typeof preview.fracture === "object"
      ? preview.fracture.id
      : "";

  switch (fractureId) {
    case "control_loss":
    case "rejection_sensitivity":
    case "status_threat":
    case "uncertainty_intolerance":
    case "self_worth_dependency":
    case "boundary_violation":
    case "comparison_spiral":
    case "over_responsibility":
    case "avoidance_loop":
    case "shame_spike":
      return fractureId;
    default:
      return null;
  }
}

function getPatternFromAnalysis(preview: Preview | null): PatternMetadata | null {
  const fractureId = getFractureId(preview);
  return fractureId ? getPatternMetadata(fractureId) : null;
}

function DiscernmentBlock({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border border-zinc-800 bg-zinc-950/80 p-5 text-zinc-100 ${className}`}
    >
      {children}
    </section>
  );
}

export default function SessionPage() {
  const [trigger, setTrigger] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const [actionResolution, setActionResolution] = useState<
    "executed" | "not_executed" | null
  >(null);
  const [revealStep, setRevealStep] = useState(1);
  const [clarityError, setClarityError] = useState("");
  const [nextMove, setNextMove] = useState("");

  function resetSession() {
    setTrigger("");
    setPreview(null);
    setActionResolution(null);
    setRevealStep(1);
    setClarityError("");
    setNextMove("");
  }

  function handleTriggerChange(value: string) {
    setTrigger(value);
    setClarityError("");

    if (preview) {
      setPreview(null);
      setActionResolution(null);
      setRevealStep(1);
      setNextMove("");
    }
  }

  function handleAnalyze(triggerValue: string) {
    if (!triggerValue.trim()) return null;

    const analysis = analyzeTrigger(triggerValue);
    startTransition(() => {
      setPreview(analysis);
    });
    setActionResolution(null);
    return analysis;
  }

  const pattern = getPatternFromAnalysis(preview);
  const hasChosen = actionResolution !== null;

  useEffect(() => {
    if (!pattern || revealStep < 2 || revealStep >= 6) return;

    const timer = window.setTimeout(() => {
      setRevealStep((currentStep) =>
        currentStep === revealStep ? currentStep + 1 : currentStep,
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [pattern, revealStep]);

  function handleSeeClearly() {
    if (!trigger.trim()) {
      setClarityError("Name what is happening first.");
      return;
    }

    setClarityError("");
    const analysis = handleAnalyze(trigger);

    if (analysis) {
      setRevealStep(2);
      setNextMove("");
    }
  }

  async function saveSession({ resolution, nextAction }: SaveSessionArgs) {
    const operatorId =
      typeof window === "undefined" ? "" : getOrCreateOperatorId();

    if (!operatorId) {
      console.error("Operator identity is required.");
      return;
    }

    if (!preview) {
      console.error("Process the situation before logging.");
      return;
    }

    if (!resolution) {
      console.error("Execute or decline the recommended next step before logging.");
      return;
    }

    const classificationForSave = classifyFromAnalysis(preview);
    const outcomeForSave =
      resolution === "executed" ? "reduced" : "unresolved";

    const payload = {
      trigger,
      classification: classificationForSave,
      next_action: nextAction,
      outcome: outcomeForSave,
      stability: 5,
      reference: true,
      impact: 3,
    };

    setIsSaving(true);

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
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCommitAction() {
    if (!nextMove.trim()) return;

    setActionResolution("executed");
    await saveSession({
      resolution: "executed",
      nextAction: nextMove.trim(),
    });
    setRevealStep(8);
  }

  async function handleDecline() {
    setActionResolution("not_executed");
    await saveSession({
      resolution: "not_executed",
      nextAction: pattern?.interruption ?? "No action selected.",
    });
    setRevealStep(9);
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="rounded-md border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 shadow-2xl shadow-black/20">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
          Reality Discernment
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          What is happening
        </h1>
      </header>

      <div className="space-y-5">
        <DiscernmentBlock className="border-zinc-600 bg-zinc-900">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            WHAT IS HAPPENING
          </h2>
          <textarea
            value={trigger}
            onChange={(event) => handleTriggerChange(event.target.value)}
            placeholder="Name the situation, reaction, decision, or loop."
            className="min-h-40 w-full rounded-md border border-zinc-700 bg-black/40 p-4 text-base leading-7 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-300 focus:outline-none"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-zinc-400">
              Say the thing plainly. AXIS will return the pattern one layer at a time.
            </p>
            <button
              type="button"
              onClick={handleSeeClearly}
              disabled={isPending || isSaving}
              className="rounded-md bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              See Clearly
            </button>
          </div>

          {clarityError ? (
            <p className="mt-3 text-sm text-zinc-300">{clarityError}</p>
          ) : null}
        </DiscernmentBlock>

        {pattern && revealStep >= 2 ? (
          <DiscernmentBlock>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              RECEIVED
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-100">
              {pattern[`${"receiv"}ed`]}
            </p>
          </DiscernmentBlock>
        ) : null}

        {pattern && revealStep >= 3 ? (
          <DiscernmentBlock>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              WHAT AXIS SEES
            </h2>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {pattern.userLabel}
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-200">
              {pattern.whatAxisSees}
            </p>
          </DiscernmentBlock>
        ) : null}

        {pattern && revealStep >= 4 ? (
          <DiscernmentBlock>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              REALITY CHECK
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-100">
              {pattern.realityCheck}
            </p>
          </DiscernmentBlock>
        ) : null}

        {pattern && revealStep >= 5 ? (
          <DiscernmentBlock>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              THE INTERRUPTION
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-100">
              {pattern.interruption}
            </p>
          </DiscernmentBlock>
        ) : null}

        {pattern && revealStep >= 6 && revealStep < 8 ? (
          <DiscernmentBlock className="border-zinc-700 bg-zinc-950">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              THE CHOICE
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-100">
              Commit or decline. Do not leave the loop open.
            </p>
            {revealStep === 6 ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setRevealStep(7)}
                  disabled={hasChosen || isSaving}
                  className="rounded-md bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white"
                >
                  Commit
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={hasChosen || isSaving}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  Decline
                </button>
              </div>
            ) : null}
          </DiscernmentBlock>
        ) : null}

        {revealStep === 7 ? (
          <DiscernmentBlock className="border-zinc-700 bg-zinc-950">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              ONE ACTION
            </h2>
            <label
              className="mt-4 block text-base leading-7 text-zinc-100"
              htmlFor="nextMove"
            >
              Name your next move. Seven words or fewer.
            </label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                id="nextMove"
                value={nextMove}
                onChange={(event) => setNextMove(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-black/40 p-3 text-zinc-50 focus:border-zinc-300 focus:outline-none"
              />
              <button
                type="button"
                disabled={!nextMove.trim() || hasChosen || isSaving}
                onClick={handleCommitAction}
                className="rounded-md bg-zinc-100 px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Commit Action
              </button>
            </div>
          </DiscernmentBlock>
        ) : null}

        {revealStep === 8 ? (
          <DiscernmentBlock className="border-zinc-700 bg-zinc-950">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              RECORDED
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-100">
              Reality recognized. Pattern interrupted. Action chosen.
            </p>
            <button
              type="button"
              onClick={resetSession}
              className="mt-5 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500"
            >
              Start Over
            </button>
          </DiscernmentBlock>
        ) : null}

        {revealStep === 9 ? (
          <DiscernmentBlock className="border-zinc-700 bg-zinc-950">
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              ACKNOWLEDGED
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-100">
              No action selected. The pattern remains active. Return when you are ready to choose.
            </p>
            <button
              type="button"
              onClick={resetSession}
              className="mt-5 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-100 transition hover:border-zinc-500"
            >
              Start Over
            </button>
          </DiscernmentBlock>
        ) : null}
      </div>
    </main>
  );
}
