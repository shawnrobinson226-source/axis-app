import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db, initDbIfNeeded } from "@/lib/db/client";
import {
  parseDistortionClass,
  parseSessionOutcome as parseOutcome,
  type DistortionClass,
  type SessionOutcome,
} from "@/lib/kernel/domain";
import { runGuards } from "@/lib/engine/guards";
import { runSessionEngine, type SessionInput } from "@/lib/engine/executionFlow";
import { generateProtocolOutput } from "@/lib/engine/protocols";
import {
  applyContinuityUpdate,
  getOrCreateContinuityState,
  saveContinuityState,
} from "@/lib/session/continuity";
import {
  createExecutionTrace,
  addTraceEvent,
  blockTrace,
  failTrace,
  completeTrace,
} from "@/lib/trace/executionTrace";


export type ProcessSessionInput = {
  operator_id: string;
  trigger: string;
  distortion_class: string;
  fracture_id?: string;
  origin?: string;
  thought?: string;
  emotion?: string;
  behavior?: string;
  protocol?: string;
  next_action: string;
  clarity_rating?: number;
  outcome?: string;
  stability?: number;
  reference?: boolean;
  impact?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteOrFallback(value: number | undefined, fallback: number) {
  return Number.isFinite(value) ? (value as number) : fallback;
}

function readNumber(row: Record<string, unknown>, key: string, fallback = 0) {
  return Number(row[key] ?? fallback);
}

function readString(row: Record<string, unknown>, key: string, fallback = "") {
  return String(row[key] ?? fallback);
}



async function appendEvent(args: {
  event_type: string;
  operator_id: string;
  session_id?: string | null;
  distortion_id?: string | null;
  payload: Record<string, unknown>;
  meta?: Record<string, unknown> | null;
}) {
  await db.execute({
    sql: `
      INSERT INTO events (
        event_id,
        event_type,
        occurred_at,
        schema_version,
        actor_kind,
        actor_id,
        operator_id,
        session_id,
        fracture_id,
        distortion_id,
        payload_json,
        meta_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      randomUUID(),
      args.event_type,
      new Date().toISOString(),
      "v1",
      "human",
      args.operator_id,
      args.operator_id,
      args.session_id ?? null,
      null,
      args.distortion_id ?? null,
      JSON.stringify(args.payload),
      args.meta ? JSON.stringify(args.meta) : null,
    ],
  });
}

export async function processSession(input: ProcessSessionInput) {
  let trace = createExecutionTrace({
    operatorId: input.operator_id,
    userInput: input.trigger,
  });

  try {
    await initDbIfNeeded();

    const operator_id = input.operator_id.trim();
    const trigger = input.trigger.trim();
    const distortion_class = parseDistortionClass(input.distortion_class.trim());
    const fracture_id = input.fracture_id?.trim() ?? "";
    const next_action = input.next_action.trim();
    const origin = input.origin?.trim() || "local";
    const thought = input.thought?.trim() || trigger;
    const emotion = input.emotion?.trim() || "unspecified";
    const behavior = input.behavior?.trim() || "unspecified";
    const protocol = input.protocol?.trim() || "aligned_action";
    const clarity_rating = clamp(finiteOrFallback(input.clarity_rating, 5), 0, 10);
    const outcome = parseOutcome((input.outcome ?? "reduced").trim());
    const stability = clamp(finiteOrFallback(input.stability, 5), 0, 10);
    const reference = Boolean(input.reference);
    const impact = clamp(finiteOrFallback(input.impact, 3), 0, 10);

    if (!operator_id) throw new Error("Operator identity is required.");
    if (!trigger) throw new Error("Trigger is required.");
    if (!next_action) throw new Error("Next action is required.");

    const guardResult = runGuards({
      stability,
      reference,
      impact,
    });

    if (!guardResult.allowed) {
      trace = blockTrace(trace, "guard", "Guard blocked session", {
        flags: guardResult.flags,
      });

      await appendEvent({
        event_type: "session.precheck_blocked",
        operator_id,
        payload: {
          trigger,
          guard_inputs: {
            stability,
            reference,
            impact,
          },
          guard_flags: guardResult.flags,
          guard_passed: false,
        },
      });

      throw new Error("Guard blocked session");
    }

    trace = addTraceEvent(trace, {
      stage: "guard",
      status: "passed",
      message: "Guard passed",
    });

    const engineInput: SessionInput = {
      trigger,
      distortionClass: distortion_class,
      origin,
      thought,
      emotion,
      behavior,
      protocol,
      nextAction: next_action,
      clarityRating: clarity_rating,
      outcome,
    };

    trace = addTraceEvent(trace, {
      stage: "engine",
      status: "started",
      message: "Engine execution started",
    });

    const engineResult = runSessionEngine(engineInput);
    const protocolOutput = generateProtocolOutput({
      distortion: engineResult.distortion.class,
      situation: trigger,
      action: next_action,
    });

    trace = addTraceEvent(trace, {
      stage: "engine",
      status: "passed",
      message: "Engine execution completed",
    });

    const sessionId = randomUUID();

    const previous = await getOrCreateContinuityState(operator_id);
    const next = applyContinuityUpdate(previous, engineResult.continuityDelta);

    await db.execute({
      sql: `
        INSERT INTO sessions (
          id,
          operator_id,
          trigger,
          distortion_class,
          fracture_id,
          origin,
          thought,
          emotion,
          behavior,
          protocol,
          next_action,
          clarity_rating,
          outcome,
          steps_completed,
          continuity_score_before,
          continuity_score_after,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        sessionId,
        operator_id,
        trigger,
        engineResult.distortion.class,
        fracture_id,
        origin,
        thought,
        emotion,
        behavior,
        protocol,
        next_action,
        engineResult.session.exitStateClarityRating,
        engineResult.session.outcome,
        engineResult.session.stepsCompleted,
        previous.continuity_score,
        next.continuity_score,
        new Date().toISOString(),
      ],
    });
    await saveContinuityState(next);

    await db.execute({
      sql: `
        INSERT INTO derived_session_index (
          operator_id,
          session_id,
          occurred_at,
          confirmed_class,
          outcome,
          clarity_rating,
          steps_completed,
          continuity_before,
          continuity_after,
          continuity_delta,
          protocol_type,
          formula_version,
          is_complete,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(operator_id, session_id) DO UPDATE SET
          occurred_at = excluded.occurred_at,
          confirmed_class = excluded.confirmed_class,
          outcome = excluded.outcome,
          clarity_rating = excluded.clarity_rating,
          steps_completed = excluded.steps_completed,
          continuity_before = excluded.continuity_before,
          continuity_after = excluded.continuity_after,
          continuity_delta = excluded.continuity_delta,
          protocol_type = excluded.protocol_type,
          formula_version = excluded.formula_version,
          is_complete = excluded.is_complete,
          updated_at = excluded.updated_at
      `,
      args: [
        operator_id,
        sessionId,
        new Date().toISOString(),
        engineResult.distortion.class,
        engineResult.session.outcome,
        engineResult.session.exitStateClarityRating,
        engineResult.session.stepsCompleted,
        previous.continuity_score,
        next.continuity_score,
        next.continuity_score - previous.continuity_score,
        protocol,
        "v1",
        1,
        new Date().toISOString(),
      ],
    });

    await appendEvent({
      event_type: "session.created",
      operator_id,
      session_id: sessionId,
      payload: {
        engine: engineResult,
        trigger,
        distortion_class,
        protocol,
        outcome,
        clarity_rating,
        lesson: engineResult.lessonLine,
        guard_inputs: {
          stability,
          reference,
          impact,
        },
        guard_flags: guardResult.flags,
        guard_passed: guardResult.allowed,
      },
    });

    await appendEvent({
      event_type: "continuity.calculated",
      operator_id,
      session_id: sessionId,
      payload: {
        before: previous,
        after: next,
        delta: {
          continuity: next.continuity_score - previous.continuity_score,
          perception: next.perception_alignment - previous.perception_alignment,
          identity: next.identity_alignment - previous.identity_alignment,
          intention: next.intention_alignment - previous.intention_alignment,
          action: next.action_alignment - previous.action_alignment,
        },
        guard_inputs: {
          stability,
          reference,
          impact,
        },
        guard_flags: guardResult.flags,
        guard_passed: guardResult.allowed,
      },
    });

    revalidatePath("/");
    revalidatePath("/session");
    revalidatePath("/dashboard");
    revalidatePath("/logs");
    revalidatePath("/settings");

    completeTrace(trace);

    return {
      ok: true as const,
      sessionId,
      outcome: engineResult.session.outcome,
      clarity_rating: engineResult.session.exitStateClarityRating,
      steps_completed: engineResult.session.stepsCompleted,
      continuity_before: previous.continuity_score,
      continuity_after: next.continuity_score,
      protocol_output: protocolOutput,
    };
  } catch (error) {
    failTrace(
      trace,
      "process",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}
