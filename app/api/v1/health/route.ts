import { apiError, apiOk } from "@/lib/api/responses";

export async function GET() {
  try {
    return apiOk({
      status: "healthy",
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : "Unknown error");
  }
}
