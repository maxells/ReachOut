// =============================================================
// [Member 3] Outreach utilities
// Owner: Member 3 (Outreach)
//
// TODO: Implement outreach helper functions.
// - generatePitchPrompt(creator, brand): Build AI prompt
// - formatPitch(raw): Clean up AI-generated pitch
// - simulateSend(pitch): Mock sending and return status
// =============================================================

import type { Creator, BrandInfo, Pitch } from "./types";

export function generatePitchPrompt(creator: Creator, brand: BrandInfo): string {
  return `Write a personalized outreach pitch from ${brand.name} to ${creator.name} (${creator.handle} on ${creator.platform}). 
The brand is in the ${brand.industry} industry. 
The creator's bio: ${creator.bio}
Recent topics: ${creator.recentTopics.join(", ")}
Keep it professional but conversational. Max 200 words.`;
}

export function createEmptyPitch(creatorId: string, creatorName: string): Pitch {
  return {
    id: `pitch-${creatorId}-${Date.now()}`,
    creatorId,
    creatorName,
    subject: "",
    body: "",
    generatedAt: new Date().toISOString(),
  };
}
