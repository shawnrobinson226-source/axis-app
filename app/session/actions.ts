"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, initDbIfNeeded } from "@/lib/db/client";
import { processSession } from "@/lib/session/process";

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
  stability: number;
  reference: boolean;
  impact: number;
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
  const operator_id = asString(formData.get("operator_id"));
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
  const clarity_rating = clamp(
    asNumber(formData.get("clarity_rating") ?? formData.get("clarity_0_10"), 5),
    0,
    10,
  );
  const outcome = parseOutcome(asString(formData.get("outcome")) || "reduced");

  const stability = clamp(asNumber(formData.get("stability"), 5), 0, 10);
  const reference = asString(formData.get("reference")) === "yes";
  const impact = clamp(asNumber(formData.get("impact"), 3), 0, 10);

  if (!operator_id) throw new Error("Operator identity is required.");
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
    stability,
    reference,
    impact,
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



// âœ… CORE SAVE FUNCTION (API + Server Action safe)
export async function saveSessionCore(input: {
  operator_id: string;
  trigger: string;
  distortion_class: string;
  next_action: string;
}) {
  return processSession({
    operator_id: input.operator_id,
    trigger: input.trigger,
    distortion_class: input.distortion_class,
    origin: "api",
    thought: input.trigger,
    emotion: "unspecified",
    behavior: "unspecified",
    protocol: "aligned_action",
    next_action: input.next_action,
    clarity_rating: 5,
    outcome: "reduced",
    stability: 5,
    reference: true,
    impact: 3,
  });
}

export async function submitSessionForm(formData: FormData) {
  const input = parseSessionForm(formData);
  await processSession(input);

  redirect("/session?saved=1");
}

export async function getDashboardState(
  operatorId: string,
): Promise<DashboardState> {
  if (!operatorId.trim()) {
    throw new Error("Operator identity is required.");
  }

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
  operatorId: string,
): Promise<"low" | "medium" | "high"> {
  if (!operatorId.trim()) {
    throw new Error("Operator identity is required.");
  }

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

export async function getRecentSessions(operatorId: string, limit = 50): Promise<SessionLogRow[]> {
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
    args: [operatorId, n],
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

export async function resetSessions(operatorId: string) {
  if (!operatorId.trim()) {
    throw new Error("Operator identity is required.");
  }

  await initDbIfNeeded();

  await db.execute({
    sql: `DELETE FROM sessions WHERE operator_id = ?`,
    args: [operatorId],
  });

  await db.execute({
    sql: `DELETE FROM events WHERE operator_id = ?`,
    args: [operatorId],
  });

  await db.execute({
    sql: `DELETE FROM derived_session_index WHERE operator_id = ?`,
    args: [operatorId],
  });

  await db.execute({
    sql: `DELETE FROM derived_recurrence_stats WHERE operator_id = ?`,
    args: [operatorId],
  });

  await db.execute({
    sql: `DELETE FROM derived_recovery_stats WHERE operator_id = ?`,
    args: [operatorId],
  });

  await db.execute({
    sql: `DELETE FROM derived_volatility WHERE operator_id = ?`,
    args: [operatorId],
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
    args: [operatorId, 50, 50, 50, 50, 50],
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/logs");
  revalidatePath("/settings");

  return { ok: true as const };
}
