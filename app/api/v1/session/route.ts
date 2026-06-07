import { getRecentSessions } from "@/app/session/actions";
import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
import { validateRequest } from "@/lib/api/validateRequest";
import { processSession } from "@/lib/session/process";
import { withTimeout } from "@/lib/utils/withTimeout";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`session:${ip}`, 5, 60000);

  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const operatorId = req.headers.get("x-operator-id")?.trim() ?? "";
    if (!operatorId) {
      return apiError("Missing operator identity", 401);
    }

    const sessions = await withTimeout(
      getRecentSessions(operatorId, 50),
      3000
    );

    return apiOk({ sessions });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const fracture_id =
      raw && typeof raw === "object" && "fracture_id" in raw
        ? typeof raw.fracture_id === "string"
          ? raw.fracture_id
          : ""
        : "";
    const body =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? Object.fromEntries(
            Object.entries(raw).filter(([key]) => key !== "fracture_id"),
          )
        : raw;
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

    const result = await processSession({
      operator_id: validation.operatorId,
      trigger: validation.body.trigger,
      distortion_class: validation.body.classification,
      fracture_id,
      next_action: validation.body.next_action,
      outcome: validation.body.outcome,
      stability: validation.body.stability,
      reference: validation.body.reference,
      impact: validation.body.impact,
    });

    return apiOk(result);
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
