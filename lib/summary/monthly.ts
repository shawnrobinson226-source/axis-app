import { db, initDbIfNeeded } from "@/lib/db/client";
import { DISTORTION_CLASSES, type DistortionClass } from "@/lib/kernel/distortion-types";

const OUTCOMES = ["reduced", "unresolved", "escalated"] as const;

type Outcome = (typeof OUTCOMES)[number];

type SummaryRow = {
  distortion_class: string;
  next_action: string;
  outcome: string;
  continuity_after: number | null;
  created_at: string;
};

export type ThirtyDaySummary = {
  total_sessions: number;
  distortion_frequency: Record<DistortionClass, number>;
  outcome_distribution: Record<Outcome, number>;
  most_common_distortion: DistortionClass | null;
  continuity_change: {
    start: number | null;
    end: number | null;
    delta: number | null;
  };
  most_repeated_pattern: string | null;
  most_common_action: string | null;
};

export const EMPTY_30_DAY_SUMMARY: ThirtyDaySummary = {
  total_sessions: 0,
  distortion_frequency: {
    narrative: 0,
    emotional: 0,
    behavioral: 0,
    perceptual: 0,
    continuity: 0,
  },
  outcome_distribution: {
    reduced: 0,
    unresolved: 0,
    escalated: 0,
  },
  most_common_distortion: null,
  continuity_change: {
    start: null,
    end: null,
    delta: null,
  },
  most_repeated_pattern: null,
  most_common_action: null,
};

function cloneEmptySummary(): ThirtyDaySummary {
  return {
    total_sessions: EMPTY_30_DAY_SUMMARY.total_sessions,
    distortion_frequency: { ...EMPTY_30_DAY_SUMMARY.distortion_frequency },
    outcome_distribution: { ...EMPTY_30_DAY_SUMMARY.outcome_distribution },
    most_common_distortion: null,
    continuity_change: { ...EMPTY_30_DAY_SUMMARY.continuity_change },
    most_repeated_pattern: null,
    most_common_action: null,
  };
}

function isDistortionClass(value: string): value is DistortionClass {
  return DISTORTION_CLASSES.includes(value as DistortionClass);
}

function isOutcome(value: string): value is Outcome {
  return OUTCOMES.includes(value as Outcome);
}

function readString(row: Record<string, unknown>, key: string) {
  return String(row[key] ?? "");
}

function readNullableNumber(row: Record<string, unknown>, key: string) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : null;
}

function highestCount<T extends string>(
  entries: Array<[T, number]>,
): T | null {
  let winner: T | null = null;
  let winnerCount = 0;

  for (const [key, count] of entries) {
    if (count > winnerCount) {
      winner = key;
      winnerCount = count;
    }
  }

  return winnerCount > 0 ? winner : null;
}

export async function get30DaySummary(
  operator_id: string,
): Promise<ThirtyDaySummary> {
  const operatorId = operator_id.trim();
  if (!operatorId) {
    throw new Error("Operator identity is required.");
  }

  await initDbIfNeeded();

  const result = await db.execute({
    sql: `
      SELECT
        distortion_class,
        next_action,
        outcome,
        continuity_score_after,
        created_at
      FROM sessions
      WHERE operator_id = ?
        AND created_at >= datetime('now', '-30 day')
      ORDER BY created_at ASC
    `,
    args: [operatorId],
  });

  const rows: SummaryRow[] = (result.rows ?? []).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      distortion_class: readString(row, "distortion_class"),
      next_action: readString(row, "next_action"),
      outcome: readString(row, "outcome"),
      continuity_after: readNullableNumber(row, "continuity_score_after"),
      created_at: readString(row, "created_at"),
    };
  });

  if (rows.length === 0) {
    return cloneEmptySummary();
  }

  const summary = cloneEmptySummary();
  summary.total_sessions = rows.length;

  const patternCounts = new Map<string, number>();
  const actionCounts = new Map<string, { count: number; display: string }>();

  for (const row of rows) {
    if (isDistortionClass(row.distortion_class)) {
      summary.distortion_frequency[row.distortion_class] += 1;
    }

    if (isOutcome(row.outcome)) {
      summary.outcome_distribution[row.outcome] += 1;
    }

    if (isDistortionClass(row.distortion_class) && isOutcome(row.outcome)) {
      const key = `${row.distortion_class} → ${row.outcome}`;
      patternCounts.set(key, (patternCounts.get(key) ?? 0) + 1);
    }

    const normalizedAction = row.next_action.trim().toLowerCase();
    if (normalizedAction) {
      const existing = actionCounts.get(normalizedAction);
      actionCounts.set(normalizedAction, {
        count: (existing?.count ?? 0) + 1,
        display: existing?.display ?? row.next_action.trim(),
      });
    }
  }

  summary.most_common_distortion = highestCount(
    DISTORTION_CLASSES.map((key) => [
      key,
      summary.distortion_frequency[key],
    ]),
  );

  summary.most_repeated_pattern = highestCount(
    Array.from(patternCounts.entries()),
  );

  const mostCommonActionKey = highestCount(
    Array.from(actionCounts.entries()).map(([key, value]) => [
      key,
      value.count,
    ]),
  );
  summary.most_common_action = mostCommonActionKey
    ? actionCounts.get(mostCommonActionKey)?.display ?? null
    : null;

  const firstContinuity = rows[0]?.continuity_after ?? null;
  const lastContinuity = rows[rows.length - 1]?.continuity_after ?? null;
  summary.continuity_change = {
    start: firstContinuity,
    end: lastContinuity,
    delta:
      firstContinuity !== null && lastContinuity !== null
        ? lastContinuity - firstContinuity
        : null,
  };

  return summary;
}
