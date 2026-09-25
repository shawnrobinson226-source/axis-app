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
} from "./helpers";

const routes = [
  ["/api/v1/state", stateGET],
  ["/api/v2/analytics", analyticsGET],
  ["/api/v2/operator-profile", profileGET],
] as const;

beforeAll(async () => {
  await provisionSchema();
});

beforeEach(async () => {
  await resetRows();
});

describe("pure schema.sql database", () => {
  it("has no sessions.fracture_id column", async () => {
    expect(await hasSessionsFractureIdColumn()).toBe(false);
  });

  for (const [path, handler] of routes) {
    for (const kind of ["unknown", "seeded"] as const) {
      it(`GET ${path} (${kind} ID) -> generic 500 from schema drift, zero row changes`, async () => {
        const operatorId = `op_schema_${kind}`;
        if (kind === "seeded") await seedOperator(operatorId);
        const before = await rowCounts();
        const res = await handler(makeRequest(path, { headers: { "x-operator-id": operatorId } }));
        const text = await res.text();
        expect(res.status).toBe(500);
        expect(JSON.parse(text).error).toBe("internal_error");
        expect(text).not.toMatch(/fracture_id|SQLITE|no such column/i);
        expect(await rowCounts()).toEqual(before);
      });
    }
  }
});
