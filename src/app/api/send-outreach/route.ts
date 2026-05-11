import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  isLikelyLinkedInProfileUrl,
  mockSendOutreach,
  type SendOutreachRequest,
} from "@/lib/outreach";
import { sendViaHeyReach } from "@/lib/heyreach-send";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SendOutreachRequest>;
    const validationError = validateSendOutreachRequest(body);

    if (validationError) {
      return NextResponse.json(
        { ok: false, status: "failed", message: validationError },
        { status: 400 }
      );
    }

    const payload = body as SendOutreachRequest;
    const result =
      shouldSendLinkedInViaHeyReach(payload)
        ? await sendViaHeyReach(payload)
        : await mockSendOutreach(payload);

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("Failed to send outreach", error);
    return NextResponse.json(
      {
        ok: false,
        status: "failed",
        message: "Failed to send outreach.",
      },
      { status: 500 }
    );
  }
}

function validateSendOutreachRequest(
  body: Partial<SendOutreachRequest>
): string | null {
  if (!body.channel) return "Missing outreach channel.";
  if (!["linkedin", "email", "reddit", "youtube"].includes(body.channel)) {
    return "Unsupported outreach channel.";
  }
  if (!body.creatorId || !body.creatorName) {
    return "Missing influencer context.";
  }
  if (body.channel === "email" && !body.subject?.trim()) {
    return "Email subject is required.";
  }
  if (body.channel === "linkedin") {
    const url = body.recipient?.trim();
    if (!url) return "LinkedIn profile URL is required for LinkedIn sends.";
    if (!isLikelyLinkedInProfileUrl(url)) {
      return "LinkedIn recipient must be a profile URL (e.g. https://www.linkedin.com/in/username).";
    }
  }
  if (!body.body?.trim()) return "Message body is required.";
  return null;
}

function hasUsableHeyReachKey(): boolean {
  const k = process.env.HEYREACH_API_KEY;
  return Boolean(k?.trim() && !k.includes("your-key-here"));
}

/** OUTREACH_SEND_MODE=mock disables HeyReach even when a key is present (tests/local). */
function shouldSendLinkedInViaHeyReach(payload: SendOutreachRequest): boolean {
  if (payload.channel !== "linkedin") return false;
  const mode = (process.env.OUTREACH_SEND_MODE ?? "auto").toLowerCase();
  if (mode === "mock") return false;
  return hasUsableHeyReachKey();
}
