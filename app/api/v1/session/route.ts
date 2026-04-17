import { getRecentSessions } from "@/app/session/actions";
import { apiError, apiOk } from "@/lib/api/responses";
import { rateLimit } from "@/lib/api/rateLimit";
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
  const operatorId = req.headers.get("x-operator-id")?.trim() ?? "";
  if (!operatorId) {
    return apiError("Missing operator identity", 401);
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;

    const toText = (value: unknown) => (typeof value === "string" ? value : "");
    const toFiniteNumber = (value: unknown, fallback: number) => {
      const numeric =
        typeof value === "number"
          ? value
          : typeof value === "string" && value.trim()
            ? Number(value)
            : fallback;
      return Number.isFinite(numeric) ? numeric : Number.NaN;
    };

    const trigger = toText(body.trigger).trim();
    const distortion_class = toText(body.distortion_class).trim();
    const next_action = toText(body.next_action).trim();

    if (!trigger) return apiError("Trigger is required.", 400);
    if (!distortion_class) return apiError("Distortion class is required.", 400);
    if (!next_action) return apiError("Next action is required.", 400);

    const clarityRating = toFiniteNumber(body.clarity_rating, 5);
    const stability = toFiniteNumber(body.stability, 5);
    const impact = toFiniteNumber(body.impact, 3);

    if (!Number.isFinite(clarityRating)) {
      return apiError("Invalid clarity_rating", 400);
    }
    if (!Number.isFinite(stability)) {
      return apiError("Invalid stability", 400);
    }
    if (!Number.isFinite(impact)) {
      return apiError("Invalid impact", 400);
    }

    const result = await processSession({
      operator_id: operatorId,
      trigger,
      distortion_class,
      origin: toText(body.origin) || "local",
      thought: toText(body.thought) || trigger,
      emotion: toText(body.emotion) || "unspecified",
      behavior: toText(body.behavior) || "unspecified",
      protocol: toText(body.protocol) || "aligned_action",
      next_action,
      clarity_rating: clarityRating,
      outcome: toText(body.outcome) || "reduced",
      stability,
      reference:
        typeof body.reference === "boolean"
          ? body.reference
          : toText(body.reference) === "yes",
      impact,
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
