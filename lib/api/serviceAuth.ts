import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Machine authorization for AXIS service routes (Lock A1).
// Proves the caller holds AXIS_SERVICE_TOKEN. It does not prove operator ownership.

const MIN_TOKEN_LENGTH = 32;
const BEARER_PATTERN = /^bearer ([^\s]+)$/i;

export type ServiceAuthResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

function unavailable(): ServiceAuthResult {
  return {
    ok: false,
    response: NextResponse.json({ error: "service_unavailable" }, { status: 503 }),
  };
}

function unauthorized(): ServiceAuthResult {
  return {
    ok: false,
    response: NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
    ),
  };
}

export function requireServiceAuth(req: Request): ServiceAuthResult {
  const expected = process.env.AXIS_SERVICE_TOKEN?.trim() ?? "";
  if (expected.length < MIN_TOKEN_LENGTH) {
    return unavailable();
  }

  const header = req.headers.get("authorization");
  const match = header ? BEARER_PATTERN.exec(header) : null;
  if (!match) {
    return unauthorized();
  }

  if (!timingSafeEqual(digest(match[1]), digest(expected))) {
    return unauthorized();
  }

  return { ok: true };
}
