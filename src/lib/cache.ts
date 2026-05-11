import type { MatchResult } from "./types";
import type { MatchInput } from "./clod";

// Local type — not part of the shared contract in types.ts
interface CacheParams {
  industry: string;
  keywords: string[];
  followersMin: number;
  followersMax: number;
}

interface CachedSearchResult {
  params: CacheParams;
  results: MatchResult[];
  timestamp: number;
}

const CACHE_KEY = "reachout-influencer-cache";

export function findCachedResults(input: MatchInput): MatchResult[] | null {
  const entries = loadCache();
  if (entries.length === 0) return null;

  const params = toParams(input);
  for (const entry of entries) {
    if (isCacheHit(params, entry.params)) {
      return entry.results;
    }
  }

  return null;
}

export function saveToCache(input: MatchInput, results: MatchResult[]): void {
  const entries = loadCache();
  const params = toParams(input);

  const alreadyExists = entries.some(
    (e) =>
      e.params.industry.toLowerCase() === params.industry.toLowerCase() &&
      keywordOverlap(params.keywords, e.params.keywords) === 1 &&
      e.params.followersMin === params.followersMin &&
      e.params.followersMax === params.followersMax
  );

  if (alreadyExists) return;

  entries.push({ params, results, timestamp: Date.now() });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — evict oldest entries and retry
    const trimmed = entries.slice(-10);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  }
}

function toParams(input: MatchInput): CacheParams {
  return {
    industry: input.brand.industry,
    keywords: input.brand.keywords?.length
      ? input.brand.keywords
      : [input.brand.industry],
    followersMin: input.campaign.followerRange[0],
    followersMax: input.campaign.followerRange[1],
  };
}

function loadCache(): CachedSearchResult[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CachedSearchResult[];
  } catch {
    return [];
  }
}

function isCacheHit(incoming: CacheParams, cached: CacheParams): boolean {
  if (incoming.industry.toLowerCase() !== cached.industry.toLowerCase()) {
    return false;
  }
  if (keywordOverlap(incoming.keywords, cached.keywords) < 0.6) return false;
  return isFollowerRangeCompatible(
    incoming.followersMin,
    incoming.followersMax,
    cached.followersMin,
    cached.followersMax
  );
}

/**
 * Returns ratio (0-1) of how many keywords in `incoming` exist in `cached`.
 * Both arrays are normalized to lowercase for comparison.
 */
function keywordOverlap(incoming: string[], cached: string[]): number {
  if (incoming.length === 0) return 0;
  const cachedSet = new Set(cached.map((k) => k.toLowerCase().trim()));
  const matchCount = incoming.filter((k) =>
    cachedSet.has(k.toLowerCase().trim())
  ).length;
  return matchCount / incoming.length;
}

/**
 * The new range is compatible if it contains/covers the cached range,
 * meaning the cached influencer data falls within the new search scope.
 */
function isFollowerRangeCompatible(
  newMin: number,
  newMax: number,
  cachedMin: number,
  cachedMax: number
): boolean {
  return newMin <= cachedMin && newMax >= cachedMax;
}
