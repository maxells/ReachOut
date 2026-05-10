/**
 * Two-stage LinkedIn discovery pipeline (Member 2 / Scraping).
 *
 *  1. searchLinkedInUrlsViaGoogle(industry, keywords)
 *       → apify/google-search-scraper
 *       → returns LinkedIn profile URLs from Google SERP for
 *         `site:linkedin.com/in <industry> <keywords>`.
 *
 *  2. scrapeLinkedInProfiles(urls)
 *       → alwaysprimedev/linkedin-profile-scraper
 *       → returns full profile data for each URL (no cookies needed).
 *
 *  searchLinkedInPeople() composes both stages so callers just hand in
 *  the brand industry and get LinkedInProfile[] back, same shape as before.
 *
 * Why this pattern (vs direct LinkedIn search actors):
 * Pure-search LinkedIn Apify actors are aggressively blocked and return
 * 0 results almost universally. Going via Google SERP first then a
 * profile-only scraper is the production pattern used by Clay/Apollo and
 * is the only reliable, no-cookie path. See the README for cost notes.
 */
import type { LinkedInProfile } from "./clod";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;

const GOOGLE_ACTOR_ID = "apify~google-search-scraper";
const PROFILE_ACTOR_ID = "alwaysprimedev~linkedin-profile-scraper";

// Google SERP item shape (only fields we touch).
interface GoogleOrganicResult {
  url?: string;
  title?: string;
  description?: string;
}
interface GoogleSerpPage {
  organicResults?: GoogleOrganicResult[];
}

// alwaysprimedev profile output (only fields we map).
interface ProfileScraperItem {
  succeeded?: boolean;
  linkedinUrl?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  location?: string;
  followers?: number;
  connections?: number;
  jobTitle?: string;
  companyName?: string;
  companyIndustry?: string;
}

// ─── Stage 1: Google SERP → LinkedIn URLs ─────────────────────────────

export async function searchLinkedInUrlsViaGoogle(
  industry: string,
  keywords: string[] = [],
  resultsPerPage = 10
): Promise<string[]> {
  // Build a focused query. Quoted industry pulls relevance up; one or two
  // keyword hints widen the topical net without exploding the SERP.
  const kwClause = keywords.length
    ? ` (${keywords.slice(0, 3).map((k) => `"${k}"`).join(" OR ")})`
    : "";
  const query = `site:linkedin.com/in "${industry}"${kwClause}`;

  console.log(`[apify/google] Query: ${query}`);

  const items = await runActorSync<GoogleSerpPage>(GOOGLE_ACTOR_ID, {
    queries: query,
    resultsPerPage,
    maxPagesPerQuery: 1,
    countryCode: "us",
  });

  const urls: string[] = [];
  for (const page of items) {
    for (const r of page.organicResults ?? []) {
      if (r.url && /linkedin\.com\/in\//i.test(r.url)) {
        urls.push(canonicalizeLinkedInUrl(r.url));
      }
    }
  }
  // Dedupe.
  const unique = Array.from(new Set(urls));
  console.log(`[apify/google] Found ${unique.length} LinkedIn URL(s)`);
  return unique;
}

function canonicalizeLinkedInUrl(raw: string): string {
  // Strip locale subdomain (fr.linkedin.com → www.linkedin.com) and trailing
  // /en, /fr, etc., so dedup works and the profile scraper accepts it.
  try {
    const u = new URL(raw);
    u.hostname = "www.linkedin.com";
    u.pathname = u.pathname.replace(/\/(en|fr|de|es|pt|it|nl|pl|ja|zh|ko|ru)\/?$/i, "");
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}

// ─── Stage 2: profile URLs → full LinkedInProfile[] ───────────────────

export async function scrapeLinkedInProfiles(
  urls: string[]
): Promise<LinkedInProfile[]> {
  if (urls.length === 0) return [];

  console.log(`[apify/profile] Scraping ${urls.length} profile(s)…`);

  const items = await runActorSync<ProfileScraperItem>(PROFILE_ACTOR_ID, {
    profileUrls: urls,
  });

  console.log(`[apify/profile] Got ${items.length} item(s) back`);

  return items
    .filter((p) => p.succeeded !== false)
    .map(normalizeProfile)
    .filter((p): p is LinkedInProfile => p !== null);
}

function normalizeProfile(raw: ProfileScraperItem): LinkedInProfile | null {
  const name = raw.fullName || [raw.firstName, raw.lastName].filter(Boolean).join(" ");
  const profileUrl = raw.linkedinUrl;
  // Use headline if present; fall back to a synthesized one from job/company
  // so downstream scoring still has something to chew on.
  const headline =
    raw.headline ||
    [raw.jobTitle, raw.companyName].filter(Boolean).join(" at ") ||
    raw.summary?.slice(0, 140) ||
    "";

  if (!name || !profileUrl) return null;

  return {
    name,
    headline,
    profileUrl,
    location: raw.location || undefined,
    // Followers is the influence signal; connections caps at 500 on LinkedIn.
    connections: raw.followers ?? raw.connections ?? undefined,
    summary: raw.summary || undefined,
    experience: raw.companyName
      ? [`${raw.jobTitle ?? ""} at ${raw.companyName}`.trim()]
      : undefined,
    skills: undefined,
  };
}

// ─── Composed entry point used by the route ───────────────────────────

// Hard cap on profiles enriched per request. Profile-scraper costs $3.50/1k,
// so 5 profiles ≈ $0.018. Google SERP is cheap, so we ask for a few extra
// URLs and only enrich the top MAX_PROFILES_PER_REQUEST.
const MAX_PROFILES_PER_REQUEST = 5;

export async function searchLinkedInPeople(
  industry: string,
  keywords: string[] = [],
  maxResults = MAX_PROFILES_PER_REQUEST
): Promise<LinkedInProfile[]> {
  const cap = Math.min(maxResults, MAX_PROFILES_PER_REQUEST);
  // Pull a few extra URLs in case some are non-profile pages or duplicates.
  const urls = await searchLinkedInUrlsViaGoogle(industry, keywords, cap + 3);
  if (urls.length === 0) return [];
  const slice = urls.slice(0, cap);
  console.log(
    `[apify] Enriching ${slice.length} of ${urls.length} URL(s) (cap=${MAX_PROFILES_PER_REQUEST})`
  );
  return scrapeLinkedInProfiles(slice);
}

// ─── Tiny synchronous Apify runner ────────────────────────────────────
//
// Apify exposes /run-sync-get-dataset-items for any actor — it blocks
// until the run finishes (or until ~5 min) and streams back the dataset
// JSON in one response. Saves us a polling loop.

async function runActorSync<T>(actorId: string, input: unknown): Promise<T[]> {
  const res = await fetch(
    `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Apify actor ${actorId} failed: ${res.status} ${errorText.slice(0, 300)}`
    );
  }

  return (await res.json()) as T[];
}
