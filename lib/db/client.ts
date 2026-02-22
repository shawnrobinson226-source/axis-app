import { createClient, type Client } from "@libsql/client";
import fs from "node:fs/promises";
import path from "node:path";
import { seedDb } from "./seed";

declare global {
  // eslint-disable-next-line no-var
  var __vantaDbClient: Client | undefined;
  // eslint-disable-next-line no-var
  var __vantaDbInitialized: boolean | undefined;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

export function getDb(): Client {
  if (!globalThis.__vantaDbClient) {
    const url = requireEnv("TURSO_DATABASE_URL");
    const authToken = requireEnv("TURSO_AUTH_TOKEN");
    globalThis.__vantaDbClient = createClient({ url, authToken });
  }
  return globalThis.__vantaDbClient;
}

async function runSchema(db: Client) {
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
  const raw = await fs.readFile(schemaPath, "utf8");

  const statements = raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sql of statements) {
    await db.execute({ sql });
  }
}

export async function initDbIfNeeded(): Promise<void> {
  if (globalThis.__vantaDbInitialized) return;

  const db = getDb();
  await runSchema(db);
  await seedDb(db);

  globalThis.__vantaDbInitialized = true;
}