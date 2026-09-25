// Characterizes POST /api/v1/session, which this Lock intentionally leaves unchanged.
// It is NOT behind A1: it accepts any non-empty x-operator-id with no credential.
// Downstream success is not asserted because local schema.sql lacks sessions.fracture_id.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/v1/session/route";
import { makeRequest, provisionSchema, resetRows, rowCounts } from "./helpers";

beforeAll(async () => {
  await provisionSchema();
});

beforeEach(async () => {
  await resetRows();
  process.env.AXIS_SERVICE_TOKEN = "local-test-not-a-secret-000000000";
});

describe("POST /api/v1/session (unchanged, arbitrary-ID write path)", () => {
  it("no Authorization header, arbitrary ID, unknown field -> 400 validation (never 401): no credential layer exists", async () => {
    const before = await rowCounts();
    const res = await POST(
      makeRequest("/api/v1/session", {
        method: "POST",
        headers: { "x-operator-id": "op_any_string_the_caller_chooses" },
        body: { trigger: "t", classification: "narrative", next_action: "n", injected: 1 },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Unexpected fields: injected");
    expect(await rowCounts()).toEqual(before);
  });

  it("missing x-operator-id -> 400 Missing operator identity", async () => {
    const res = await POST(
      makeRequest("/api/v1/session", {
        method: "POST",
        body: { trigger: "t", classification: "narrative", next_action: "n" },
      }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Missing operator identity");
  });

  it("no Authorization, arbitrary ID, valid body -> passes auth-less intake and reaches the DB write path", async () => {
    const before = await rowCounts();
    const res = await POST(
      makeRequest("/api/v1/session", {
        method: "POST",
        headers: { "x-operator-id": "op_any_string_the_caller_chooses" },
        body: { trigger: "t", classification: "narrative", next_action: "n", reference: true },
      }),
    );
    // On local schema.sql the sessions INSERT fails (no fracture_id column), but a
    // continuity_states row for the caller-chosen ID is created first.
    const after = await rowCounts();
    expect(res.status).toBe(400);
    expect(after.continuity_states).toBe(before.continuity_states + 1);
  });
});
