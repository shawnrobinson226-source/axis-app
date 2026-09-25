import { db, initDbIfNeeded } from "@/lib/db/client";

export const TOO_SHORT_TOKEN = "local-test-not-a-secret";
// Meets the 32-character floor; still a public, non-secret test literal.
export const TEST_TOKEN = "local-test-not-a-secret-000000000";

const ROW_TABLES = [
  "sessions",
  "continuity_states",
  "events",
  "derived_session_index",
  "derived_recurrence_stats",
  "derived_recovery_stats",
  "derived_volatility",
  "operator_profiles",
] as const;

export async function provisionSchema() {
  await initDbIfNeeded();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS operator_profiles (
      operator_id TEXT PRIMARY KEY,
      display_name TEXT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

export async function resetRows() {
  for (const table of ROW_TABLES) {
    await db.execute(`DELETE FROM ${table}`);
  }
}

export async function rowCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of ROW_TABLES) {
    const res = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
    counts[table] = Number((res.rows[0] as Record<string, unknown>).n);
  }
  return counts;
}

export async function hasSessionsFractureIdColumn(): Promise<boolean> {
  const res = await db.execute(`PRAGMA table_info(sessions)`);
  return res.rows.some((r) => (r as Record<string, unknown>).name === "fracture_id");
}

let ipCounter = 0;
export function nextIp() {
  ipCounter += 1;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

export function makeRequest(
  pathName: string,
  init: { method?: string; headers?: Record<string, string>; body?: unknown } = {},
) {
  const headers: Record<string, string> = {
    "x-forwarded-for": nextIp(),
    ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };
  return new Request(`http://localhost${pathName}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

export async function seedOperator(operatorId: string) {
  await db.execute({
    sql: `INSERT INTO continuity_states (
      operator_id, perception_alignment, identity_alignment, intention_alignment,
      action_alignment, continuity_score, updated_at
    ) VALUES (?, 61, 62, 63, 64, 62.5, '2026-01-01T00:00:00.000Z')`,
    args: [operatorId],
  });
  await db.execute({
    sql: `INSERT INTO events (
      event_id, event_type, occurred_at, schema_version, actor_kind, actor_id,
      operator_id, payload_json
    ) VALUES (?, 'seed', '2026-01-01T00:00:00.000Z', 'v1', 'human', ?, ?, '{}')`,
    args: [`evt-${operatorId}`, operatorId, operatorId],
  });
}
