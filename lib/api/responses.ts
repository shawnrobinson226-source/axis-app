import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "./types";

export function apiOk<T>(data: T) {
  const body: ApiSuccess<T> = {
    ok: true,
    version: "v1",
    data,
  };

  return NextResponse.json(body);
}

export function apiError(message: string, status = 500) {
  const body: ApiError = {
    ok: false,
    version: "v1",
    error: message,
  };

  return NextResponse.json(body, { status });
}
