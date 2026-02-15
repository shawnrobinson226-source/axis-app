// lib/kernel/logs.ts
// VANTA Kernel — Canonical Logs (proof & telemetry)

import type { StateId } from "./states";
import type { ModeId } from "./modes";
import type { ToolId } from "./tools";
import type { LoopId } from "./loops";

export type LogId = string;
export type LoopRunId = string;

export type StepStatus = "done" | "skipped";

export type LogType =
  | "STATE_REPORT"
  | "TOOL_RUN"
  | "LOOP_CHECK"
  | "STEP_CHECK"
  | "NOTE";

export type LogEntry = Readonly<{
  id: LogId;
  timestamp: string;
  type: LogType;

  stateId?: StateId;
  modeId?: ModeId;
  toolId?: ToolId;

  loopId?: LoopId;
  loopRunId?: LoopRunId;

  stepOrder?: number;
  stepLabel?: string;

  status?: StepStatus;
  note?: string;

  message: string;

  level?: 0 | 1 | 2 | 3;
  tags?: readonly string[];
}>;

export const LOG_TYPES: readonly LogType[] = [
  "STATE_REPORT",
  "TOOL_RUN",
  "LOOP_CHECK",
  "STEP_CHECK",
  "NOTE",
] as const;

export function isLogType(value: string): value is LogType {
  return (LOG_TYPES as readonly string[]).includes(value);
}
