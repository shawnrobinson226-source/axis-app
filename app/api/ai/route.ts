import { apiError } from "@/lib/api/responses";

export async function GET() {
  return apiError("Disabled endpoint", 404);
}

export async function POST() {
  return apiError("Disabled endpoint", 404);
}

export async function PUT() {
  return apiError("Disabled endpoint", 404);
}

export async function PATCH() {
  return apiError("Disabled endpoint", 404);
}

export async function DELETE() {
  return apiError("Disabled endpoint", 404);
}
