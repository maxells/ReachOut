import type { LinkedInProfile } from "./clod";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;

// Using the LinkedIn People Scraper actor
// https://apify.com/consummate_mandala/linkedin-people-scraper
const ACTOR_ID = "powerai~linkedin-peoples-search-scraper";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes max wait

interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
  };
}

interface ApifyRawProfile {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  profileUrl?: string;
  url?: string;
  location?: string;
  connectionCount?: number;
  connections?: number;
  summary?: string;
  about?: string;
  skills?: string[];
  experience?: Array<{ title?: string; company?: string }>;
  [key: string]: unknown;
}

export async function searchLinkedInPeople(
  titleSearches: string[],
  maxResults = 20
): Promise<LinkedInProfile[]> {
  const allProfiles: LinkedInProfile[] = [];

  for (const title of titleSearches) {
    if (allProfiles.length >= maxResults) break;

    const remaining = maxResults - allProfiles.length;
    const profiles = await runApifyActor(title, remaining);
    allProfiles.push(...profiles);
  }

  // Deduplicate by profileUrl
  const seen = new Set<string>();
  return allProfiles.filter((p) => {
    if (seen.has(p.profileUrl)) return false;
    seen.add(p.profileUrl);
    return true;
  });
}

async function runApifyActor(
  titleKeyword: string,
  maxResults: number
): Promise<LinkedInProfile[]> {
  const input = {
    name: titleKeyword,
    maxResults: Math.min(maxResults, 20),
  };
  console.log(`[apify] Starting actor with input:`, JSON.stringify(input));

  // Start the actor run
  const startResponse = await fetch(
    `${APIFY_BASE_URL}/acts/${encodeURIComponent(ACTOR_ID)}/runs?token=${APIFY_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(`Apify actor start failed: ${startResponse.status} ${errorText}`);
  }

  const runData: ApifyRunResponse = await startResponse.json();
  const runId = runData.data.id;
  console.log(`[apify] Actor run started: id=${runId}, status=${runData.data.status}`);

  // Poll for completion
  let status = runData.data.status;
  let attempts = 0;

  while (status !== "SUCCEEDED" && status !== "FAILED" && status !== "ABORTED") {
    if (attempts >= MAX_POLL_ATTEMPTS) {
      throw new Error(`Apify actor run timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS / 1000}s`);
    }

    await sleep(POLL_INTERVAL_MS);
    attempts++;

    const pollResponse = await fetch(
      `${APIFY_BASE_URL}/actor-runs/${runId}?token=${APIFY_TOKEN}`
    );
    const pollData: ApifyRunResponse = await pollResponse.json();
    status = pollData.data.status;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify actor run failed with status: ${status}`);
  }

  // Fetch results from dataset
  const datasetId = runData.data.defaultDatasetId;
  const datasetResponse = await fetch(
    `${APIFY_BASE_URL}/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json`
  );

  if (!datasetResponse.ok) {
    throw new Error(`Failed to fetch Apify dataset: ${datasetResponse.status}`);
  }

  const rawItems: ApifyRawProfile[] = await datasetResponse.json();
  console.log(`[apify] Title "${titleKeyword}" → ${rawItems.length} raw item(s), run status: ${status}`);
  if (rawItems.length > 0) {
    console.log("[apify] First raw item keys:", Object.keys(rawItems[0]).join(", "));
    console.log("[apify] First raw item:", JSON.stringify(rawItems[0]).slice(0, 500));
  }

  // Convert and validate
  const normalized = rawItems.map(normalizeProfile);
  const valid = normalized.filter((p): p is LinkedInProfile => p !== null);
  console.log(`[apify] After normalize: ${valid.length}/${rawItems.length} valid`);
  return valid;
}

function normalizeProfile(raw: ApifyRawProfile): LinkedInProfile | null {
  const name = raw.fullName || [raw.firstName, raw.lastName].filter(Boolean).join(" ");
  const headline = raw.headline;
  const profileUrl = raw.profileUrl || raw.url;

  // Strict validation: must have name, headline, and profileUrl
  if (!name || !headline || !profileUrl) {
    return null;
  }

  return {
    name,
    headline,
    profileUrl,
    location: raw.location || undefined,
    connections: raw.connectionCount || raw.connections || undefined,
    summary: raw.summary || raw.about || undefined,
    experience: raw.experience
      ?.map((e) => [e.title, e.company].filter(Boolean).join(" at "))
      .filter(Boolean),
    skills: raw.skills || undefined,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
