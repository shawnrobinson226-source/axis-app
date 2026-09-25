// Characterizes POST /api/v1/session, which the containment Lock intentionally left unchanged.
// It is NOT behind A1: it accepts any non-empty x-operator-id with no credential.
// KNOWN RESIDUAL, not desired behavior: closed only by browser-session Lock C2.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db/client";
import { POST } from "@/app/api/v1/session/route";
import { makeRequest, provisionSchema, resetRows, rowCounts } from "./helpers";

// revalidatePath needs a live Next.js request store; test-only stub.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

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

  it("KNOWN RESIDUAL (C2): no Authorization, arbitrary caller-chosen ID, valid body -> 200 and a full session write", async () => {
    const callerChosenId = "op_any_string_the_caller_chooses";
    const before = await rowCounts();
    const res = await POST(
      makeRequest("/api/v1/session", {
        method: "POST",
        headers: { "x-operator-id": callerChosenId },
        body: {
          trigger: "t",
          classification: "narrative",
          next_action: "n",
          reference: true,
          fracture_id: "  free-text-fracture  ",
        },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const after = await rowCounts();
    expect(after.sessions).toBe(before.sessions + 1);
    expect(after.continuity_states).toBe(before.continuity_states + 1);
    expect(after.derived_session_index).toBe(before.derived_session_index + 1);
    expect(after.events).toBe(before.events + 2);

    const row = (
      await db.execute({ sql: `SELECT operator_id, fracture_id FROM sessions`, args: [] })
    ).rows[0] as Record<string, unknown>;
    expect(row.operator_id).toBe(callerChosenId);
    // Unvalidated free text, trimmed by process.ts.
    expect(row.fracture_id).toBe("free-text-fracture");
  });
});
