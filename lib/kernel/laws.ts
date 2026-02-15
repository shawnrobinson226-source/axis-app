// lib/kernel/laws.ts
// VANTA Kernel — Canonical Laws (invariants / validators)
// NOTE: Laws define constraints. They do not execute workflows.

export type LawId =
  | "TRUTH_VALIDATED_BY_EXECUTION"
  | "EMOTION_IS_DATA_NOT_COMMAND"
  | "IDENTITY_FROM_REPETITION"
  | "CLARITY_OVER_COMFORT"
  | "STRUCTURE_OVER_MOTIVATION"
  | "SAFETY_OVERRIDES_PRIDE"
  | "USER_AGENCY_NONNEGOTIABLE"
  | "NO_MYTHIC_DEPENDENCY_IN_KERNEL";

export type Severity = "info" | "warn" | "error";

export type Law = Readonly<{
  id: LawId;
  title: string;
  statement: string;
  severity: Severity;
  // Optional: simple tags for UI grouping/search. No business logic here.
  tags?: readonly string[];
}>;

export const LAWS: Readonly<Record<LawId, Law>> = {
  TRUTH_VALIDATED_BY_EXECUTION: {
    id: "TRUTH_VALIDATED_BY_EXECUTION",
    title: "Truth is validated by execution",
    statement:
      "System truth is established by completed actions and logged outcomes, not intention or language.",
    severity: "error",
    tags: ["execution", "logging", "integrity"],
  },

  EMOTION_IS_DATA_NOT_COMMAND: {
    id: "EMOTION_IS_DATA_NOT_COMMAND",
    title: "Emotion is data, not command",
    statement:
      "Emotional state informs interpretation and pacing but never overrides constraints or decision authority.",
    severity: "error",
    tags: ["state", "governance"],
  },

  IDENTITY_FROM_REPETITION: {
    id: "IDENTITY_FROM_REPETITION",
    title: "Identity is produced by repetition",
    statement:
      "Identity in VANTA is modeled as patterns of repeated behavior over time, not self-description.",
    severity: "warn",
    tags: ["identity", "patterns"],
  },

  CLARITY_OVER_COMFORT: {
    id: "CLARITY_OVER_COMFORT",
    title: "Clarity beats comfort",
    statement:
      "Outputs prioritize accuracy and actionable clarity over reassurance or persuasion.",
    severity: "warn",
    tags: ["communication", "precision"],
  },

  STRUCTURE_OVER_MOTIVATION: {
    id: "STRUCTURE_OVER_MOTIVATION",
    title: "Structure beats motivation",
    statement:
      "The system relies on repeatable steps and checkpoints rather than motivation, hype, or willpower.",
    severity: "warn",
    tags: ["loops", "consistency"],
  },

  SAFETY_OVERRIDES_PRIDE: {
    id: "SAFETY_OVERRIDES_PRIDE",
    title: "Safety overrides pride",
    statement:
      "If overload risk is detected or reported, the system must downshift intensity and offer exit/grounding paths.",
    severity: "error",
    tags: ["safety", "overwhelm"],
  },

  USER_AGENCY_NONNEGOTIABLE: {
    id: "USER_AGENCY_NONNEGOTIABLE",
    title: "User agency is non-negotiable",
    statement:
      "The user retains final authority. The system can recommend and guide but cannot coerce or force escalation.",
    severity: "error",
    tags: ["agency", "ethics"],
  },

  NO_MYTHIC_DEPENDENCY_IN_KERNEL: {
    id: "NO_MYTHIC_DEPENDENCY_IN_KERNEL",
    title: "Kernel must not depend on symbolic language",
    statement:
      "Kernel logic and data must remain fully understandable and executable without mythic, symbolic, or ritual framing.",
    severity: "error",
    tags: ["boundary", "kernel"],
  },
} as const;

export const LAW_LIST: readonly Law[] = Object.values(LAWS);

export function getLaw(id: LawId): Law {
  return LAWS[id];
}
