import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
import { get30DaySummary } from "@/lib/summary/monthly";
import { withTimeout } from "@/lib/utils/withTimeout";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const rl = rateLimit(`summary-30-day:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return apiError("Rate limit exceeded", 429);
  }

  const operatorId = req.headers.get("x-operator-id")?.trim() ?? "";
  if (!operatorId) {
    return apiError("Missing operator identity", 400);
  }

  try {
    const summary = await withTimeout(get30DaySummary(operatorId), 3000);
    return apiOk(summary);
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error", 400);
  }
}

export async function POST() {
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
