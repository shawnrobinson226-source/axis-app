// GET read-only checks against schema.sql PLUS a test-only column that models the
// presumed Production drift (sessions.fracture_id). lib/db/schema.sql is not changed.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { GET as stateGET } from "@/app/api/v1/state/route";
import { GET as analyticsGET } from "@/app/api/v2/analytics/route";
import { GET as profileGET } from "@/app/api/v2/operator-profile/route";
import {
  hasSessionsFractureIdColumn,
  makeRequest,
  provisionSchema,
  resetRows,
  rowCounts,
  seedOperator,
  tableSnapshot,
} from "./helpers";

const UNKNOWN = "op_drift_unknown";
const SEEDED = "op_drift_seeded";

async function seedSessions(operatorId: string) {
  const rows: Array<[string, number, number]> = [
    ["reduced", 2, 40],
    ["unresolved", 9, 70],
    ["escalated", 1, 30],
  ];
  let i = 0;
  for (const [outcome, clarity, continuity] of rows) {
    i += 1;
    await db.execute({
      sql: `INSERT INTO sessions (
        id, operator_id, trigger, distortion_class, fracture_id, origin, thought, emotion,
        behavior, protocol, next_action, clarity_rating, outcome, steps_completed,
        continuity_score_before, continuity_score_after, created_at
      ) VALUES (?, ?, ?, 'narrative', 'f1', 'test', 't', 'e', 'b', 'aligned_action', 'n', ?, ?, 9, 50, ?, datetime('now', ?))`,
      args: [`s-${operatorId}-${i}`, operatorId, `trigger ${i}`, clarity, outcome, continuity, `-${i} hours`],
    });
  }
}

async function get(handler: (r: Request) => Promise<Response>, path: string, operatorId: string) {
  const res = await handler(makeRequest(path, { headers: { "x-operator-id": operatorId } }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { res, json: (await res.json()) as { ok: boolean; data: Record<string, any> } };
}

beforeAll(async () => {
  await provisionSchema();
  await db.execute(`ALTER TABLE sessions ADD COLUMN fracture_id TEXT`);
  expect(await hasSessionsFractureIdColumn()).toBe(true);
});

beforeEach(async () => {
  await resetRows();
  await seedOperator(SEEDED);
  await seedSessions(SEEDED);
});

describe("GET /api/v1/state", () => {
  it("unknown ID -> 200 defaults, zero row changes", async () => {
    const before = await rowCounts();
    const snap = await tableSnapshot();
    const { res, json } = await get(stateGET, "/api/v1/state", UNKNOWN);
    expect(res.status).toBe(200);
    expect(json.data.continuity.operator_id).toBe(UNKNOWN);
    expect(json.data.continuity.continuity_score).toBe(50);
    expect(json.data.activeFracturesCount).toBe(0);
    expect(json.data.recentSessions).toEqual([]);
    expect(json.data.volatilityBand).toBe("low");
    expect(await rowCounts()).toEqual(before);
    expect(await tableSnapshot()).toEqual(snap);
  });

  it("seeded ID -> 200 stored values, computed band, zero row changes", async () => {
    const before = await rowCounts();
    const snap = await tableSnapshot();
    const { res, json } = await get(stateGET, "/api/v1/state", SEEDED);
    expect(res.status).toBe(200);
    expect(json.data.continuity.continuity_score).toBe(62.5);
    expect(json.data.activeFracturesCount).toBe(2);
    expect(json.data.recentSessions).toHaveLength(3);
    expect(json.data.volatilityBand).toBe("high");
    expect(await rowCounts()).toEqual(before);
    expect(await tableSnapshot()).toEqual(snap);
    expect(before.derived_volatility).toBe(0);
  });

  it("stored derived_volatility band conflicting with session data is ignored; no table contents change", async () => {
    await db.execute({
      sql: `INSERT INTO derived_volatility (operator_id, window_days, clarity_variance, continuity_variance, volatility_band, updated_at)
            VALUES (?, 30, 0, 0, 'low', '2026-01-01T00:00:00.000Z')`,
      args: [SEEDED],
    });
    const before = await tableSnapshot();
    const { json } = await get(stateGET, "/api/v1/state", SEEDED);
    expect(json.data.volatilityBand).toBe("high");
    expect(await tableSnapshot()).toEqual(before);
  });

  it("stored band for an operator with no sessions is ignored (computed low, stored high)", async () => {
    await db.execute({
      sql: `INSERT INTO derived_volatility (operator_id, window_days, clarity_variance, continuity_variance, volatility_band, updated_at)
            VALUES (?, 30, 99, 99, 'high', '2026-01-01T00:00:00.000Z')`,
      args: [UNKNOWN],
    });
    const before = await tableSnapshot();
    const { json } = await get(stateGET, "/api/v1/state", UNKNOWN);
    expect(json.data.volatilityBand).toBe("low");
    expect(await tableSnapshot()).toEqual(before);
  });

  it("repeated calls over unchanged session data return the same band; no table contents change", async () => {
    const before = await tableSnapshot();
    const bands: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const { json } = await get(stateGET, "/api/v1/state", SEEDED);
      bands.push(json.data.volatilityBand);
    }
    expect(bands).toEqual(["high", "high", "high"]);
    expect(await tableSnapshot()).toEqual(before);
  });
});

describe("GET /api/v2/analytics", () => {
  it("unknown ID -> 200 defaults, zero row changes", async () => {
    const before = await rowCounts();
    const snap = await tableSnapshot();
    const { res, json } = await get(analyticsGET, "/api/v2/analytics", UNKNOWN);
    expect(res.status).toBe(200);
    expect(json.data.continuity.continuity_score).toBe(50);
    expect(json.data.recentSessions).toEqual([]);
    expect(json.data.volatilityBand).toBe("low");
    expect(await rowCounts()).toEqual(before);
    expect(await tableSnapshot()).toEqual(snap);
  });

  it("seeded ID -> 200 stored values (includes trigger text), zero row changes", async () => {
    const before = await rowCounts();
    const snap = await tableSnapshot();
    const { res, json } = await get(analyticsGET, "/api/v2/analytics", SEEDED);
    expect(res.status).toBe(200);
    expect(json.data.continuity.continuity_score).toBe(62.5);
    expect(json.data.recentSessions[0].trigger).toBe("trigger 1");
    expect(await rowCounts()).toEqual(before);
    expect(await tableSnapshot()).toEqual(snap);
  });
});

describe("GET /api/v2/operator-profile", () => {
  it("unknown ID -> 200 defaults, zero row changes", async () => {
    const before = await rowCounts();
    const snap = await tableSnapshot();
    const { res, json } = await get(profileGET, "/api/v2/operator-profile", UNKNOWN);
    expect(res.status).toBe(200);
    expect(json.data.operator).toMatchObject({ operator_id: UNKNOWN, continuity_score: 50 });
    expect(json.data.activity).toEqual({
      active_fractures: 0,
      recent_session_count: 0,
      volatility_band: "low",
    });
    expect(await rowCounts()).toEqual(before);
    expect(await tableSnapshot()).toEqual(snap);
  });

  it("seeded ID -> 200 stored values, zero row changes", async () => {
    const before = await rowCounts();
    const snap = await tableSnapshot();
    const { res, json } = await get(profileGET, "/api/v2/operator-profile", SEEDED);
    expect(res.status).toBe(200);
    expect(json.data.operator.continuity_score).toBe(62.5);
    expect(json.data.activity).toEqual({
      active_fractures: 2,
      recent_session_count: 3,
      volatility_band: "high",
    });
    expect(await rowCounts()).toEqual(before);
    expect(await tableSnapshot()).toEqual(snap);
  });
});

describe("missing operator header on GETs (unchanged)", () => {
  for (const [path, handler] of [
    ["/api/v1/state", stateGET],
    ["/api/v2/analytics", analyticsGET],
    ["/api/v2/operator-profile", profileGET],
  ] as const) {
    it(`GET ${path} without x-operator-id -> 401, zero row changes`, async () => {
      const before = await rowCounts();
      const snap = await tableSnapshot();
      const res = await handler(makeRequest(path));
      expect(res.status).toBe(401);
      expect(await rowCounts()).toEqual(before);
      expect(await tableSnapshot()).toEqual(snap);
    });
  }
});
