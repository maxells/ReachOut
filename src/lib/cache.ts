import type { BrandInfo, MatchResult, CachedSearchResult } from "./types";

const CACHE_KEY = "reachout-influencer-cache";

export function findCachedResults(brand: BrandInfo): MatchResult[] | null {
  const entries = loadCache();
  if (entries.length === 0) return null;

  for (const entry of entries) {
    if (isCacheHit(brand, entry.params)) {
      return entry.results;
    }
  }

  return null;
}

export function saveToCache(brand: BrandInfo, results: MatchResult[]): void {
  const entries = loadCache();

  const alreadyExists = entries.some(
    (e) =>
      e.params.industry.toLowerCase() === brand.industry.toLowerCase() &&
      keywordOverlap(brand.creator_search_keywords, e.params.creator_search_keywords) === 1 &&
      e.params.followers_min === brand.followers_min &&
      e.params.followers_max === brand.followers_max
  );

  if (alreadyExists) return;

  entries.push({
    params: brand,
    results,
    timestamp: Date.now(),
  });

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — evict oldest entries and retry
    const trimmed = entries.slice(-10);
    localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  }
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

function isCacheHit(newBrand: BrandInfo, cached: BrandInfo): boolean {
  const industryMatch =
    newBrand.industry.toLowerCase() === cached.industry.toLowerCase();
  if (!industryMatch) return false;

  const overlap = keywordOverlap(
    newBrand.creator_search_keywords,
    cached.creator_search_keywords
  );
  if (overlap < 0.6) return false;

  const rangeCompatible = isFollowerRangeCompatible(
    newBrand.followers_min,
    newBrand.followers_max,
    cached.followers_min,
    cached.followers_max
  );
  if (!rangeCompatible) return false;

  return true;
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
