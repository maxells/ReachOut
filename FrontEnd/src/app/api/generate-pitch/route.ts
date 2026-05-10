// =============================================================
// [Member 3] POST /api/generate-pitch
// Owner: Member 3 (Outreach)
//
// TODO: Implement AI pitch generation with streaming.
// Request body: { creator: Creator, brand: BrandInfo }
// Response: Streaming text (use Vercel AI SDK)
//
// Suggested approach:
// 1. Use streamText() from Vercel AI SDK
// 2. Build prompt using generatePitchPrompt() from lib/outreach.ts
// 3. Stream the response back to the client
// =============================================================

import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement pitch generation with streaming
  return NextResponse.json(
    { message: "generate-pitch API — not yet implemented" },
    { status: 501 }
  );
}
