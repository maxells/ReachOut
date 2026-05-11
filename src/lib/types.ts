// ============================================================
// Shared type definitions — the contract between all 3 modules.
// Member 1 (Input), Member 2 (Scraping), Member 3 (Outreach)
// must all conform to these types.
//
// RULE: Do NOT modify existing types here during development.
//       If you need module-local types, define them in your own
//       component/lib files.
// ============================================================

// ----- Brand & Campaign (Member 1 writes, Member 2 reads) -----

export interface BrandInfo {
  name: string;
  url: string;
  industry: string;
  targetAudience: string;
  socials: {
    twitter?: string;
    youtube?: string;
    linkedin?: string;
    website?: string;
  };
  /** Optional: set by input + matching flow for scraper / cache (Apify, CLōD). */
  followers_min?: number;
  followers_max?: number;
  creator_search_keywords?: string[];
}

export interface CampaignConfig {
  budget: number;
  channels: ChannelType[];
  followerRange: [number, number];
  creatorTone: CreatorTone;
}

export type ChannelType =
  | "youtube"
  | "twitter"
  | "linkedin"
  | "newsletter"
  | "podcast"
  | "tiktok";

export type CreatorTone =
  | "authentic-critic"
  | "educator"
  | "entertainer"
  | "thought-leader"
  | "community-builder";

// ----- Analysis (Member 2 writes, Member 1 reads in step2) -----

export interface AnalysisReport {
  coverageScore: number;
  industryAverage: number;
  competitors: CompetitorBenchmark[];
  socialSignals: SocialSignal[];
  summary: string;
}

export interface CompetitorBenchmark {
  name: string;
  coverageScore: number;
  creatorTrafficShare: number;
}

export interface SocialSignal {
  platform: string;
  followers: number;
  engagement: number;
  trend: "up" | "down" | "stable";
}

// ----- Creator & Matching (Member 2 writes, Member 3 reads) -----

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  platform: ChannelType;
  handle: string;
  followers: number;
  engagementRate: number;
  estimatedRate: number;
  niche: string[];
  bio: string;
  recentTopics: string[];
}

export interface MatchResult {
  creator: Creator;
  matchScore: number;
  audienceOverlap: number;
  reasoning: string;
}

// ----- Outreach (Member 3 writes) -----

export interface Pitch {
  id: string;
  creatorId: string;
  creatorName: string;
  subject: string;
  body: string;
  generatedAt: string;
}

export type OutreachStatus = "draft" | "sent" | "opened" | "replied" | "declined";

export interface OutreachItem {
  pitch: Pitch;
  status: OutreachStatus;
  sentAt?: string;
  repliedAt?: string;
}

export interface OutreachState {
  items: OutreachItem[];
  totalSent: number;
  totalReplied: number;
}

// ----- Funnel Step metadata -----

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  path: string;
}
