import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  buildPitchPrompt,
  createFallbackPitchDraft,
  parsePitchDraft,
  type PitchGenerationRequest,
} from "@/lib/outreach";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PitchGenerationRequest>;
    const validationError = validatePitchGenerationRequest(body);

    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const context = body as PitchGenerationRequest;

    if (!hasUsableOpenAIKey(process.env.OPENAI_API_KEY)) {
      return NextResponse.json(createFallbackPitchDraft(context));
    }

    const modelName = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    const prompt = buildPitchPrompt(context);
    const { text } = await generateText({
      model: openai(modelName),
      prompt,
      temperature: 0.7,
    });

    const draft = parsePitchDraft(text, context.channel);

    if (!draft.body) {
      return NextResponse.json(createFallbackPitchDraft(context));
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Failed to generate pitch", error);
    return NextResponse.json(
      { message: "Failed to generate pitch draft." },
      { status: 500 }
    );
  }
}

function validatePitchGenerationRequest(
  body: Partial<PitchGenerationRequest>
): string | null {
  if (!body.brand) return "Missing brand context.";
  if (!body.campaign) return "Missing campaign context.";
  if (!body.match?.creator) return "Missing influencer match context.";
  if (!body.channel) return "Missing outreach channel.";
  if (!["linkedin", "email", "reddit", "youtube"].includes(body.channel)) {
    return "Unsupported outreach channel.";
  }
  return null;
}

function hasUsableOpenAIKey(apiKey: string | undefined): boolean {
  return Boolean(apiKey && !apiKey.includes("your-key-here"));
}
