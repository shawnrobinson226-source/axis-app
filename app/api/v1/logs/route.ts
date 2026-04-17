import { getRecentSessions } from "@/app/session/actions";
import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
import { withTimeout } from "@/lib/utils/withTimeout";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`logs:${ip}`, 5, 60000);

  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const operatorId = req.headers.get("x-operator-id")?.trim() ?? "";
    if (!operatorId) {
      return apiError("Missing operator identity", 401);
    }

    const url = new URL(req.url);
    const rawLimit = url.searchParams.get("limit");
    const parsedLimit =
      rawLimit && rawLimit.trim() ? Number.parseInt(rawLimit, 10) : 50;

    if (!Number.isFinite(parsedLimit)) {
      return apiError("Invalid limit", 400);
    }

    const limit = Math.max(1, Math.min(200, parsedLimit));

    const logs = await withTimeout(getRecentSessions(operatorId, limit), 2000);
    return apiOk({ logs });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error");
  }
}

export async function POST() { return apiError("Method not allowed", 405); }
export async function PUT() { return apiError("Method not allowed", 405); }
export async function PATCH() { return apiError("Method not allowed", 405); }
export async function DELETE() { return apiError("Method not allowed", 405); }
