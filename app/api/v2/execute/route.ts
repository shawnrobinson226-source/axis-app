import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
import { requireServiceAuth } from "@/lib/api/serviceAuth";
import { validateRequest } from "@/lib/api/validateRequest";
import { SESSION_OUTCOME, type SessionOutcome } from "@/lib/kernel/domain";
import { processSession } from "@/lib/session/process";

const GUARD_BLOCKED_MESSAGE = "Guard blocked session";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`v2-execute:${ip}`, 5, 60000);
  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  // Service auth runs before any body parsing, DB access, or continuity call.
  const auth = requireServiceAuth(req);
  if (!auth.ok) {
    return auth.response;
  }

  const operatorId = req.headers.get("x-operator-id")?.trim() ?? "";
  if (!operatorId) {
    return apiError("Missing operator identity", 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const validation = validateRequest(req, body);
  if (!validation.ok) {
    return apiError(validation.error, 400);
  }

  if (!validation.body.classification) {
    return apiError("Classification is required", 400);
  }
  if (!validation.body.next_action) {
    return apiError("Next action is required", 400);
  }
  if (
    validation.body.outcome !== undefined &&
    !SESSION_OUTCOME.includes(validation.body.outcome as SessionOutcome)
  ) {
    return apiError("Invalid outcome", 400);
  }

  try {
    const result = await processSession({
      operator_id: validation.operatorId,
      trigger: validation.body.trigger,
      distortion_class: validation.body.classification,
      next_action: validation.body.next_action,
      outcome: validation.body.outcome,
      stability: validation.body.stability,
      reference: validation.body.reference,
      impact: validation.body.impact,
    });

    return apiOk(result);
  } catch (err) {
    if (err instanceof Error && err.message === GUARD_BLOCKED_MESSAGE) {
      return apiError("guard_blocked", 400);
    }

    console.error("[v2/execute] processSession failed", {
      name: err instanceof Error ? err.name : typeof err,
    });
    return apiError("internal_error", 500);
  }
}

export async function GET() {
  return apiError("Method not allowed", 405);
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
