/**
 * Mock LinkedIn profiles used as a fallback when Apify returns 0 results.
 *
 * LinkedIn search-based Apify actors are notoriously unreliable
 * (LinkedIn blocks them aggressively). Until a working actor is wired in,
 * this fallback lets the rest of the pipeline (AI scoring, UI rendering)
 * be exercised end-to-end with realistic data.
 *
 * Each profile is shaped exactly like what `searchLinkedInPeople` returns,
 * so it drops straight into `scoreAndRankCreators`.
 */
import type { LinkedInProfile } from "./clod";

export const MOCK_LINKEDIN_PROFILES: LinkedInProfile[] = [
  {
    name: "Jasmine Wang",
    headline:
      "AI Agents thought leader • Building autonomous workflows • 30k LinkedIn followers • Newsletter: The Agentic Edge",
    profileUrl: "https://linkedin.com/in/jasmine-wang-ai",
    location: "San Francisco, CA",
    connections: 30200,
    summary:
      "I write weekly about LLM agents, tool-use design patterns, and autonomous workflows. Speaker at AI Engineer Summit and ScaleConf.",
    skills: ["LLM agents", "LangChain", "AutoGPT", "Agent design", "Python", "Prompt engineering"],
    experience: [
      "Founder at Agentic Labs",
      "Staff ML Engineer at Anthropic",
      "AI Researcher at Google Brain",
    ],
  },
  {
    name: "Marcus Brennan",
    headline:
      "Developer Advocate at AI infrastructure co • Talks AI agents to engineers • 22k followers",
    profileUrl: "https://linkedin.com/in/marcus-brennan-devrel",
    location: "Austin, TX",
    connections: 22400,
    summary:
      "Helping devs ship AI agents in production. Conference speaker, podcast host (DevTalks), and contributor to open-source agent frameworks.",
    skills: ["Developer relations", "AI agents", "TypeScript", "Vercel AI SDK", "OpenAI", "Public speaking"],
    experience: [
      "Head of DevRel at LangFlow",
      "Senior DevRel at Vercel",
      "Software Engineer at Twilio",
    ],
  },
  {
    name: "Priya Ramanathan",
    headline:
      "AI Product Strategist • Writing about agentic workflows for B2B SaaS • LinkedIn Top Voice in AI",
    profileUrl: "https://linkedin.com/in/priya-ramanathan",
    location: "New York, NY",
    connections: 48700,
    summary:
      "I help B2B SaaS teams adopt AI agents in their product roadmap. Top Voice on LinkedIn for AI strategy. Newsletter: 25k subscribers.",
    skills: ["AI product strategy", "B2B SaaS", "Agent UX", "Go-to-market", "Product management"],
    experience: [
      "VP Product at Notion AI",
      "Director of Product at Asana",
      "PM at Salesforce Einstein",
    ],
  },
  {
    name: "Diego Hernández",
    headline:
      "AI Engineer • Building agents on top of GPT-5 and Claude • Open-source maintainer • Newsletter writer",
    profileUrl: "https://linkedin.com/in/diego-hernandez-ai",
    location: "Mexico City, MX",
    connections: 15300,
    summary:
      "Open-source contributor to Hugging Face Agents, LangChain, and CrewAI. I publish weekly engineering deep-dives on agent architectures.",
    skills: ["Python", "LangGraph", "CrewAI", "RAG", "Multi-agent systems", "OSS"],
    experience: [
      "Senior AI Engineer at Replicate",
      "ML Engineer at Hugging Face",
      "Software Engineer at Mercado Libre",
    ],
  },
  {
    name: "Hannah Ko",
    headline:
      "Founder & CEO at AI agent startup • Ex-OpenAI • Speaker on autonomous AI for devtools",
    profileUrl: "https://linkedin.com/in/hannah-ko-ai",
    location: "Seattle, WA",
    connections: 41200,
    summary:
      "Building the next generation of AI agents for software engineers. Previously led the Codex evaluation team at OpenAI. Frequent keynote speaker.",
    skills: ["AI startups", "Developer tools", "Agentic AI", "LLM evaluation", "Founder", "Keynote speaking"],
    experience: [
      "Founder & CEO at PilotKit",
      "Research Engineer at OpenAI",
      "Senior SWE at Microsoft Research",
    ],
  },
  {
    name: "Tyrone Williams",
    headline:
      "Educator & creator • Teaching 50k+ devs how to build AI agents • YouTube + LinkedIn",
    profileUrl: "https://linkedin.com/in/tyrone-williams-ai",
    location: "Atlanta, GA",
    connections: 34500,
    summary:
      "I run a 50k-subscriber YouTube channel on AI agents and a popular LinkedIn series. Past clients: Stripe, Vercel, MongoDB.",
    skills: ["Content creation", "Tutorial writing", "AI agents", "Video production", "Teaching"],
    experience: [
      "Independent creator (full-time)",
      "Senior Engineer at Atlassian",
      "Lecturer at Georgia Tech",
    ],
  },
  {
    name: "Sara Lindqvist",
    headline:
      "AI agent researcher • Stanford PhD • Newsletter: Agents in Practice (12k subscribers)",
    profileUrl: "https://linkedin.com/in/sara-lindqvist",
    location: "Palo Alto, CA",
    connections: 18600,
    summary:
      "Stanford PhD in multi-agent systems. I bridge research and production by writing about agent evaluation, safety, and reliability for a 12k-subscriber audience.",
    skills: ["Multi-agent systems", "Agent evaluation", "Reinforcement learning", "Research", "Technical writing"],
    experience: [
      "Research Scientist at Stanford HAI",
      "Visiting Researcher at DeepMind",
      "PhD at Stanford CS",
    ],
  },
  {
    name: "Ben Carter",
    headline:
      "Founder of Agents Weekly newsletter • Investor in AI agent startups • 60k LinkedIn followers",
    profileUrl: "https://linkedin.com/in/ben-carter-agents",
    location: "London, UK",
    connections: 61500,
    summary:
      "I curate the most-read newsletter on AI agents (60k subscribers) and angel-invest in early-stage AI agent startups. Speaker at AI Frontier and Web Summit.",
    skills: ["Newsletter publishing", "Angel investing", "AI agents", "Startup advisory", "Public speaking"],
    experience: [
      "Founder at Agents Weekly",
      "Angel Investor (independent)",
      "Director of Strategy at GitHub",
    ],
  },
];
