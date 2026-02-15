// app/session/actions.ts
"use server";

import type { LogEntry, LogType, StepStatus, LoopRunId } from "@/lib/kernel/logs";
import type { StateId } from "@/lib/kernel/states";
import type { ModeId } from "@/lib/kernel/modes";
import type { ToolId } from "@/lib/kernel/tools";
import type { LoopId } from "@/lib/kernel/loops";

import {
  appendLog,
  listLogs as listLogsFromStore,
  clearLogs as clearLogsFromStore,
} from "@/lib/storage/logStore";
import { getLoop } from "@/lib/kernel/loops";

type CreateLogInput = Readonly<{
  type: LogType;
  message: string;

  level?: 0 | 1 | 2 | 3;
  stateId?: StateId;
  modeId?: ModeId;
  toolId?: ToolId;

  loopId?: LoopId;
  loopRunId?: LoopRunId;

  stepOrder?: number;
  stepLabel?: string;

  status?: StepStatus;
  note?: string;

  tags?: readonly string[];
}>;

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeRunId(): LoopRunId {
  return `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function writeLog(input: CreateLogInput): Promise<LogEntry> {
  const entry: LogEntry = {
    id: makeId(),
    timestamp: nowIso(),
    type: input.type,
    message: input.message,

    level: input.level,
    stateId: input.stateId,
    modeId: input.modeId,
    toolId: input.toolId,

    loopId: input.loopId,
    loopRunId: input.loopRunId,

    stepOrder: input.stepOrder,
    stepLabel: input.stepLabel,

    status: input.status,
    note: input.note,

    tags: input.tags,
  };

  await appendLog(entry);
  return entry;
}

export async function createLog(input: CreateLogInput): Promise<LogEntry> {
  return writeLog(input);
}

export async function listLogs(limit: number = 10): Promise<readonly LogEntry[]> {
  return listLogsFromStore(limit);
}

export async function clearLogs(): Promise<void> {
  await clearLogsFromStore();
}

export async function startLoop(loopId: LoopId): Promise<{
  loopId: LoopId;
  loopRunId: LoopRunId;
  name: string;
  steps: readonly { order: number; label: string; toolId?: ToolId }[];
}> {
  const loop = getLoop(loopId);
  const loopRunId = makeRunId();

  await writeLog({
    type: "LOOP_CHECK",
    loopId: loop.id,
    loopRunId,
    message: `Loop started: ${loop.name}`,
    tags: ["loop", "interactive"],
  });

  return {
    loopId: loop.id,
    loopRunId,
    name: loop.name,
    steps: loop.steps.map((s) => ({
      order: s.order,
      label: s.label,
      toolId: s.toolId,
    })),
  };
}

export async function completeStep(input: {
  loopId: LoopId;
  loopRunId: LoopRunId;
  stepOrder: number;
  stepLabel: string;
  toolId?: ToolId;
  status: StepStatus;
  note?: string;
}): Promise<void> {
  // Server-side dedupe: if a STEP_CHECK already exists for this run+step, ignore.
  const recent = await listLogsFromStore(2000);
  const already = recent.some(
    (l) =>
      l.type === "STEP_CHECK" &&
      l.loopId === input.loopId &&
      l.loopRunId === input.loopRunId &&
      l.stepOrder === input.stepOrder
  );
  if (already) return;

  await writeLog({
    type: "STEP_CHECK",
    loopId: input.loopId,
    loopRunId: input.loopRunId,
    stepOrder: input.stepOrder,
    stepLabel: input.stepLabel,
    status: input.status,
    note: input.note,
    message: `Step ${input.stepOrder} ${input.status}: ${input.stepLabel}`,
    tags: ["loop", "step", "interactive"],
  });

  if (input.toolId && input.status === "done") {
    await writeLog({
      type: "TOOL_RUN",
      loopId: input.loopId,
      loopRunId: input.loopRunId,
      toolId: input.toolId,
      stepOrder: input.stepOrder,
      stepLabel: input.stepLabel,
      message: `Tool reference: ${input.toolId} (completed step ${input.stepOrder})`,
      tags: ["loop", "tool", "interactive"],
    });
  }
}

export async function completeLoop(input: {
  loopId: LoopId;
  loopRunId: LoopRunId;
}): Promise<void> {
  const loop = getLoop(input.loopId);
  const recent = await listLogsFromStore(2000);

  const stepOrdersRequired = new Set(loop.steps.map((s) => s.order));
  const marked = new Set<number>();

  for (const l of recent) {
    if (
      l.type === "STEP_CHECK" &&
      l.loopId === input.loopId &&
      l.loopRunId === input.loopRunId &&
      typeof l.stepOrder === "number"
    ) {
      marked.add(l.stepOrder);
    }
  }

  // Hard rule (B): must mark every step done/skip
  for (const order of stepOrdersRequired) {
    if (!marked.has(order)) {
      // refuse completion silently to avoid UI complexity; UI already blocks this.
      return;
    }
  }

  // Dedupe NOTE completion
  const alreadyDone = recent.some(
    (l) =>
      l.type === "NOTE" &&
      l.loopId === input.loopId &&
      l.loopRunId === input.loopRunId &&
      l.message.startsWith("Loop completed:")
  );
  if (alreadyDone) return;

  await writeLog({
    type: "NOTE",
    loopId: input.loopId,
    loopRunId: input.loopRunId,
    message: `Loop completed: ${loop.name}`,
    tags: ["loop", "interactive"],
  });
}
