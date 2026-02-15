// lib/engine/stateResolver.ts
// Engine — Deterministic state resolution (no AI)
// Guardian framing: identify distortion + protect future projection.

import type { StateId } from "../kernel/states";
import { guardianWhyLine } from "../kernel/intent";

export type SelfReport =
  | "baseline"
  | "fog"
  | "drift"
  | "overwhelm"
  | "hesitation"
  | "contradiction"
  | "recovery";

export type StateResolutionInput = Readonly<{
  selfReport?: SelfReport;
  minutesSinceLastAction?: number;
  overloadFlag?: boolean;
}>;

export type StateResolutionResult = Readonly<{
  stateId: StateId;
  reasons: readonly string[];
}>;

function clampNonNegative(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function resolveState(input: StateResolutionInput): StateResolutionResult {
  const reasons: string[] = [];

  // 1) Safety override
  if (input.overloadFlag === true || input.selfReport === "overwhelm") {
    reasons.push("Distortion detected: overload risk is active.");
    reasons.push(
      guardianWhyLine(
        "Reducing load prevents harmful escalation and preserves long-term integrity."
      )
    );
    return { stateId: "OVERWHELM", reasons };
  }

  // 2) Direct self-report mapping
  if (input.selfReport) {
    const map: Record<SelfReport, StateId> = {
      baseline: "BASELINE",
      fog: "FOG",
      drift: "DRIFT",
      overwhelm: "OVERWHELM",
      hesitation: "HESITATION",
      contradiction: "CONTRADICTION",
      recovery: "RECOVERY",
    };

    const mapped = map[input.selfReport];
    reasons.push(`Distortion classified from self-report: ${mapped}.`);
    reasons.push(
      guardianWhyLine(
        "Naming the condition early reduces drift and supports consistent alignment."
      )
    );
    return { stateId: mapped, reasons };
  }

  // 3) Heuristic fallback: time since last action
  const mins = clampNonNegative(input.minutesSinceLastAction ?? 0);

  if (mins === 0) {
    reasons.push("No self-report and no time signal; defaulting to BASELINE.");
    reasons.push(
      guardianWhyLine(
        "Least invasive default; preserves momentum without unnecessary pressure."
      )
    );
    return { stateId: "BASELINE", reasons };
  }

  if (mins >= 24 * 60) {
    reasons.push("No action logged for 24+ hours; likely drift.");
    reasons.push(
      guardianWhyLine("Restoring structure protects future trajectory from slow decay.")
    );
    return { stateId: "DRIFT", reasons };
  }

  if (mins >= 6 * 60) {
    reasons.push("No action logged for 6+ hours; possible drift.");
    reasons.push(
      guardianWhyLine("A small reset prevents drift from compounding into avoidance.")
    );
    return { stateId: "DRIFT", reasons };
  }

  reasons.push("Recent action detected; defaulting to BASELINE.");
  reasons.push(
    guardianWhyLine(
      "Continuity is intact; proceed with the next right step without escalation."
    )
  );
  return { stateId: "BASELINE", reasons };
}
