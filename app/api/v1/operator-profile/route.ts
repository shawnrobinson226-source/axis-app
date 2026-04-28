import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
import {
  getOperatorProfile,
  upsertOperatorProfile,
} from "@/lib/operator/profile";
import { withTimeout } from "@/lib/utils/withTimeout";

function getOperatorId(req: Request) {
  return req.headers.get("x-operator-id")?.trim() ?? "";
}

function publicProfile(profile: {
  operator_id: string;
  display_name: string | null;
}) {
  return {
    operator_id: profile.operator_id,
    display_name: profile.display_name,
  };
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`v1-operator-profile:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  const operatorId = getOperatorId(req);
  if (!operatorId) {
    return apiError("Missing operator identity", 400);
  }

  try {
    const profile = await withTimeout(getOperatorProfile(operatorId), 3000);
    return apiOk(publicProfile(profile));
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error", 400);
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`v1-operator-profile-update:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  const operatorId = getOperatorId(req);
  if (!operatorId) {
    return apiError("Missing operator identity", 400);
  }

  try {
    const body = (await req.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return apiError("Invalid request body shape", 400);
    }

    const payload = body as Record<string, unknown>;
    const keys = Object.keys(payload);
    if (keys.some((key) => key !== "display_name")) {
      return apiError("Unexpected fields", 400);
    }

    if (!("display_name" in payload)) {
      return apiError("display_name is required", 400);
    }

    const displayName = payload.display_name;
    if (displayName !== null && typeof displayName !== "string") {
      return apiError("display_name must be a string or null", 400);
    }

    const profile = await withTimeout(
      upsertOperatorProfile(operatorId, displayName),
      3000,
    );
    return apiOk(publicProfile(profile));
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error", 400);
  }
}

export async function PUT() {
  return apiError("Method not allowed", 405);
}

export async function PATCH() {
  return apiError("Method not allowed", 405);
}

export async function DELETE() {
  return apiError("Method not allowed", 405);
}
