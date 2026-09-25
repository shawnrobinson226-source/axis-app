// Runs before every test file's imports. Forces an isolated local SQLite file
// under <repo>/.test-data/ and refuses to continue for any other database URL.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { vi } from "vitest";

const repoRoot = path.resolve(__dirname, "..");
const testDataDir = path.join(repoRoot, ".test-data");
fs.mkdirSync(testDataDir, { recursive: true });

const dbFile = path.join(testDataDir, `axis-test-${randomUUID()}.db`);
process.env.TURSO_DATABASE_URL = `file:${dbFile}`;
// requireEnv() demands a non-empty value; libsql ignores it for file: URLs.
process.env.TURSO_AUTH_TOKEN = "local-test-no-auth";
delete process.env.AXIS_SERVICE_TOKEN;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;

const url = process.env.TURSO_DATABASE_URL;
if (!url.startsWith("file:")) {
  throw new Error("Refusing to run tests: database URL is not a file: URL.");
}
const resolved = path.resolve(url.slice("file:".length));
if (!resolved.startsWith(testDataDir + path.sep)) {
  throw new Error("Refusing to run tests: database file is outside .test-data/.");
}

// Fresh DB client per test file.
globalThis.__vantaDbClient = undefined;
globalThis.__vantaDbInitialized = undefined;
globalThis.__vantaDbInitPromise = undefined;

// Any outbound network call fails the test that made it.
vi.stubGlobal(
  "fetch",
  vi.fn(async () => {
    throw new Error("Network access is disabled in tests.");
  }),
);
