// lib/kernel/modes.ts
// VANTA Kernel — Canonical Modes (response policies)
// Modes control pacing + output style. They never override laws.

export type ModeId = "CLARITY" | "MIRROR" | "COMMAND";

export type OutputStyle =
  | "plain"
  | "reflective"
  | "directive"
  | "step_by_step"
  | "minimal";

export type Mode = Readonly<{
  id: ModeId;
  name: string;
  description: string;

  // How outputs should feel/behave (UI + text policy hints)
  styles: readonly OutputStyle[];

  // Pacing guardrails (0–3)
  intensity: 0 | 1 | 2 | 3;

  // Whether the mode must include explicit consent/exit language
  requiresSafetyCheck: boolean;
}>;

export const MODES: Readonly<Record<ModeId, Mode>> = {
  CLARITY: {
    id: "CLARITY",
    name: "Clarity",
    description:
      "Plain, instructional outputs. Minimal tone. Focus on correctness and steps.",
    styles: ["plain", "step_by_step"],
    intensity: 0,
    requiresSafetyCheck: false,
  },

  MIRROR: {
    id: "MIRROR",
    name: "Mirror",
    description:
      "Reflective and corrective outputs. Exposes contradictions, clarifies intent, tightens language.",
    styles: ["reflective", "step_by_step"],
    intensity: 2,
    requiresSafetyCheck: false,
  },

  COMMAND: {
    id: "COMMAND",
    name: "Command",
    description:
      "Directive outputs focused on immediate execution. Short steps. No debate loops.",
    styles: ["directive", "minimal"],
    intensity: 3,
    requiresSafetyCheck: true,
  },
} as const;

export const MODE_LIST: readonly Mode[] = Object.values(MODES);

export function getMode(id: ModeId): Mode {
  return MODES[id];
}
