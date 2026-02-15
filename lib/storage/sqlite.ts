// lib/storage/sqlite.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "vanta.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new Database(dbPath);

// Create logs table if it does not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,

    stateId TEXT,
    modeId TEXT,
    toolId TEXT,

    loopId TEXT,
    loopRunId TEXT,

    stepOrder INTEGER,
    stepLabel TEXT,

    status TEXT,
    note TEXT,

    level INTEGER,
    tags TEXT
  );
`);
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_logs_timestamp
  ON logs (timestamp);

  CREATE INDEX IF NOT EXISTS idx_logs_loop
  ON logs (loopId);

  CREATE INDEX IF NOT EXISTS idx_logs_loopRun
  ON logs (loopRunId);
`);

export default db;
