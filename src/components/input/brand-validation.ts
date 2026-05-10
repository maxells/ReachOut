import type { CampaignConfig } from "@/lib/types";
import type { BrandSlice } from "@/lib/store";

export function normalizeWebsiteUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

export function isBrandStepComplete(brand: BrandSlice): boolean {
  if (!brand.name.trim()) return false;
  if (!brand.industry.trim()) return false;
  const raw = brand.url.trim();
  if (!raw) return false;
  try {
    const u = new URL(normalizeWebsiteUrl(raw));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isCampaignStepComplete(campaign: CampaignConfig): boolean {
  return campaign.channels.length > 0;
}

/** Stable fingerprint of brand inputs that should invalidate a cached analysis report. */
export function brandAnalysisInputKey(brand: BrandSlice): string {
  return JSON.stringify({
    name: brand.name.trim(),
    url: normalizeWebsiteUrl(brand.url.trim()),
    industry: brand.industry,
    targetAudience: brand.targetAudience,
    keywords: [...(brand.keywords ?? [])].sort(),
    hashtags: [...(brand.hashtags ?? [])].sort(),
    aliases: [...(brand.brandAliases ?? [])].sort(),
    socials: brand.socials ?? {},
  });
}
