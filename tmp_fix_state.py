from pathlib import Path; Path("app/api/v1/state/route.ts").write_text("""import { getDashboardState, getVolatilityBand } from \"@/app/session/actions\";
import { apiError, apiOk } from \"@/lib/api/responses\";
import { rateLimit } from \"@/lib/api/rateLimit\";
import { withTimeout } from \"@/lib/utils/withTimeout\";

export async function GET(req: Request) {
  const ip = req.headers.get(\"x-forwarded-for\") ?? \"local\";
  const rl = rateLimit(`state:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return apiError(\"Rate limit exceeded\", 429);
  }
  try {
    const [state, volatility] = await Promise.all([
      withTimeout(getDashboardState(\"op_legacy\"), 3000),
      withTimeout(getVolatilityBand(\"op_legacy\"), 3000),
    ]);
    return apiOk({ ...state, volatilityBand: volatility });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : \"Unknown error\");
  }
}

export async function POST() { return apiError(\"Method not allowed\", 405); }
export async function PUT() { return apiError(\"Method not allowed\", 405); }
export async function PATCH() { return apiError(\"Method not allowed\", 405); }
export async function DELETE() { return apiError(\"Method not allowed\", 405); }
""", encoding="utf-8"); print("state route fixed")
