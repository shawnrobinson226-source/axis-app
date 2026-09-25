// GET read-only checks against a DB provisioned strictly from lib/db/schema.sql.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
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

type Json = { ok: boolean; data: Record<string, unknown> };

const routes = [
  ["/api/v1/state", stateGET],
  ["/api/v2/analytics", analyticsGET],
  ["/api/v2/operator-profile", profileGET],
] as const;

// Continuity score each route reports for an unknown ID (defaults) or a seeded ID.
function continuityScore(path: string, data: Record<string, unknown>): unknown {
  if (path === "/api/v2/operator-profile") {
    return (data.operator as Record<string, unknown>).continuity_score;
  }
  return (data.continuity as Record<string, unknown>).continuity_score;
}

beforeAll(async () => {
  await provisionSchema();
});

beforeEach(async () => {
  await resetRows();
});

describe("pure schema.sql database", () => {
  it("defines sessions.fracture_id", async () => {
    expect(await hasSessionsFractureIdColumn()).toBe(true);
  });

  for (const [path, handler] of routes) {
    for (const kind of ["unknown", "seeded"] as const) {
      it(`GET ${path} (${kind} ID) -> 200 with ${kind === "unknown" ? "defaults" : "stored values"}, zero row changes`, async () => {
        const operatorId = `op_schema_${kind}`;
        if (kind === "seeded") await seedOperator(operatorId);
        const before = await rowCounts();
        const snap = await tableSnapshot();
        const res = await handler(makeRequest(path, { headers: { "x-operator-id": operatorId } }));
        expect(res.status).toBe(200);
        const json = (await res.json()) as Json;
        expect(json.ok).toBe(true);
        expect(continuityScore(path, json.data)).toBe(kind === "unknown" ? 50 : 62.5);
        expect(await rowCounts()).toEqual(before);
        expect(await tableSnapshot()).toEqual(snap);
      });
    }
  }
});
