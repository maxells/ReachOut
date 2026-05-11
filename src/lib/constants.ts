import type { StepConfig, ChannelType, CreatorTone } from "./types";

export const FUNNEL_STEPS: StepConfig[] = [
  {
    id: 1,
    title: "Brand Onboarding",
    description: "Tell us about your brand",
    path: "/funnel/step1-onboarding",
  },
  {
    id: 2,
    title: "Market Analysis",
    description: "AI-powered market scan",
    path: "/funnel/step2-analysis",
  },
  {
    id: 3,
    title: "Campaign Setup",
    description: "Define your campaign parameters",
    path: "/funnel/step3-campaign",
  },
  {
    id: 4,
    title: "Creator Matching",
    description: "AI-matched creators for your brand",
    path: "/funnel/step4-matching",
  },
  {
    id: 5,
    title: "Outreach",
    description: "Launch your campaign",
    path: "/funnel/step5-outreach/prepare",
  },
];

/** Temporary E2E entry: loads bundled outreach fixture then redirects (see `funnel/e2e-session/page.tsx`). */
export const E2E_OUTREACH_BOOTSTRAP_PATH = "/funnel/e2e-session";

export const CHANNEL_OPTIONS: { value: ChannelType; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "newsletter", label: "Newsletter" },
  { value: "podcast", label: "Podcast" },
  { value: "tiktok", label: "TikTok" },
];

export const CREATOR_TONE_OPTIONS: { value: CreatorTone; label: string; description: string }[] = [
  {
    value: "authentic-critic",
    label: "Authentic Critic",
    description: "Honest, unbiased reviews that audiences trust",
  },
  {
    value: "educator",
    label: "Educator",
    description: "Tutorial-driven content that teaches while promoting",
  },
  {
    value: "entertainer",
    label: "Entertainer",
    description: "Fun, engaging content that goes viral",
  },
  {
    value: "thought-leader",
    label: "Thought Leader",
    description: "Industry authority with deep expertise",
  },
  {
    value: "community-builder",
    label: "Community Builder",
    description: "Strong community engagement and loyalty",
  },
];

export const INDUSTRY_OPTIONS = [
  "Fintech",
  "Dev Tools",
  "SaaS",
  "AI / ML",
  "E-commerce",
  "Health Tech",
  "EdTech",
  "Cybersecurity",
  "Marketing Tech",
  "Consumer Apps",
] as const;

export const FOLLOWER_RANGE_PRESETS = [
  { label: "Nano (1K - 10K)", range: [1000, 10000] as [number, number] },
  { label: "Micro (10K - 50K)", range: [10000, 50000] as [number, number] },
  { label: "Mid (50K - 200K)", range: [50000, 200000] as [number, number] },
  { label: "Macro (200K - 500K)", range: [200000, 500000] as [number, number] },
  { label: "All Sizes", range: [1000, 500000] as [number, number] },
];

/** Campaign budget slider bounds (USD). */
export const CAMPAIGN_BUDGET_MIN = 500;
export const CAMPAIGN_BUDGET_MAX = 250_000;
export const CAMPAIGN_BUDGET_STEP = 500;

/** Creator follower range slider bounds (used with presets). */
export const FOLLOWER_RANGE_MIN = 1000;
export const FOLLOWER_RANGE_MAX = 500_000;
export const FOLLOWER_RANGE_STEP = 1000;
