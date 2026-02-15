// lib/kernel/states.ts
// VANTA Kernel — Canonical States (detectable user conditions)
// States are inputs to resolution logic; they are not outcomes or identities.

export type StateId =
  | "BASELINE"
  | "FOG"
  | "DRIFT"
  | "OVERWHELM"
  | "HESITATION"
  | "CONTRADICTION"
  | "RECOVERY";

export type StateSignal =
  | "self_report"
  | "behavior"
  | "time"
  | "log_gap"
  | "system";

export type State = Readonly<{
  id: StateId;
  name: string;
  description: string;
  signals: readonly StateSignal[];
  intensity: 0 | 1 | 2 | 3;
}>;

export const STATES: Readonly<Record<StateId, State>> = {
  BASELINE: {
    id: "BASELINE",
    name: "Baseline",
    description:
      "User is stable enough to plan and execute standard steps without downshifting.",
    signals: ["self_report", "behavior"],
    intensity: 0,
  },

  FOG: {
    id: "FOG",
    name: "Fog",
    description:
      "Confusion, low clarity, or difficulty naming the next step. Needs simplification and narrowing.",
    signals: ["self_report", "behavior"],
    intensity: 1,
  },

  DRIFT: {
    id: "DRIFT",
    name: "Drift",
    description:
      "Loss of structure or focus over time (missed loop steps, wandering attention, inconsistent follow-through).",
    signals: ["time", "log_gap", "behavior"],
    intensity: 1,
  },

  OVERWHELM: {
    id: "OVERWHELM",
    name: "Overwhelm",
    description:
      "User reports overload or exhibits shutdown patterns. System must downshift and offer grounding/exit options.",
    signals: ["self_report", "behavior", "system"],
    intensity: 3,
  },

  HESITATION: {
    id: "HESITATION",
    name: "Hesitation",
    description:
      "User is stuck at the edge of action (overthinking, looping, delay). Needs a small executable step.",
    signals: ["behavior", "time"],
    intensity: 2,
  },

  CONTRADICTION: {
    id: "CONTRADICTION",
    name: "Contradiction",
    description:
      "Mismatch between stated intent/values and observed action/logs. Needs clarification and constraint reminder.",
    signals: ["log_gap", "behavior", "system"],
    intensity: 2,
  },

  RECOVERY: {
    id: "RECOVERY",
    name: "Recovery",
    description:
      "After overload or disruption. Focus is stabilization, minimal commitments, and restoring a basic loop.",
    signals: ["self_report", "system", "time"],
    intensity: 2,
  },
} as const;

export const STATE_LIST: readonly State[] = Object.values(STATES);

export function getState(id: StateId): State {
  return STATES[id];
}
