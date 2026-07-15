import { db, initDbIfNeeded } from "@/lib/db/client";

export type ContinuityState = {
  operator_id: string;
  perception_alignment: number;
  identity_alignment: number;
  intention_alignment: number;
  action_alignment: number;
  continuity_score: number;
  updated_at: string;
};

export type ContinuityDelta = {
  perception: number;
  identity: number;
  intention: number;
  action: number;
};

const DEFAULT_CONTINUITY_SCORE = 50;
const MIN_CONTINUITY_SCORE = 20;
const MAX_CONTINUITY_SCORE = 95;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readNumber(
  row: Record<string, unknown>,
  key: string,
  fallback = 0,
): number {
  return Number(row[key] ?? fallback);
}

function readString(
  row: Record<string, unknown>,
  key: string,
  fallback = "",
): string {
  return String(row[key] ?? fallback);
}

export async function getOrCreateContinuityState(
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

  const first = existing.rows?.[0] as Record<string, unknown> | undefined;

  if (first) {
    return {
      operator_id: readString(first, "operator_id"),
      perception_alignment: readNumber(
        first,
        "perception_alignment",
        DEFAULT_CONTINUITY_SCORE,
      ),
      identity_alignment: readNumber(
        first,
        "identity_alignment",
        DEFAULT_CONTINUITY_SCORE,
      ),
      intention_alignment: readNumber(
        first,
        "intention_alignment",
        DEFAULT_CONTINUITY_SCORE,
      ),
      action_alignment: readNumber(
        first,
        "action_alignment",
        DEFAULT_CONTINUITY_SCORE,
      ),
      continuity_score: readNumber(
        first,
        "continuity_score",
        DEFAULT_CONTINUITY_SCORE,
      ),
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
    args: [
      operatorId,
      DEFAULT_CONTINUITY_SCORE,
      DEFAULT_CONTINUITY_SCORE,
      DEFAULT_CONTINUITY_SCORE,
      DEFAULT_CONTINUITY_SCORE,
      DEFAULT_CONTINUITY_SCORE,
    ],
  });

  return {
    operator_id: operatorId,
    perception_alignment: DEFAULT_CONTINUITY_SCORE,
    identity_alignment: DEFAULT_CONTINUITY_SCORE,
    intention_alignment: DEFAULT_CONTINUITY_SCORE,
    action_alignment: DEFAULT_CONTINUITY_SCORE,
    continuity_score: DEFAULT_CONTINUITY_SCORE,
    updated_at: new Date().toISOString(),
  };
}

export function applyContinuityUpdate(
  previous: ContinuityState,
  delta: ContinuityDelta,
): ContinuityState {
  const perception_alignment = clamp(
    previous.perception_alignment + delta.perception,
    MIN_CONTINUITY_SCORE,
    MAX_CONTINUITY_SCORE,
  );

  const identity_alignment = clamp(
    previous.identity_alignment * 0.8 +
      (previous.identity_alignment + delta.identity) * 0.2,
    MIN_CONTINUITY_SCORE,
    MAX_CONTINUITY_SCORE,
  );

  const intention_alignment = clamp(
    previous.intention_alignment + delta.intention,
    MIN_CONTINUITY_SCORE,
    MAX_CONTINUITY_SCORE,
  );

  const action_alignment = clamp(
    previous.action_alignment + delta.action,
    MIN_CONTINUITY_SCORE,
    MAX_CONTINUITY_SCORE,
  );

  const continuity_score = clamp(
    (perception_alignment +
      identity_alignment +
      intention_alignment +
      action_alignment) /
      4,
    MIN_CONTINUITY_SCORE,
    MAX_CONTINUITY_SCORE,
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

export async function saveContinuityState(
  state: ContinuityState,
): Promise<void> {
  await initDbIfNeeded();

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
      state.operator_id,
      state.perception_alignment,
      state.identity_alignment,
      state.intention_alignment,
      state.action_alignment,
      state.continuity_score,
      state.updated_at,
    ],
  });
}