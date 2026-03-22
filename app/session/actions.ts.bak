"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, initDbIfNeeded } from "@/lib/db/client";

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

export type DashboardState = {
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

const DEFAULT_OPERATOR_ID = "op_legacy";
const SCHEMA_VERSION = "v1";
const FORMULA_VERSION = "continuity_v1";

const DISTORTION_CLASSES: DistortionClass[] = [
  "narrative",
  "emotional",
  "behavioral",
  "perceptual",
  "continuity",
];

const OUTCOMES: SessionOutcome[] = ["reduced", "unresolved", "escalated"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isDistortionClass(value: string): value is DistortionClass {
  return DISTORTION_CLASSES.includes(value as DistortionClass);
}

function isOutcome(value: string): value is SessionOutcome {
  return OUTCOMES.includes(value as SessionOutcome);
}

function variance(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return (
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  );
}

type CreateSessionInput = {
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

function parseSessionForm(formData: FormData): CreateSessionInput {
  const operator_id = asString(formData.get("operator_id")) || DEFAULT_OPERATOR_ID;
  const trigger = asString(formData.get("trigger"));
  const rawClass = asString(formData.get("distortion_class"));
  const origin = asString(formData.get("origin"));
  const thought = asString(formData.get("thought"));
  const emotion = asString(formData.get("emotion"));
  const behavior = asString(formData.get("behavior"));
  const protocol = asString(formData.get("protocol"));
  const next_action = asString(formData.get("next_action"));
  const clarity_rating = clamp(asNumber(formData.get("clarity_rating"), 0), 0, 10);
  const rawOutcome = asString(formData.get("outcome"));

  if (!trigger) {
    throw new Error("Trigger is required.");
  }

  if (!isDistortionClass(rawClass)) {
    throw new Error("Invalid distortion class.");
  }

  if (!origin) {
    throw new Error("Origin is required.");
  }

  if (!thought) {
    throw new Error("Thought mapping is required.");
  }

  if (!emotion) {
    throw new Error("Emotion mapping is required.");
  }

  if (!behavior) {
    throw new Error("Behavior mapping is required.");
  }

  if (!protocol) {
    throw new Error("Protocol is required.");
  }

  if (!next_action) {
    throw new Error("Next aligned action is required.");
  }

  if (!isOutcome(rawOutcome)) {
    throw new Error("Invalid outcome.");
  }

  return {
    operator_id,
    trigger,
    distortion_class: rawClass,
    origin,
    thought,
    emotion,
    behavior,
    protocol,
    next_action,
    clarity_rating,
    outcome: rawOutcome,
  };
}

async function getOrCreateContinuityState(
  operatorId: string,
): Promise<ContinuityState> {
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

  if (existing.rows?.length) {
    const row = existing.rows[0] as Record<string, unknown>;
    return {
      operator_id: String(row.operator_id ?? operatorId),
      perception_alignment: Number(row.perception_alignment ?? 50),
      identity_alignment: Number(row.identity_alignment ?? 50),
      intention_alignment: Number(row.intention_alignment ?? 50),
      action_alignment: Number(row.action_alignment ?? 50),
      continuity_score: Number(row.continuity_score ?? 50),
      updated_at: String(row.updated_at ?? new Date().toISOString()),
    };
  }

  const now = new Date().toISOString();

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
    `,
    args: [operatorId, 50, 50, 50, 50, 50, now],
  });

  return {
    operator_id: operatorId,
    perception_alignment: 50,
    identity_alignment: 50,
    intention_alignment: 50,
    action_alignment: 50,
    continuity_score: 50,
    updated_at: now,
  };
}

async function getLastContinuityTimestamp(operatorId: string): Promise<Date | null> {
  const res = await db.execute({
    sql: `
      SELECT updated_at
      FROM continuity_states
      WHERE operator_id = ?
      LIMIT 1
    `,
    args: [operatorId],
  });

  if (!res.rows?.length) return null;

  const row = res.rows[0] as Record<string, unknown>;
  const raw = String(row.updated_at ?? "");
  const date = new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date;
}

function computeEntropyPenalty(lastUpdatedAt: Date | null) {
  if (!lastUpdatedAt) return 0;

  const msSince = Date.now() - lastUpdatedAt.getTime();
  const hoursSince = msSince / (1000 * 60 * 60);

  if (hoursSince < 72) return 0;

  const windows = Math.floor(hoursSince / 72);
  return clamp(windows * 3, 0, 12);
}

function calculateContinuityUpdate(
  previous: ContinuityState,
  input: CreateSessionInput,
  entropyPenalty: number,
) {
  const next = {
    perception_alignment: previous.perception_alignment,
    identity_alignment: previous.identity_alignment,
    intention_alignment: previous.intention_alignment,
    action_alignment: previous.action_alignment,
  };

  const outcomeMultiplier: Record<SessionOutcome, number> = {
    reduced: 1,
    unresolved: -0.5,
    escalated: -1,
  };

  const m = outcomeMultiplier[input.outcome];

  const deltas: Record<DistortionClass, Partial<typeof next>> = {
    narrative: {
      perception_alignment: 6 * m,
      intention_alignment: 2 * m,
    },
    emotional: {
      identity_alignment: 3 * m,
      intention_alignment: 4 * m,
    },
    behavioral: {
      action_alignment: 6 * m,
      intention_alignment: 2 * m,
    },
    perceptual: {
      perception_alignment: 7 * m,
      identity_alignment: 1 * m,
    },
    continuity: {
      identity_alignment: 6 * m,
      action_alignment: 2 * m,
    },
  };

  const selected = deltas[input.distortion_class];

  next.perception_alignment = clamp(
    next.perception_alignment + (selected.perception_alignment ?? 0),
    0,
    100,
  );

  next.identity_alignment = clamp(
    next.identity_alignment + (selected.identity_alignment ?? 0),
    0,
    100,
  );

  next.intention_alignment = clamp(
    next.intention_alignment + (selected.intention_alignment ?? 0),
    0,
    100,
  );

  next.action_alignment = clamp(
    next.action_alignment + (selected.action_alignment ?? 0),
    0,
    100,
  );

  if (input.next_action) {
    next.intention_alignment = clamp(next.intention_alignment + 2, 0, 100);
  }

  if (input.clarity_rating >= 7 && input.outcome === "reduced") {
    next.perception_alignment = clamp(next.perception_alignment + 1, 0, 100);
    next.identity_alignment = clamp(next.identity_alignment + 1, 0, 100);
    next.action_alignment = clamp(next.action_alignment + 1, 0, 100);
  }

  if (input.outcome === "escalated") {
    next.action_alignment = clamp(next.action_alignment - 2, 0, 100);
    next.identity_alignment = clamp(next.identity_alignment - 1, 0, 100);
  }

  const rawContinuity =
    next.perception_alignment * 0.25 +
    next.identity_alignment * 0.25 +
    next.intention_alignment * 0.25 +
    next.action_alignment * 0.25 -
    entropyPenalty;

  const continuity_score = clamp(rawContinuity, 20, 95);

  return {
    ...next,
    continuity_score,
  };
}

async function upsertContinuityState(
  operatorId: string,
  next: Omit<ContinuityState, "operator_id" | "updated_at">,
) {
  const now = new Date().toISOString();

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
      operatorId,
      next.perception_alignment,
      next.identity_alignment,
      next.intention_alignment,
      next.action_alignment,
      next.continuity_score,
      now,
    ],
  });

  return now;
}

async function writeEvent(params: {
  event_type: string;
  operator_id: string;
  session_id?: string | null;
  payload: unknown;
  actor_kind?: "human" | "system" | "ai";
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
      params.event_type,
      new Date().toISOString(),
      SCHEMA_VERSION,
      params.actor_kind ?? "human",
      null,
      params.operator_id,
      params.session_id ?? null,
      null,
      null,
      JSON.stringify(params.payload),
      JSON.stringify({ formula_version: FORMULA_VERSION }),
    ],
  });
}

async function updateDerivedSessionIndex(params: {
  operator_id: string;
  session_id: string;
  occurred_at: string;
  distortion_class: DistortionClass;
  outcome: SessionOutcome;
  clarity_rating: number;
  steps_completed: number;
  continuity_before: number;
  continuity_after: number;
  protocol: string;
}) {
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
      params.operator_id,
      params.session_id,
      params.occurred_at,
      params.distortion_class,
      params.outcome,
      params.clarity_rating,
      params.steps_completed,
      params.continuity_before,
      params.continuity_after,
      params.continuity_after - params.continuity_before,
      params.protocol,
      FORMULA_VERSION,
      1,
      new Date().toISOString(),
    ],
  });
}

export async function submitSessionForm(formData: FormData) {
  await initDbIfNeeded();

  const input = parseSessionForm(formData);
  const sessionId = randomUUID();

  const previous = await getOrCreateContinuityState(input.operator_id);
  const lastUpdatedAt = await getLastContinuityTimestamp(input.operator_id);
  const entropyPenalty = computeEntropyPenalty(lastUpdatedAt);
  const next = calculateContinuityUpdate(previous, input, entropyPenalty);
  const occurredAt = new Date().toISOString();

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
      input.distortion_class,
      input.origin,
      input.thought,
      input.emotion,
      input.behavior,
      input.protocol,
      input.next_action,
      input.clarity_rating,
      input.outcome,
      9,
      previous.continuity_score,
      next.continuity_score,
      occurredAt,
    ],
  });

  const continuityUpdatedAt = await upsertContinuityState(input.operator_id, next);

  await writeEvent({
    event_type: "session.closed",
    operator_id: input.operator_id,
    session_id: sessionId,
    payload: {
      trigger: input.trigger,
      distortion_class: input.distortion_class,
      outcome: input.outcome,
      clarity_rating: input.clarity_rating,
      protocol: input.protocol,
      next_action: input.next_action,
      continuity_before: previous.continuity_score,
      continuity_after: next.continuity_score,
    },
    actor_kind: "human",
  });

  await writeEvent({
    event_type: "continuity.calculated",
    operator_id: input.operator_id,
    session_id: sessionId,
    payload: {
      formula_version: FORMULA_VERSION,
      continuity_before: previous.continuity_score,
      continuity_after: next.continuity_score,
      perception_alignment: next.perception_alignment,
      identity_alignment: next.identity_alignment,
      intention_alignment: next.intention_alignment,
      action_alignment: next.action_alignment,
      entropy_penalty: entropyPenalty,
      updated_at: continuityUpdatedAt,
    },
    actor_kind: "system",
  });

  await updateDerivedSessionIndex({
    operator_id: input.operator_id,
    session_id: sessionId,
    occurred_at: occurredAt,
    distortion_class: input.distortion_class,
    outcome: input.outcome,
    clarity_rating: input.clarity_rating,
    steps_completed: 9,
    continuity_before: previous.continuity_score,
    continuity_after: next.continuity_score,
    protocol: input.protocol,
  });

  revalidatePath("/session");
  revalidatePath("/dashboard");
  redirect("/session?saved=1");
}

export async function getDashboardState(
  operatorId = DEFAULT_OPERATOR_ID,
): Promise<DashboardState> {
  await initDbIfNeeded();

  const continuity = await getOrCreateContinuityState(operatorId);

  let activeFracturesCount = 0;
  try {
    const active = await db.execute({
      sql: `
        SELECT COUNT(*) AS count
        FROM sessions
        WHERE operator_id = ?
          AND outcome IN ('unresolved', 'escalated')
      `,
      args: [operatorId],
    });

    const row = active.rows?.[0] as Record<string, unknown> | undefined;
    activeFracturesCount = Number(row?.count ?? 0);
  } catch {
    activeFracturesCount = 0;
  }

  let recentSessions: DashboardState["recentSessions"] = [];
  try {
    const recent = await db.execute({
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

    recentSessions = (recent.rows ?? []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        trigger: String(row.trigger ?? ""),
        distortion_class: String(row.distortion_class ?? "narrative") as DistortionClass,
        outcome: String(row.outcome ?? "unresolved") as SessionOutcome,
        clarity_rating: Number(row.clarity_rating ?? 0),
        continuity_before: Number(row.continuity_score_before ?? 0),
        continuity_after: Number(row.continuity_score_after ?? 0),
        created_at: String(row.created_at ?? ""),
      };
    });
  } catch {
    recentSessions = [];
  }

  return {
    continuity,
    activeFracturesCount,
    recentSessions,
  };
}

export async function getVolatilityBand(operatorId = DEFAULT_OPERATOR_ID) {
  await initDbIfNeeded();

  try {
    const res = await db.execute({
      sql: `
        SELECT volatility_band
        FROM derived_volatility
        WHERE operator_id = ?
          AND window_days = 30
        LIMIT 1
      `,
      args: [operatorId],
    });

    const row = res.rows?.[0] as Record<string, unknown> | undefined;
    return String(row?.volatility_band ?? "low");
  } catch {
    return "low";
  }
}

export async function rebuildVolatilitySnapshot(operatorId = DEFAULT_OPERATOR_ID) {
  await initDbIfNeeded();

  const recent = await db.execute({
    sql: `
      SELECT clarity_rating, continuity_score_after
      FROM sessions
      WHERE operator_id = ?
        AND created_at >= datetime('now', '-30 days')
      ORDER BY created_at ASC
    `,
    args: [operatorId],
  });

  const clarityValues: number[] = [];
  const continuityValues: number[] = [];

  for (const r of recent.rows ?? []) {
    const row = r as Record<string, unknown>;
    clarityValues.push(Number(row.clarity_rating ?? 0));
    continuityValues.push(Number(row.continuity_score_after ?? 0));
  }

  const clarityVariance = variance(clarityValues);
  const continuityVariance = variance(continuityValues);
  const maxVariance = Math.max(clarityVariance, continuityVariance);

  let volatilityBand = "low";
  if (maxVariance > 12) volatilityBand = "high";
  else if (maxVariance >= 4) volatilityBand = "medium";

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
      volatilityBand,
      new Date().toISOString(),
    ],
  });

  revalidatePath("/dashboard");
  return { ok: true as const, volatilityBand };
}
// ==============================
// LOGS SUPPORT (V1 KERNEL)
// ==============================


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

export async function getRecentSessions(limit = 50): Promise<SessionLogRow[]> {
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
      distortion_class: String(row.distortion_class ?? "narrative") as DistortionClass,
      protocol: String(row.protocol ?? ""),
      next_action: String(row.next_action ?? ""),
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
      UPDATE continuity_states
      SET
        perception_alignment = 50,
        identity_alignment = 50,
        intention_alignment = 50,
        action_alignment = 50,
        continuity_score = 50,
        updated_at = datetime('now')
      WHERE operator_id = ?
    `,
    args: ["op_legacy"],
  });

  return { ok: true as const };
}