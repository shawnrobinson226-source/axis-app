import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as resetRoute from "@/app/api/v1/reset/route";
import * as discernRoute from "@/app/api/v1/session/discern/route";
import { makeRequest, provisionSchema, resetRows, rowCounts, seedOperator } from "./helpers";

const OPERATOR = "op_test_disabled_operator";

beforeAll(async () => {
  await provisionSchema();
});

beforeEach(async () => {
  await resetRows();
  await seedOperator(OPERATOR);
  vi.mocked(fetch).mockClear();
});

describe("POST /api/v1/reset (disabled)", () => {
  it("-> 404 not_found and seeded rows are untouched", async () => {
    const before = await rowCounts();
    expect(before.continuity_states).toBe(1);
    expect(before.events).toBe(1);
    const res = await resetRoute.POST();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not_found" });
    expect(await rowCounts()).toEqual(before);
  });

  it("exports only POST (other methods fall to framework 405)", () => {
    expect(Object.keys(resetRoute).sort()).toEqual(["POST"]);
  });
});

describe("POST /api/v1/session/discern (disabled)", () => {
  it("-> 404 not_found, no outbound request even with an API key present, rows untouched", async () => {
    process.env.ANTHROPIC_API_KEY = "test-dummy-not-a-key";
    try {
      const before = await rowCounts();
      const res = await discernRoute.POST();
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "not_found" });
      expect(fetch).not.toHaveBeenCalled();
      expect(await rowCounts()).toEqual(before);
    } finally {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it("exports only POST (other methods fall to framework 405)", () => {
    expect(Object.keys(discernRoute).sort()).toEqual(["POST"]);
  });

  it("handler ignores a request argument entirely", async () => {
    const req = makeRequest("/api/v1/session/discern", {
      method: "POST",
      body: { trigger: "x", fracture_id: "y" },
    });
    const res = await (discernRoute.POST as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
});
