// =============================================================
// [Member 2] Creator data utilities
// Owner: Member 2 (Scraping)
//
// TODO: Implement functions to query and filter creator data.
// - loadCreators(): Load from /data/creators.json
// - filterCreators(params): Filter by channel, follower range, niche
// - rankCreators(creators, brand): Score and sort by relevance
// =============================================================

import type { Creator, CampaignConfig } from "./types";

import creatorsData from "@/data/creators.json";

export function loadCreators(): Creator[] {
  return creatorsData as Creator[];
}

export function filterCreators(
  creators: Creator[],
  campaign: CampaignConfig
): Creator[] {
  return creators.filter((creator) => {
    const inChannel =
      campaign.channels.length === 0 ||
      campaign.channels.includes(creator.platform);
    const inRange =
      creator.followers >= campaign.followerRange[0] &&
      creator.followers <= campaign.followerRange[1];
    return inChannel && inRange;
  });
}
