"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, initDbIfNeeded } from "@/lib/db/client";
import {
  runSessionEngine,
  type SessionInput,
} from "@/lib/engine/executionFlow";

export type DistortionClass =
  | "narrative"
  | "emotional"
  | "behavioral"
  | "perceptual"
  | "continuity";

export type SessionOutcome = "reduced" | "unresolved" | "escalated";

export type ContinuityState = {
  operator_id: string;
  perception_alignment: number;
  identity_alignment: number;
  intention_alignment: number;
  action_alignment: number;
  continuity_score: number;
  updated_at: string;
};

export type SessionLogRow = {
  id: string;
  trigger: string;
  distortion_class: DistortionClass;
  protocol: string;
  next_action: string;
  outcome: SessionOutcome;
  clarity_rating: number;
  continuity_before: number;
  continuity_after: number;
  created_at: string;
};

type DashboardState = {
  continuity: ContinuityState;
  activeFracturesCount: number;
  recentSessions: Array<{
    id: string;
    trigger: string;
    distortion_class: DistortionClass;
    outcome: SessionOutcome;
    clarity_rating: number;
    continuity_before: number;
    continuity_after: number;
    created_at: string;
  }>;
};

type ParsedSessionForm = {
  operator_id: string;
  trigger: string;
  distortion_class: DistortionClass;
  origin: string;
  thought: string;
  emotion: string;
  behavior: string;
  protocol: string;
  next_action: string;
  clarity_rating: number;
  outcome: SessionOutcome;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const raw = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(raw) ? raw : fallback;
}

function readNumber(row: Record<string, unknown>, key: string, fallback = 0) {
  return Number(row[key] ?? fallback);
}

function readString(row: Record<string, unknown>, key: string, fallback = "") {
  return String(row[key] ?? fallback);
}

function parseDistortionClass(value: string): DistortionClass {
  const allowed: DistortionClass[] = [
    "narrative",
    "emotional",
    "behavioral",
    "perceptual",
    "continuity",
  ];

  if (allowed.includes(value as DistortionClass)) {
    return value as DistortionClass;
  }

  throw new Error(`Invalid distortion class: ${value}`);
}

function parseOutcome(value: string): SessionOutcome {
  const allowed: SessionOutcome[] = ["reduced", "unresolved", "escalated"];

  if (allowed.includes(value as SessionOutcome)) {
    return value as SessionOutcome;
  }

  throw new Error(`Invalid session outcome: ${value}`);
}

function parseSessionForm(formData: FormData): ParsedSessionForm {
  const operator_id = asString(formData.get("operator_id")) || "op_legacy";
  const trigger = asString(formData.get("trigger"));
  const distortion_class = parseDistortionClass(
    asString(formData.get("distortion_class")),
  );
  const origin = asString(formData.get("origin")) || "local";
  const thought = asString(formData.get("thought")) || trigger;
  const emotion = asString(formData.get("emotion")) || "unspecified";
  const behavior = asString(formData.get("behavior")) || "unspecified";
  const protocol = asString(formData.get("protocol")) || "aligned_action";
  const next_action = asString(formData.get("next_action"));
  const clarity_rating = clamp(asNumber(formData.get("clarity_rating") ?? formData.get("clarity_0_10"), 5), 0, 10);
  const outcome = parseOutcome(asString(formData.get("outcome")) || "reduced");

  if (!trigger) throw new Error("Trigger is required.");
            if (!next_action) throw new Error("Next action is required.");

  return {
    operator_id,
    trigger,
    distortion_class,
    origin,
    thought,
    emotion,
    behavior,
    protocol,
    next_action,
    clarity_rating,
    outcome,
  };
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

async function getOrCreateContinuityState(operatorId: string): Promise<ContinuityState> {
  await initDbIfNeeded();

  const existing = await db.execute({
    sql: `
      SELECT
        operator_id,
        perception_alignment,
        identity_alignment,
        intention_alignment,
        action_alignment,
        continuity_score,
        updated_at
      FROM continuity_states
      WHERE operator_id = ?
      LIMIT 1
    `,
    args: [operatorId],
  });

  const first = existing.rows?.[0] as Record<string, unknown> | undefined;

  if (first) {
    return {
      operator_id: readString(first, "operator_id"),
      perception_alignment: readNumber(first, "perception_alignment", 50),
      identity_alignment: readNumber(first, "identity_alignment", 50),
      intention_alignment: readNumber(first, "intention_alignment", 50),
      action_alignment: readNumber(first, "action_alignment", 50),
      continuity_score: readNumber(first, "continuity_score", 50),
      updated_at: readString(first, "updated_at"),
    };
  }

  await db.execute({
    sql: `
      INSERT OR IGNORE INTO continuity_states (
        operator_id,
        perception_alignment,
        identity_alignment,
        intention_alignment,
        action_alignment,
        continuity_score,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    args: [operatorId, 50, 50, 50, 50, 50],
  });

  return {
    operator_id: operatorId,
    perception_alignment: 50,
    identity_alignment: 50,
    intention_alignment: 50,
    action_alignment: 50,
    continuity_score: 50,
    updated_at: new Date().toISOString(),
  };
}

function applyContinuityUpdate(
  previous: ContinuityState,
  delta: {
    perception: number;
    identity: number;
    intention: number;
    action: number;
  },
): ContinuityState {
  const perception_alignment = clamp(
    previous.perception_alignment + delta.perception,
    20,
    95,
  );

  const identity_alignment = clamp(
    previous.identity_alignment * 0.8 + (previous.identity_alignment + delta.identity) * 0.2,
    20,
    95,
  );

  const intention_alignment = clamp(
    previous.intention_alignment + delta.intention,
    20,
    95,
  );

  const action_alignment = clamp(
    previous.action_alignment + delta.action,
    20,
    95,
  );

  const continuity_score = clamp(
    (perception_alignment +
      identity_alignment +
      intention_alignment +
      action_alignment) /
      4,
    20,
    95,
  );

  return {
    operator_id: previous.operator_id,
    perception_alignment,
    identity_alignment,
    intention_alignment,
    action_alignment,
    continuity_score,
    updated_at: new Date().toISOString(),
  };
}

export async function submitSessionForm(formData: FormData) {
  await initDbIfNeeded();

  const input = parseSessionForm(formData);

  const engineInput: SessionInput = {
    trigger: input.trigger,
    distortionClass: input.distortion_class,
    origin: input.origin ?? "local",
    thought: input.thought,
    emotion: input.emotion,
    behavior: input.behavior,
    protocol: input.protocol,
    nextAction: input.next_action,
    clarityRating: input.clarity_rating,
    outcome: input.outcome,
  };

  const engineResult = runSessionEngine(engineInput);
  const sessionId = randomUUID();

  const previous = await getOrCreateContinuityState(input.operator_id);
  const next = applyContinuityUpdate(previous, engineResult.continuityDelta);

  await db.execute({
    sql: `
      INSERT INTO sessions (
        id,
        operator_id,
        trigger,
        distortion_class,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      sessionId,
      input.operator_id,
      input.trigger,
      engineResult.distortion.class,
      input.origin,
      input.thought,
      input.emotion,
      input.behavior,
      input.protocol,
      input.next_action,
      engineResult.session.exitStateClarityRating,
      engineResult.session.outcome,
      engineResult.session.stepsCompleted,
      previous.continuity_score,
      next.continuity_score,
      new Date().toISOString(),
    ],
  });

  await db.execute({
    sql: `
      INSERT INTO continuity_states (
        operator_id,
        perception_alignment,
        identity_alignment,
        intention_alignment,
        action_alignment,
        continuity_score,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(operator_id) DO UPDATE SET
        perception_alignment = excluded.perception_alignment,
        identity_alignment = excluded.identity_alignment,
        intention_alignment = excluded.intention_alignment,
        action_alignment = excluded.action_alignment,
        continuity_score = excluded.continuity_score,
        updated_at = excluded.updated_at
    `,
    args: [
      next.operator_id,
      next.perception_alignment,
      next.identity_alignment,
      next.intention_alignment,
      next.action_alignment,
      next.continuity_score,
      next.updated_at,
    ],
  });

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
      input.operator_id,
      sessionId,
      new Date().toISOString(),
      engineResult.distortion.class,
      engineResult.session.outcome,
      engineResult.session.exitStateClarityRating,
      engineResult.session.stepsCompleted,
      previous.continuity_score,
      next.continuity_score,
      next.continuity_score - previous.continuity_score,
      input.protocol,
      "v1",
      1,
      new Date().toISOString(),
    ],
  });

  await appendEvent({
    event_type: "session.created",
    operator_id: input.operator_id,
    session_id: sessionId,
    payload: {
      engine: engineResult,
      trigger: input.trigger,
      distortion_class: input.distortion_class,
      protocol: input.protocol,
      outcome: input.outcome,
      clarity_rating: input.clarity_rating,
      lesson: engineResult.lessonLine,
    },
  });

  await appendEvent({
    event_type: "continuity.calculated",
    operator_id: input.operator_id,
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
    },
  });

  revalidatePath("/");
  revalidatePath("/session");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
  revalidatePath("/settings");

  redirect("/session?saved=1");
}

export async function getDashboardState(
  operatorId = "op_legacy",
): Promise<DashboardState> {
  await initDbIfNeeded();

  const continuity = await getOrCreateContinuityState(operatorId);

  const active = await db.execute({
    sql: `
      SELECT COUNT(*) AS count
      FROM sessions
      WHERE operator_id = ?
        AND outcome IN ('unresolved', 'escalated')
    `,
    args: [operatorId],
  });

  const activeRow = active.rows?.[0] as Record<string, unknown> | undefined;

  const sessions = await db.execute({
    sql: `
      SELECT
        id,
        trigger,
        distortion_class,
        outcome,
        clarity_rating,
        continuity_score_before,
        continuity_score_after,
        created_at
      FROM sessions
      WHERE operator_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `,
    args: [operatorId],
  });

  return {
    continuity,
    activeFracturesCount: Number(activeRow?.count ?? 0),
    recentSessions: (sessions.rows ?? []).map((r) => {
      const row = r as Record<string, unknown>;

      return {
        id: readString(row, "id"),
        trigger: readString(row, "trigger"),
        distortion_class: parseDistortionClass(
          readString(row, "distortion_class", "narrative"),
        ),
        outcome: parseOutcome(readString(row, "outcome", "unresolved")),
        clarity_rating: readNumber(row, "clarity_rating", 0),
        continuity_before: readNumber(row, "continuity_score_before", 0),
        continuity_after: readNumber(row, "continuity_score_after", 0),
        created_at: readString(row, "created_at"),
      };
    }),
  };
}

export async function getVolatilityBand(
  operatorId = "op_legacy",
): Promise<"low" | "medium" | "high"> {
  await initDbIfNeeded();

  const existing = await db.execute({
    sql: `
      SELECT volatility_band
      FROM derived_volatility
      WHERE operator_id = ?
        AND window_days = 30
      LIMIT 1
    `,
    args: [operatorId],
  });

  const row = existing.rows?.[0] as Record<string, unknown> | undefined;
  const band = readString(row ?? {}, "volatility_band", "");

  if (band === "low" || band === "medium" || band === "high") {
    return band;
  }

  const values = await db.execute({
    sql: `
      SELECT clarity_rating, continuity_score_after
      FROM sessions
      WHERE operator_id = ?
        AND created_at >= datetime('now', '-30 day')
      ORDER BY created_at DESC
    `,
    args: [operatorId],
  });

  const clarity = (values.rows ?? []).map((r) =>
    Number((r as Record<string, unknown>).clarity_rating ?? 0),
  );
  const continuity = (values.rows ?? []).map((r) =>
    Number((r as Record<string, unknown>).continuity_score_after ?? 0),
  );

  const variance = (nums: number[]) => {
    if (nums.length <= 1) return 0;
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    return nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
  };

  const clarityVariance = variance(clarity);
  const continuityVariance = variance(continuity);

  const score = clarityVariance + continuityVariance;

  const volatility_band: "low" | "medium" | "high" =
    score > 12 ? "high" : score >= 4 ? "medium" : "low";

  await db.execute({
    sql: `
      INSERT INTO derived_volatility (
        operator_id,
        window_days,
        clarity_variance,
        continuity_variance,
        volatility_band,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(operator_id, window_days) DO UPDATE SET
        clarity_variance = excluded.clarity_variance,
        continuity_variance = excluded.continuity_variance,
        volatility_band = excluded.volatility_band,
        updated_at = excluded.updated_at
    `,
    args: [
      operatorId,
      30,
      clarityVariance,
      continuityVariance,
      volatility_band,
      new Date().toISOString(),
    ],
  });

  return volatility_band;
}

export async function getRecentSessions(
  limit = 50,
): Promise<SessionLogRow[]> {
  await initDbIfNeeded();

  const n = Math.max(1, Math.min(200, Number(limit) || 50));

  const res = await db.execute({
    sql: `
      SELECT
        id,
        trigger,
        distortion_class,
        protocol,
        next_action,
        outcome,
        clarity_rating,
        continuity_score_before,
        continuity_score_after,
        created_at
      FROM sessions
      WHERE operator_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `,
    args: ["op_legacy", n],
  });

  return (res.rows ?? []).map((r) => {
    const row = r as Record<string, unknown>;

    return {
      id: String(row.id ?? ""),
      trigger: String(row.trigger ?? ""),
      distortion_class: String(
        row.distortion_class ?? "narrative",
      ) as DistortionClass,

      protocol:
        typeof row.protocol === "string"
          ? row.protocol
          : row.protocol &&
              typeof row.protocol === "object" &&
              "label" in row.protocol
            ? String((row.protocol as { label?: unknown }).label ?? "Unknown")
            : "Unknown",

      next_action:
        typeof row.next_action === "string"
          ? row.next_action
          : row.next_action &&
              typeof row.next_action === "object" &&
              "label" in row.next_action
            ? String((row.next_action as { label?: unknown }).label ?? "Unknown")
            : "Unknown",

      outcome: String(row.outcome ?? "unresolved") as SessionOutcome,
      clarity_rating: Number(row.clarity_rating ?? 0),
      continuity_before: Number(row.continuity_score_before ?? 0),
      continuity_after: Number(row.continuity_score_after ?? 0),
      created_at: String(row.created_at ?? ""),
    };
  });
}

export async function resetSessions() {
  await initDbIfNeeded();

  await db.execute({
    sql: `DELETE FROM sessions WHERE operator_id = ?`,
    args: ["op_legacy"],
  });

  await db.execute({
    sql: `DELETE FROM events WHERE operator_id = ?`,
    args: ["op_legacy"],
  });

  await db.execute({
    sql: `DELETE FROM derived_session_index WHERE operator_id = ?`,
    args: ["op_legacy"],
  });

  await db.execute({
    sql: `DELETE FROM derived_recurrence_stats WHERE operator_id = ?`,
    args: ["op_legacy"],
  });

  await db.execute({
    sql: `DELETE FROM derived_recovery_stats WHERE operator_id = ?`,
    args: ["op_legacy"],
  });

  await db.execute({
    sql: `DELETE FROM derived_volatility WHERE operator_id = ?`,
    args: ["op_legacy"],
  });

  await db.execute({
    sql: `
      INSERT INTO continuity_states (
        operator_id,
        perception_alignment,
        identity_alignment,
        intention_alignment,
        action_alignment,
        continuity_score,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(operator_id) DO UPDATE SET
        perception_alignment = excluded.perception_alignment,
        identity_alignment = excluded.identity_alignment,
        intention_alignment = excluded.intention_alignment,
        action_alignment = excluded.action_alignment,
        continuity_score = excluded.continuity_score,
        updated_at = excluded.updated_at
    `,
    args: ["op_legacy", 50, 50, 50, 50, 50],
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
  revalidatePath("/settings");

  return { ok: true as const };
}