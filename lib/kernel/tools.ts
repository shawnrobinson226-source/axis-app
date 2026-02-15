// lib/kernel/tools.ts
// VANTA Kernel — Canonical Tools (executable action sequences)
// Tools are deterministic recipes. No AI. No side effects here—just definitions.

import type { StateId } from "./states";
import type { ModeId } from "./modes";

export type ToolId =
  | "GROUNDING_PAUSE"
  | "CLARIFY_NEXT_STEP"
  | "RESTORE_STRUCTURE"
  | "MICRO_ACTION"
  | "CONTRADICTION_CHECK"
  | "RECOVERY_MINIMUM";

export type ToolStepType = "prompt" | "action" | "log";

export type ToolStep = Readonly<{
  type: ToolStepType;
  text: string;
}>;

export type Tool = Readonly<{
  id: ToolId;
  name: string;
  description: string;
  recommendedForStates: readonly StateId[];
  recommendedModes: readonly ModeId[];
  steps: readonly ToolStep[];
}>;

export const TOOLS: Readonly<Record<ToolId, Tool>> = {
  GROUNDING_PAUSE: {
    id: "GROUNDING_PAUSE",
    name: "Grounding Pause",
    description:
      "Downshift intensity, stabilize, and ensure the user can continue safely.",
    recommendedForStates: ["OVERWHELM", "RECOVERY"],
    recommendedModes: ["CLARITY", "COMMAND"],
    steps: [
      { type: "prompt", text: "Pause. You are allowed to downshift." },
      { type: "action", text: "Take 5 slow breaths (inhale 4 seconds, exhale 6 seconds)." },
      { type: "action", text: "Name the current load in one sentence (facts only)." },
      { type: "prompt", text: "Choose: continue at low intensity OR stop and return later." },
      { type: "log", text: "Log overwhelm level (0–3) and chosen next action." },
    ],
  },

  CLARIFY_NEXT_STEP: {
    id: "CLARIFY_NEXT_STEP",
    name: "Clarify Next Step",
    description:
      "Reduce ambiguity and produce a single concrete next action.",
    recommendedForStates: ["FOG", "CONTRADICTION"],
    recommendedModes: ["CLARITY", "MIRROR"],
    steps: [
      { type: "prompt", text: "Write the objective in one sentence." },
      { type: "prompt", text: "List 3 possible next steps (short phrases)." },
      { type: "action", text: "Choose the smallest step that fits in 10 minutes." },
      { type: "log", text: "Log chosen step and start time." },
    ],
  },

  RESTORE_STRUCTURE: {
    id: "RESTORE_STRUCTURE",
    name: "Restore Structure",
    description:
      "Re-establish a basic loop when drift occurs.",
    recommendedForStates: ["DRIFT"],
    recommendedModes: ["CLARITY", "COMMAND"],
    steps: [
      { type: "action", text: "Pick ONE daily anchor time (morning or evening)." },
      { type: "action", text: "Define ONE repeatable 5–10 minute action." },
      { type: "prompt", text: "Remove one obstacle blocking consistency." },
      { type: "log", text: "Log anchor time, action, and obstacle removed." },
    ],
  },

  MICRO_ACTION: {
    id: "MICRO_ACTION",
    name: "Micro Action",
    description:
      "Break hesitation by executing a tiny action that creates momentum.",
    recommendedForStates: ["HESITATION"],
    recommendedModes: ["COMMAND", "CLARITY"],
    steps: [
      { type: "prompt", text: "What are you avoiding? One sentence." },
      { type: "action", text: "Do a 2-minute version of the task (start only)." },
      { type: "prompt", text: "After 2 minutes, decide: continue 8 more OR stop cleanly." },
      { type: "log", text: "Log: started (yes/no) + decision + next scheduled attempt." },
    ],
  },

  CONTRADICTION_CHECK: {
    id: "CONTRADICTION_CHECK",
    name: "Contradiction Check",
    description:
      "Resolve mismatch between stated intent and observed behavior.",
    recommendedForStates: ["CONTRADICTION"],
    recommendedModes: ["MIRROR", "CLARITY"],
    steps: [
      { type: "prompt", text: "State your intent as a measurable outcome." },
      { type: "prompt", text: "What did you actually do in the last 24 hours?" },
      { type: "action", text: "Identify the mismatch in one sentence." },
      { type: "action", text: "Choose one corrective action for today." },
      { type: "log", text: "Log mismatch statement and corrective action." },
    ],
  },

  RECOVERY_MINIMUM: {
    id: "RECOVERY_MINIMUM",
    name: "Recovery Minimum",
    description:
      "Minimal viable commitments during recovery.",
    recommendedForStates: ["RECOVERY", "OVERWHELM"],
    recommendedModes: ["CLARITY"],
    steps: [
      { type: "prompt", text: "Choose ONE non-negotiable minimum action (5 minutes)." },
      { type: "action", text: "Do it now or schedule it within 6 hours." },
      { type: "prompt", text: "Drop optional tasks until the minimum is completed." },
      { type: "log", text: "Log chosen minimum and completion status." },
    ],
  },
} as const;

export const TOOL_LIST: readonly Tool[] = Object.values(TOOLS);

export function getTool(id: ToolId): Tool {
  return TOOLS[id];
}
