// =============================================================
// [Member 3] POST /api/send-outreach
// Owner: Member 3 (Outreach)
//
// TODO: Implement outreach sending (simulated).
// Request body: { pitches: Pitch[] }
// Response: { sent: number, results: OutreachItem[] }
//
// For the hackathon, this simulates sending.
// In production, this would integrate with email APIs.
// =============================================================

import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement simulated outreach sending
  return NextResponse.json(
    { message: "send-outreach API — not yet implemented" },
    { status: 501 }
  );
}
