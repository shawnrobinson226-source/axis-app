import { NextResponse } from "next/server";

// Disabled by containment Lock C1: discern had no identity check and spent the
// server's Anthropic key. Implemented method returns 404 and makes no outbound call.
export async function POST() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
