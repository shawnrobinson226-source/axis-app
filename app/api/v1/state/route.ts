import { getDashboardState, getVolatilityBand } from "@/app/session/actions";
import { apiError, apiOk } from "@/lib/api/responses";

export async function GET() {
  try {
    const [state, volatilityBand] = await Promise.all([
      getDashboardState("op_legacy"),
      getVolatilityBand("op_legacy"),
    ]);

    return apiOk({
      ...state,
      volatilityBand,
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error");
  }
}
