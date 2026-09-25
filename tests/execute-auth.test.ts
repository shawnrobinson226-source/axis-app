import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { POST } from "@/app/api/v2/execute/route";
import {
  TEST_TOKEN,
  TOO_SHORT_TOKEN,
  hasSessionsFractureIdColumn,
  makeRequest,
  provisionSchema,
  resetRows,
  rowCounts,
} from "./helpers";

// revalidatePath needs a live Next.js request store, which direct handler calls do
// not have. Test-only stub; production code is unchanged.
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const OPERATOR = "op_test_execute_operator";
const VALID_BODY = {
  trigger: "Test trigger",
  classification: "narrative",
  next_action: "Take one step",
  reference: true,
};
const GUARD_BLOCKED_BODY = { ...VALID_BODY, stability: 0, reference: false, impact: 10 };

const responseTexts: string[] = [];

async function execute(headers: Record<string, string>, body: unknown = VALID_BODY) {
  const res = await POST(makeRequest("/api/v2/execute", { method: "POST", headers, body }));
  const text = await res.text();
  responseTexts.push(text);
  return { res, text, json: JSON.parse(text) as Record<string, unknown> };
}

let schemaHasFractureId = false;

beforeAll(async () => {
  await provisionSchema();
  schemaHasFractureId = await hasSessionsFractureIdColumn();
});

beforeEach(async () => {
  await resetRows();
  process.env.AXIS_SERVICE_TOKEN = TEST_TOKEN;
  vi.mocked(revalidatePath).mockClear();
});

afterEach(() => {
  delete process.env.AXIS_SERVICE_TOKEN;
});

describe("server configuration", () => {
  const cases: Array<[string, string | undefined]> = [
    ["unset", undefined],
    ["empty", ""],
    ["whitespace-only (40 spaces)", " ".repeat(40)],
    ["too short (literal local-test-not-a-secret, 23 chars)", TOO_SHORT_TOKEN],
  ];

  for (const [label, value] of cases) {
    it(`${label} AXIS_SERVICE_TOKEN -> 503 service_unavailable, zero row changes`, async () => {
      if (value === undefined) delete process.env.AXIS_SERVICE_TOKEN;
      else process.env.AXIS_SERVICE_TOKEN = value;

      const before = await rowCounts();
      const { res, json } = await execute({
        authorization: `Bearer ${value?.trim() || TEST_TOKEN}`,
        "x-operator-id": OPERATOR,
      });
      expect(res.status).toBe(503);
      expect(json).toEqual({ error: "service_unavailable" });
      expect(await rowCounts()).toEqual(before);
    });
  }
});

describe("bearer credential failures are indistinguishable", () => {
  const wrongSameLength = "x".repeat(TEST_TOKEN.length);
  const cases: Array<[string, Record<string, string>]> = [
    ["missing Authorization", {}],
    ["non-Bearer scheme", { authorization: `Basic ${TEST_TOKEN}` }],
    ["empty bearer (trailing space)", { authorization: "Bearer " }],
    ["scheme only", { authorization: "Bearer" }],
    ["two spaces", { authorization: `Bearer  ${TEST_TOKEN}` }],
    ["token with suffix", { authorization: `Bearer ${TEST_TOKEN} extra` }],
    ["wrong token, equal length", { authorization: `Bearer ${wrongSameLength}` }],
    ["wrong token, shorter", { authorization: "Bearer short" }],
    ["wrong token, longer", { authorization: `Bearer ${TEST_TOKEN}0` }],
  ];

  const bodies: string[] = [];

  for (const [label, auth] of cases) {
    it(`${label} -> 401 unauthorized + WWW-Authenticate, zero row changes`, async () => {
      const before = await rowCounts();
      const { res, text } = await execute({ ...auth, "x-operator-id": OPERATOR });
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toBe("Bearer");
      expect(JSON.parse(text)).toEqual({ error: "unauthorized" });
      bodies.push(text);
      expect(await rowCounts()).toEqual(before);
    });
  }

  it("all 401 bodies are byte-identical", () => {
    expect(bodies.length).toBe(cases.length);
    expect(new Set(bodies).size).toBe(1);
  });
});

describe("authorization precedes all DB work", () => {
  it("unauthenticated guard-blocked body -> 401 and no precheck event", async () => {
    const before = await rowCounts();
    const { res } = await execute({ "x-operator-id": OPERATOR }, GUARD_BLOCKED_BODY);
    expect(res.status).toBe(401);
    expect(await rowCounts()).toEqual(before);
    expect(before.events).toBe(0);
  });

  it("unauthenticated request with missing operator header -> 401 (auth first)", async () => {
    const { res } = await execute({});
    expect(res.status).toBe(401);
  });

  it("authenticated guard-blocked body -> 400 guard_blocked; writes exactly one precheck event (existing behavior)", async () => {
    const before = await rowCounts();
    const { res, json } = await execute(
      { authorization: `Bearer ${TEST_TOKEN}`, "x-operator-id": OPERATOR },
      GUARD_BLOCKED_BODY,
    );
    expect(res.status).toBe(400);
    expect(json.error).toBe("guard_blocked");
    const after = await rowCounts();
    expect(after.events).toBe(before.events + 1);
    expect({ ...after, events: 0 }).toEqual({ ...before, events: 0 });
  });
});

describe("existing operator-header behavior after valid auth", () => {
  const auth = { authorization: `Bearer ${TEST_TOKEN}` };

  it("missing x-operator-id -> 400 Missing operator identity", async () => {
    const before = await rowCounts();
    const { res, json } = await execute(auth);
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing operator identity");
    expect(await rowCounts()).toEqual(before);
  });

  it("whitespace x-operator-id -> 400 Missing operator identity", async () => {
    const before = await rowCounts();
    const { res, json } = await execute({ ...auth, "x-operator-id": "   " });
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing operator identity");
    expect(await rowCounts()).toEqual(before);
  });
});

describe("validation after valid auth", () => {
  it("unknown body field -> 400 Unexpected fields, zero row changes (proves auth passed)", async () => {
    const before = await rowCounts();
    const { res, json } = await execute(
      { authorization: `Bearer ${TEST_TOKEN}`, "x-operator-id": OPERATOR },
      { ...VALID_BODY, injected: true },
    );
    expect(res.status).toBe(400);
    expect(json.error).toBe("Unexpected fields: injected");
    expect(await rowCounts()).toEqual(before);
  });

  it("lower-case bearer scheme is accepted (case-insensitive)", async () => {
    const { res, json } = await execute(
      { authorization: `bearer ${TEST_TOKEN}`, "x-operator-id": OPERATOR },
      { ...VALID_BODY, injected: true },
    );
    expect(res.status).toBe(400);
    expect(json.error).toBe("Unexpected fields: injected");
  });

  it("invalid JSON body -> 400 Invalid JSON body", async () => {
    const req = new Request("http://localhost/api/v2/execute", {
      method: "POST",
      headers: {
        authorization: `Bearer ${TEST_TOKEN}`,
        "x-operator-id": OPERATOR,
        "x-forwarded-for": "10.9.9.9",
      },
      body: "{not json",
    });
    const res = await POST(req);
    const text = await res.text();
    responseTexts.push(text);
    expect(res.status).toBe(400);
    expect(JSON.parse(text).error).toBe("Invalid JSON body");
  });

  it("outcome outside locked set -> 400 Invalid outcome, zero row changes", async () => {
    const before = await rowCounts();
    const { res, json } = await execute(
      { authorization: `Bearer ${TEST_TOKEN}`, "x-operator-id": OPERATOR },
      { ...VALID_BODY, outcome: "resolved" },
    );
    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid outcome");
    expect(await rowCounts()).toEqual(before);
  });
});

describe("DB failure responses are generic", () => {
  it("authorized valid body with a local DB error -> 500 internal_error, no SQL text", async () => {
    // Force a genuine libsql error on the local file DB only: hide a table the
    // execute path writes to, then restore it.
    await db.execute(`ALTER TABLE derived_session_index RENAME TO derived_session_index_hidden`);
    try {
      const { res, text } = await execute({
        authorization: `Bearer ${TEST_TOKEN}`,
        "x-operator-id": OPERATOR,
      });
      expect(res.status).toBe(500);
      expect(JSON.parse(text).error).toBe("internal_error");
      expect(text).not.toMatch(/derived_session_index|SQLITE|no such table|libsql/i);
    } finally {
      await db.execute(`ALTER TABLE derived_session_index_hidden RENAME TO derived_session_index`);
    }
  });
});

describe("authorized execute success path", () => {
  it("schema.sql defines sessions.fracture_id", async () => {
    expect(schemaHasFractureId).toBe(true);
  });

  it("valid bearer + operator + valid body -> 200 ok:true with exact row effects", async () => {
    const before = await rowCounts();
    const { res, json } = await execute({
      authorization: `Bearer ${TEST_TOKEN}`,
      "x-operator-id": OPERATOR,
    });
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    const data = json.data as Record<string, unknown>;

    const after = await rowCounts();
    expect(after).toEqual({
      ...before,
      sessions: before.sessions + 1,
      continuity_states: before.continuity_states + 1,
      derived_session_index: before.derived_session_index + 1,
      events: before.events + 2,
    });

    const sessions = await db.execute({
      sql: `SELECT id, operator_id, fracture_id, distortion_class, continuity_score_after FROM sessions`,
      args: [],
    });
    expect(sessions.rows).toHaveLength(1);
    const row = sessions.rows[0] as Record<string, unknown>;
    expect(row.id).toBe(data.sessionId);
    expect(row.operator_id).toBe(OPERATOR);
    // /api/v2/execute passes no fracture_id; process.ts stores "" (input.fracture_id?.trim() ?? "").
    expect(row.fracture_id).toBe("");
    expect(row.distortion_class).toBe("narrative");

    const continuity = await db.execute({
      sql: `SELECT operator_id, continuity_score FROM continuity_states WHERE operator_id = ?`,
      args: [OPERATOR],
    });
    expect(continuity.rows).toHaveLength(1);
    expect(Number((continuity.rows[0] as Record<string, unknown>).continuity_score)).toBe(
      data.continuity_after,
    );

    const dsi = await db.execute({
      sql: `SELECT operator_id, session_id FROM derived_session_index`,
      args: [],
    });
    expect(dsi.rows).toHaveLength(1);
    expect((dsi.rows[0] as Record<string, unknown>).session_id).toBe(data.sessionId);

    const events = await db.execute({
      sql: `SELECT event_type, operator_id, session_id FROM events ORDER BY event_type`,
      args: [],
    });
    expect(events.rows.map((r) => (r as Record<string, unknown>).event_type)).toEqual([
      "continuity.calculated",
      "session.created",
    ]);
    for (const e of events.rows) {
      expect((e as Record<string, unknown>).operator_id).toBe(OPERATOR);
      expect((e as Record<string, unknown>).session_id).toBe(data.sessionId);
    }

    expect(vi.mocked(revalidatePath)).toHaveBeenCalled();
  });
});

describe("secret exposure", () => {
  it("no response body contains the service token", () => {
    expect(responseTexts.length).toBeGreaterThan(10);
    for (const text of responseTexts) {
      expect(text).not.toContain(TEST_TOKEN);
      expect(text).not.toContain(TOO_SHORT_TOKEN);
    }
  });
});
