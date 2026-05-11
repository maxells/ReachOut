/**
 * Bridges Member 1's static HTML funnel (localStorage) into the match-creators
 * API payload when the React funnel's Zustand slice is empty.
 *
 * Keys: reachout_brand_v1 / gofamous_campaign_v1 (written by brand.js / campaign.js)
 */
import type { CampaignConfig } from "@/lib/types";
import type { BrandSlice } from "@/lib/store";

const BRAND_LS = "reachout_brand_v1";
const CAMPAIGN_LS = "gofamous_campaign_v1";

interface HtmlBrandRaw {
  name?: string;
  url?: string;
  agentDesc?: string;
  li?: string;
  tw?: string;
  yt?: string;
  aud?: string;
  categories?: string[];
}

interface HtmlCampaignRaw {
  channels?: string[];
  industries?: string[];
  keywords?: string[];
  followerMin?: number;
  followerMax?: number;
}

const CHANNEL_DISPLAY_TO_API: Record<string, CampaignConfig["channels"][number]> = {
  YouTube: "youtube",
  youtube: "youtube",
  X: "twitter",
  x: "twitter",
  TikTok: "tiktok",
  tiktok: "tiktok",
  Newsletter: "newsletter",
  newsletter: "newsletter",
  LinkedIn: "linkedin",
  linkedin: "linkedin",
  Podcast: "podcast",
  podcast: "podcast",
};

export function mergeMatchPayloadFromHtmlStorage(
  storeBrand: BrandSlice,
  storeCampaign: CampaignConfig
): { brand: BrandSlice; campaign: CampaignConfig } {
  let brandRaw: HtmlBrandRaw = {};
  let campaignRaw: HtmlCampaignRaw = {};

  if (typeof window !== "undefined") {
    try {
      const br = window.localStorage.getItem(BRAND_LS);
      if (br) brandRaw = JSON.parse(br);
    } catch {
      brandRaw = {};
    }
    try {
      const cr = window.localStorage.getItem(CAMPAIGN_LS);
      if (cr) campaignRaw = JSON.parse(cr);
    } catch {
      campaignRaw = {};
    }
  }

  const htmlIndustry =
    (campaignRaw.industries?.[0] &&
      String(campaignRaw.industries[0]).trim()) ||
    (brandRaw.categories?.[0] && String(brandRaw.categories[0]).trim()) ||
    "";

  const htmlName = brandRaw.name ? String(brandRaw.name).trim() : "";
  const htmlUrl = brandRaw.url ? String(brandRaw.url).trim() : "";

  const htmlKeywords = Array.isArray(campaignRaw.keywords)
    ? campaignRaw.keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0)
    : [];

  const mergedKeywords =
    Array.isArray(storeBrand.keywords) && storeBrand.keywords.length > 0
      ? [...storeBrand.keywords]
      : htmlKeywords.length > 0
        ? htmlKeywords
        : [...storeBrand.keywords];

  const htmlChannelsMapped = Array.isArray(campaignRaw.channels)
    ? [
        ...new Set(
          campaignRaw.channels
            .map((ch) => {
              const t = String(ch).trim();
              return (
                CHANNEL_DISPLAY_TO_API[t] ??
                CHANNEL_DISPLAY_TO_API[
                  `${t.slice(0, 1).toUpperCase()}${t.slice(1)}`
                ]
              );
            })
            .filter(Boolean) as CampaignConfig["channels"][number][]
        ),
      ]
    : [];

  const mergedChannels =
    Array.isArray(storeCampaign.channels) && storeCampaign.channels.length > 0
      ? [...storeCampaign.channels]
      : htmlChannelsMapped;

  let folMin =
    typeof campaignRaw.followerMin === "number" &&
    Number.isFinite(campaignRaw.followerMin)
      ? campaignRaw.followerMin
      : storeCampaign.followerRange[0];
  let folMax =
    typeof campaignRaw.followerMax === "number" &&
    Number.isFinite(campaignRaw.followerMax)
      ? campaignRaw.followerMax
      : storeCampaign.followerRange[1];
  if (folMin > folMax) [folMin, folMax] = [folMax, folMin];

  const brand: BrandSlice = {
    ...storeBrand,
    name: storeBrand.name?.trim() || htmlName || storeBrand.name,
    url: storeBrand.url?.trim() || htmlUrl || storeBrand.url,
    industry: storeBrand.industry?.trim() || htmlIndustry || storeBrand.industry,
    socials: { ...storeBrand.socials },
    keywords: mergedKeywords.length > 0 ? mergedKeywords : storeBrand.keywords,
  };

  if (brandRaw.li && !brand.socials.linkedin)
    brand.socials = { ...brand.socials, linkedin: brandRaw.li.trim() };
  if (brandRaw.tw && !brand.socials.twitter)
    brand.socials = { ...brand.socials, twitter: brandRaw.tw.trim() };
  if (brandRaw.yt && !brand.socials.youtube)
    brand.socials = { ...brand.socials, youtube: brandRaw.yt.trim() };

  const campaign: CampaignConfig = {
    ...storeCampaign,
    channels: mergedChannels.length > 0 ? mergedChannels : storeCampaign.channels,
    followerRange: [folMin, folMax],
  };

  return { brand, campaign };
}
