import { getRecentSessions } from "@/app/session/actions";
import { apiError, apiOk } from "@/lib/api/responses";

export async function GET() {
  try {
    const logs = await getRecentSessions(200);
    return apiOk({ logs });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error");
  }
}
