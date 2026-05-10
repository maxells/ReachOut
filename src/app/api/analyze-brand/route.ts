import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { AnalysisReport, BrandInfo } from "@/lib/types";
import {
  buildAnalysisPrompt,
  mockAnalysisReport,
  parseAnalysisReportJson,
} from "./lib";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const brand = (body as { brand?: BrandInfo }).brand;
  if (!brand || typeof brand !== "object") {
    return NextResponse.json({ error: "Missing brand" }, { status: 400 });
  }

  if (!brand.name?.trim() || !brand.url?.trim() || !brand.industry?.trim()) {
    return NextResponse.json(
      { error: "Brand must include name, url, and industry" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  let report: AnalysisReport | null = null;

  if (apiKey) {
    try {
      const openai = createOpenAI({ apiKey });
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: buildAnalysisPrompt(brand),
      });
      report = parseAnalysisReportJson(text);
    } catch {
      report = null;
    }
  }

  if (!report) {
    report = mockAnalysisReport(brand);
  }

  return NextResponse.json({ analysis: report });
}
