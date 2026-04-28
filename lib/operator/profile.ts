import { db, initDbIfNeeded } from "@/lib/db/client";

export type OperatorProfile = {
  operator_id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
};

async function ensureOperatorProfilesTable() {
  await initDbIfNeeded();
  await db.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS operator_profiles (
        operator_id TEXT PRIMARY KEY,
        display_name TEXT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
  });
}

function requireOperatorId(operatorId: string) {
  const cleanOperatorId = operatorId.trim();
  if (!cleanOperatorId) {
    throw new Error("Operator identity is required.");
  }
  return cleanOperatorId;
}

function readString(row: Record<string, unknown>, key: string, fallback = "") {
  return String(row[key] ?? fallback);
}

export async function getOperatorProfile(
  operatorId: string,
): Promise<OperatorProfile> {
  const cleanOperatorId = requireOperatorId(operatorId);
  await ensureOperatorProfilesTable();

  const result = await db.execute({
    sql: `
      SELECT operator_id, display_name, created_at, updated_at
      FROM operator_profiles
      WHERE operator_id = ?
      LIMIT 1
    `,
    args: [cleanOperatorId],
  });

  const row = result.rows?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    const timestamp = new Date().toISOString();
    return {
      operator_id: cleanOperatorId,
      display_name: null,
      created_at: timestamp,
      updated_at: timestamp,
    };
  }

  return {
    operator_id: readString(row, "operator_id", cleanOperatorId),
    display_name:
      typeof row.display_name === "string" && row.display_name.trim()
        ? row.display_name
        : null,
    created_at: readString(row, "created_at"),
    updated_at: readString(row, "updated_at"),
  };
}

export async function upsertOperatorProfile(
  operatorId: string,
  displayName: string | null,
): Promise<OperatorProfile> {
  const cleanOperatorId = requireOperatorId(operatorId);
  const cleanDisplayName =
    typeof displayName === "string" && displayName.trim()
      ? displayName.trim()
      : null;
  const timestamp = new Date().toISOString();

  await ensureOperatorProfilesTable();

  await db.execute({
    sql: `
      INSERT INTO operator_profiles (
        operator_id,
        display_name,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(operator_id) DO UPDATE SET
        display_name = excluded.display_name,
        updated_at = excluded.updated_at
    `,
    args: [cleanOperatorId, cleanDisplayName, timestamp, timestamp],
  });

  return getOperatorProfile(cleanOperatorId);
}
