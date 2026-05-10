import { describe, it, expect } from "vitest";
import { generateSearchStrategy, scoreAndRankCreators } from "@/lib/clod";
import type { LinkedInProfile, MatchInput } from "@/lib/clod";

const APIFY_BASE_URL = "https://api.apify.com/v2";
const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const ACTOR_ID = "powerai~linkedin-peoples-search-scraper";

const testInput: MatchInput = {
  brand: {
    name: "DevToolsCo",
    url: "https://devtoolsco.com",
    industry: "Developer Tools",
    targetAudience: "Software engineers and DevOps teams",
    socials: {},
    hashtags: ["#devops", "#cloud"],
    keywords: ["DevOps", "cloud infrastructure", "SaaS"],
    brandAliases: [],
  },
  campaign: {
    budget: 5000,
    channels: ["linkedin"],
    followerRange: [1000, 50000],
    creatorTone: "educator",
  },
};

// ─── Test 1: CLōD — generateSearchStrategy ────────────────────────────

describe("CLōD API — generateSearchStrategy", () => {
  it("returns valid search queries, target titles, and keywords", async () => {
    const strategy = await generateSearchStrategy(testInput);

    expect(strategy).toBeDefined();

    expect(strategy.titleSearches).toBeInstanceOf(Array);
    expect(strategy.titleSearches.length).toBeGreaterThanOrEqual(3);
    strategy.titleSearches.forEach((q) => {
      expect(typeof q).toBe("string");
      expect(q.length).toBeGreaterThan(0);
    });

    expect(strategy.targetTitles).toBeInstanceOf(Array);
    expect(strategy.targetTitles.length).toBeGreaterThan(0);

    expect(strategy.targetKeywords).toBeInstanceOf(Array);
    expect(strategy.targetKeywords.length).toBeGreaterThan(0);
  });
});

// ─── Test 2: Apify — token validation + actor accessibility ───────────

describe("Apify API — token and actor verification", () => {
  it("authenticates successfully and can access the LinkedIn scraper actor", async () => {
    // Verify token by fetching user profile
    const userRes = await fetch(
      `${APIFY_BASE_URL}/users/me?token=${APIFY_TOKEN}`
    );
    expect(userRes.status).toBe(200);

    const userData = await userRes.json();
    expect(userData.data).toBeDefined();
    expect(userData.data.username).toBeTruthy();

    // Verify the LinkedIn People Scraper actor is accessible
    const encodedActorId = encodeURIComponent(ACTOR_ID);
    const actorRes = await fetch(
      `${APIFY_BASE_URL}/acts/${encodedActorId}?token=${APIFY_TOKEN}`
    );
    expect(actorRes.status).toBe(200);

    const actorData = await actorRes.json();
    expect(actorData.data).toBeDefined();
    expect(actorData.data.name).toBeTruthy();
  });
});

// ─── Test 3: CLōD — scoreAndRankCreators ──────────────────────────────

describe("CLōD API — scoreAndRankCreators", () => {
  it("scores mock LinkedIn profiles and returns structured results", async () => {
    const mockProfiles: LinkedInProfile[] = [
      {
        name: "Alice Chen",
        headline: "DevOps Thought Leader | Cloud Architecture | Keynote Speaker",
        profileUrl: "https://linkedin.com/in/alice-chen",
        location: "San Francisco, CA",
        connections: 12000,
        summary:
          "I help engineering teams adopt cloud-native practices. Speaker at KubeCon, re:Invent. Newsletter: 15k subscribers.",
        skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Docker"],
        experience: ["VP Engineering at CloudScale", "SRE Lead at BigTech"],
      },
      {
        name: "Bob Smith",
        headline: "Junior QA Intern",
        profileUrl: "https://linkedin.com/in/bob-smith",
        location: "Austin, TX",
        connections: 85,
        summary: "Looking for entry-level QA positions.",
        skills: ["Manual Testing"],
        experience: ["QA Intern at SmallCo"],
      },
      {
        name: "Carol Davis",
        headline: "SaaS Growth Strategist | Content Creator | 20k LinkedIn followers",
        profileUrl: "https://linkedin.com/in/carol-davis",
        location: "New York, NY",
        connections: 20000,
        summary:
          "I write about B2B SaaS growth and developer marketing. My posts reach 500k impressions/month.",
        skills: ["SaaS", "Developer Marketing", "Content Strategy", "B2B"],
        experience: [
          "Head of Growth at DevToolsCo",
          "Content Lead at SaaSify",
        ],
      },
    ];

    const results = await scoreAndRankCreators(mockProfiles, testInput);

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(mockProfiles.length);

    for (const scored of results) {
      expect(scored.profileIndex).toBeGreaterThanOrEqual(0);
      expect(scored.profileIndex).toBeLessThan(mockProfiles.length);
      expect(scored.matchScore).toBeGreaterThanOrEqual(0);
      expect(scored.matchScore).toBeLessThanOrEqual(100);
      expect(typeof scored.reasoning).toBe("string");
      expect(scored.reasoning.length).toBeGreaterThan(0);
      expect(scored.niche).toBeInstanceOf(Array);
      expect(typeof scored.isInfluencer).toBe("boolean");
    }

    // Alice (DevOps leader) should score higher than Bob (QA intern)
    const aliceScore = results.find((r) => r.profileIndex === 0);
    const bobScore = results.find((r) => r.profileIndex === 1);
    if (aliceScore && bobScore) {
      expect(aliceScore.matchScore).toBeGreaterThan(bobScore.matchScore);
    }
  });
});
