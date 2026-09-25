import { NextResponse } from "next/server";

// Disabled by containment Lock C1: reset accepted any supplied operator ID.
// Implemented method returns 404 and invokes no reset or database logic.
export async function POST() {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
