import { getRecentSessions, saveSessionCore } from "@/app/session/actions";
import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
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
