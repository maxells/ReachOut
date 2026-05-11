#!/usr/bin/env node
/**
 * Smoke test: POST /api/generate-pitch then POST /api/send-outreach (LinkedIn → HeyReach path).
 *
 * Prerequisite: `npm run dev` in another terminal.
 *
 * Fixture: .context/e2e/outreach-e2e.fixture.local.json (copy from outreach-e2e.fixture.example.json)
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fixturePath =
  process.env.OUTREACH_E2E_FIXTURE?.trim() ||
  join(root, ".context/e2e/outreach-e2e.fixture.local.json");

if (!existsSync(fixturePath)) {
  console.error(
    `Missing fixture: ${fixturePath}\nCopy .context/e2e/outreach-e2e.fixture.example.json to outreach-e2e.fixture.local.json and edit.`
  );
  process.exit(1);
}

const raw = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(raw);

const baseUrl = (fixture.baseUrl || "http://localhost:3000").replace(/\/$/, "");
const recipientUrl = fixture.linkedinRecipientProfileUrl?.trim();
if (!recipientUrl) {
  console.error("Fixture must set linkedinRecipientProfileUrl.");
  process.exit(1);
}

function compactCompetitorSummary(analysis) {
  if (!analysis?.competitors?.length) return undefined;
  return analysis.competitors
    .slice(0, 5)
    .map(
      (c) =>
        `${c.name} (~${Math.round(c.creatorTrafficShare)}% est. creator traffic share)`
    )
    .join("; ");
}

const { brand, campaign, match: singleMatch, matches: fixtureMatches } =
  fixture;
const match =
  singleMatch ??
  (Array.isArray(fixtureMatches) && fixtureMatches.length > 0
    ? fixtureMatches[0]
    : null);
if (!match) {
  console.error("Fixture must include match or non-empty matches[].");
  process.exit(1);
}
const pc = fixture.pitchContext || {};
const channel = pc.channel || "linkedin";

const outreachGoal = pc.collaborationType
  ? `Explore a ${pc.collaborationType}`
  : "Explore a collaboration conversation";
const callToAction = pc.collaborationType
  ? `Ask if they are open to a quick conversation about a ${pc.collaborationType}. Sign off as ${pc.senderName || "the partnerships team"}.`
  : "Ask if they are open to a quick collaboration chat.";

const ar = fixture.analysis;
const marketAnalysisSummary =
  (typeof fixture.marketAnalysisSummary === "string" &&
    fixture.marketAnalysisSummary.trim()) ||
  (ar?.summary && String(ar.summary).trim()) ||
  undefined;
const analysisCoverageScore =
  fixture.analysisCoverageScore ?? ar?.coverageScore;
const analysisIndustryAverage =
  fixture.analysisIndustryAverage ?? ar?.industryAverage;
const analysisCompetitorSummary =
  (typeof fixture.analysisCompetitorSummary === "string" &&
    fixture.analysisCompetitorSummary.trim()) ||
  compactCompetitorSummary(ar);

const generateBody = {
  brand,
  campaign,
  match,
  channel,
  productDescription:
    pc.productDescription || brand?.targetAudience || brand?.industry || "",
  outreachGoal,
  callToAction,
  ...(fixture.hashtags?.length ? { hashtags: fixture.hashtags } : {}),
  ...(fixture.keywords?.length ? { keywords: fixture.keywords } : {}),
  ...(fixture.brandAliases?.length ? { brandAliases: fixture.brandAliases } : {}),
  ...(marketAnalysisSummary
    ? { marketAnalysisSummary }
    : {}),
  ...(analysisCoverageScore != null
    ? { analysisCoverageScore }
    : {}),
  ...(analysisIndustryAverage != null
    ? { analysisIndustryAverage }
    : {}),
  ...(analysisCompetitorSummary
    ? { analysisCompetitorSummary }
    : {}),
};

console.log("→ POST /api/generate-pitch …");
const genRes = await fetch(`${baseUrl}/api/generate-pitch`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(generateBody),
});

const genText = await genRes.text();
let draft;
try {
  draft = JSON.parse(genText);
} catch {
  draft = null;
}

if (!genRes.ok) {
  console.error("generate-pitch failed:", genRes.status, genText);
  process.exit(1);
}

if (!draft?.body?.trim()) {
  console.error("No draft body in response:", draft);
  process.exit(1);
}

console.log("  subject:", draft.subject ?? "(none)");
console.log("  body preview:", draft.body.slice(0, 160).replace(/\s+/g, " "), "…");

console.log("→ POST /api/send-outreach (linkedin) …");
const sendBody = {
  channel: "linkedin",
  creatorId: match.creator.id,
  creatorName: match.creator.name,
  recipient: recipientUrl,
  body: draft.body,
};

const sendRes = await fetch(`${baseUrl}/api/send-outreach`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(sendBody),
});

const sendJson = await sendRes.json().catch(() => ({}));
console.log(sendRes.status, JSON.stringify(sendJson, null, 2));

if (!sendRes.ok || !sendJson.ok) {
  process.exit(1);
}

console.log("Done.");
