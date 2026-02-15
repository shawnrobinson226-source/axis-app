// lib/engine/executionFlow.ts
// Engine — Execution Orchestration Layer
// Guardian intent baked into the plan output.

import { resolveState, type StateResolutionInput } from "./stateResolver";
import { selectTool } from "./toolSelector";

import type { StateId } from "../kernel/states";
import type { ModeId } from "../kernel/modes";
import type { ToolId } from "../kernel/tools";
import { FUTURE_PROJECTION } from "../kernel/futureProjection";

export type ExecutionPlan = Readonly<{
  stateId: StateId;
  modeId: ModeId;
  toolId: ToolId;
  reasons: readonly string[];
  futureProjectionName: string;
}>;

function determineMode(stateId: StateId): ModeId {
  switch (stateId) {
    case "OVERWHELM":
      return "CLARITY";
    case "CONTRADICTION":
      return "MIRROR";
    case "HESITATION":
      return "COMMAND";
    case "DRIFT":
    case "FOG":
    case "RECOVERY":
    case "BASELINE":
    default:
      return "CLARITY";
  }
}

export function buildExecutionPlan(input: StateResolutionInput): ExecutionPlan {
  const resolution = resolveState(input);
  const modeId = determineMode(resolution.stateId);
  const toolSelection = selectTool({ stateId: resolution.stateId, modeId });

  return {
    stateId: resolution.stateId,
    modeId,
    toolId: toolSelection.toolId,
    reasons: [...resolution.reasons, ...toolSelection.reasons],
    futureProjectionName: FUTURE_PROJECTION.identity_name,
  };
}
