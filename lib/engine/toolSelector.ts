// lib/engine/toolSelector.ts
// Engine — Deterministic tool selection (no AI)
// Guardian rule: stability-first. Intensity is never the default.

import type { StateId } from "../kernel/states";
import type { ModeId } from "../kernel/modes";
import type { ToolId } from "../kernel/tools";
import { guardianWhyLine } from "../kernel/intent";

export type ToolSelectionInput = Readonly<{
  stateId: StateId;
  modeId?: ModeId;
}>;

export type ToolSelectionResult = Readonly<{
  toolId: ToolId;
  reasons: readonly string[];
}>;

export function selectTool(input: ToolSelectionInput): ToolSelectionResult {
  const reasons: string[] = [];

  // Hard safety
  if (input.stateId === "OVERWHELM") {
    reasons.push("Stability-first: overload state detected.");
    reasons.push(
      guardianWhyLine(
        "Grounding prevents harmful escalation and protects body/mind trajectory."
      )
    );
    return { toolId: "GROUNDING_PAUSE", reasons };
  }

  if (input.stateId === "RECOVERY") {
    reasons.push("Stability-first: recovery state detected.");
    reasons.push(
      guardianWhyLine("Minimum commitments preserve integrity while capacity rebuilds.")
    );
    return { toolId: "RECOVERY_MINIMUM", reasons };
  }

  const map: Record<StateId, ToolId> = {
    BASELINE: "CLARIFY_NEXT_STEP",
    FOG: "CLARIFY_NEXT_STEP",
    DRIFT: "RESTORE_STRUCTURE",
    OVERWHELM: "GROUNDING_PAUSE",
    HESITATION: "MICRO_ACTION",
    CONTRADICTION: "CONTRADICTION_CHECK",
    RECOVERY: "RECOVERY_MINIMUM",
  };

  const toolId = map[input.stateId];
  reasons.push(`Mapped state ${input.stateId} -> tool ${toolId}.`);

  // Mode influence: only when it stays minimal
  if (input.modeId === "COMMAND" && toolId === "CLARIFY_NEXT_STEP") {
    reasons.push("Mode COMMAND requested; switching to MICRO_ACTION (minimal execution).");
    reasons.push(guardianWhyLine("A two-minute start creates proof without pressure escalation."));
    return { toolId: "MICRO_ACTION", reasons };
  }

  reasons.push(
    guardianWhyLine("Selected tool prioritizes stability and the smallest next action aligned to trajectory.")
  );

  return { toolId, reasons };
}
