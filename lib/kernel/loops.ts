// lib/kernel/loops.ts
// VANTA Kernel — Canonical Loops (repeatable cycles)
// Loops define cadence + checkpoints. No execution logic here.

import type { ToolId } from "./tools";
import type { ModeId } from "./modes";
import type { StateId } from "./states";

export type LoopId = "DAILY_ANCHOR" | "DAILY_REVIEW" | "WEEKLY_AUDIT";

export type Frequency = "daily" | "weekly";

export type LoopStep = Readonly<{
  order: number;
  label: string;

  // Optional tool to run at this step
  toolId?: ToolId;

  // Optional: states this step is most relevant for
  relevantStates?: readonly StateId[];

  // Optional: preferred mode for the step
  preferredMode?: ModeId;
}>;

export type Loop = Readonly<{
  id: LoopId;
  name: string;
  description: string;
  frequency: Frequency;

  // Suggested duration target in minutes
  targetMinutes: number;

  steps: readonly LoopStep[];
}>;

export const LOOPS: Readonly<Record<LoopId, Loop>> = {
  DAILY_ANCHOR: {
    id: "DAILY_ANCHOR",
    name: "Daily Anchor",
    description:
      "One small daily action that maintains continuity and prevents drift.",
    frequency: "daily",
    targetMinutes: 10,
    steps: [
      {
        order: 1,
        label: "Confirm today’s single priority",
        toolId: "CLARIFY_NEXT_STEP",
        preferredMode: "CLARITY",
        relevantStates: ["FOG", "DRIFT"],
      },
      {
        order: 2,
        label: "Execute a micro-start if resistance appears",
        toolId: "MICRO_ACTION",
        preferredMode: "COMMAND",
        relevantStates: ["HESITATION"],
      },
      {
        order: 3,
        label: "Log completion or schedule the next attempt",
        preferredMode: "CLARITY",
      },
    ],
  },

  DAILY_REVIEW: {
    id: "DAILY_REVIEW",
    name: "Daily Review",
    description:
      "Short end-of-day check to keep logs honest and reduce contradiction.",
    frequency: "daily",
    targetMinutes: 7,
    steps: [
      {
        order: 1,
        label: "Check for mismatch between intent and actions",
        toolId: "CONTRADICTION_CHECK",
        preferredMode: "MIRROR",
        relevantStates: ["CONTRADICTION"],
      },
      {
        order: 2,
        label: "If overload is present, downshift",
        toolId: "GROUNDING_PAUSE",
        preferredMode: "CLARITY",
        relevantStates: ["OVERWHELM", "RECOVERY"],
      },
      {
        order: 3,
        label: "Set the minimum for tomorrow",
        toolId: "RECOVERY_MINIMUM",
        preferredMode: "CLARITY",
        relevantStates: ["RECOVERY", "OVERWHELM"],
      },
    ],
  },

  WEEKLY_AUDIT: {
    id: "WEEKLY_AUDIT",
    name: "Weekly Audit",
    description:
      "Weekly review of consistency, drift points, and loop adherence.",
    frequency: "weekly",
    targetMinutes: 20,
    steps: [
      {
        order: 1,
        label: "Review completed logs and missed commitments",
        preferredMode: "CLARITY",
      },
      {
        order: 2,
        label: "Identify top drift cause and remove one obstacle",
        toolId: "RESTORE_STRUCTURE",
        preferredMode: "CLARITY",
        relevantStates: ["DRIFT"],
      },
      {
        order: 3,
        label: "Choose one adjustment for next week",
        preferredMode: "CLARITY",
      },
    ],
  },
} as const;

export const LOOP_LIST: readonly Loop[] = Object.values(LOOPS);

export function getLoop(id: LoopId): Loop {
  return LOOPS[id];
}
