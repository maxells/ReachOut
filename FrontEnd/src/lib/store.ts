import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  BrandInfo,
  CampaignConfig,
  AnalysisReport,
  MatchResult,
  OutreachState,
} from "./types";

// ============================================================
// Zustand Store — the shared state contract between all modules.
//
// Data ownership:
//   Member 1 (Input)    → writes: brand, campaign
//   Member 2 (Scraping) → writes: analysis, matches
//   Member 3 (Outreach) → writes: outreach
//
// Each member reads from other slices but only writes to their own.
// ============================================================

interface FunnelStore {
  // ----- Navigation -----
  currentStep: number;
  setStep: (step: number) => void;

  // ----- Member 1: Input -----
  brand: BrandInfo;
  setBrand: (brand: Partial<BrandInfo>) => void;
  campaign: CampaignConfig;
  setCampaign: (campaign: Partial<CampaignConfig>) => void;

  // ----- Member 2: Scraping -----
  analysis: AnalysisReport | null;
  setAnalysis: (report: AnalysisReport) => void;
  matches: MatchResult[];
  setMatches: (matches: MatchResult[]) => void;

  // ----- Member 3: Outreach -----
  outreach: OutreachState;
  setOutreach: (outreach: Partial<OutreachState>) => void;

  // ----- Global -----
  reset: () => void;
}

const initialBrand: BrandInfo = {
  name: "",
  url: "",
  industry: "",
  targetAudience: "",
  socials: {},
};

const initialCampaign: CampaignConfig = {
  budget: 5000,
  channels: [],
  followerRange: [1000, 500000],
  creatorTone: "educator",
};

const initialOutreach: OutreachState = {
  items: [],
  totalSent: 0,
  totalReplied: 0,
};

export const useFunnelStore = create<FunnelStore>()(
  persist(
    (set) => ({
      currentStep: 1,
      setStep: (step) => set({ currentStep: step }),

      brand: initialBrand,
      setBrand: (brand) =>
        set((state) => ({ brand: { ...state.brand, ...brand } })),

      campaign: initialCampaign,
      setCampaign: (campaign) =>
        set((state) => ({ campaign: { ...state.campaign, ...campaign } })),

      analysis: null,
      setAnalysis: (analysis) => set({ analysis }),

      matches: [],
      setMatches: (matches) => set({ matches }),

      outreach: initialOutreach,
      setOutreach: (outreach) =>
        set((state) => ({ outreach: { ...state.outreach, ...outreach } })),

      reset: () =>
        set({
          currentStep: 1,
          brand: initialBrand,
          campaign: initialCampaign,
          analysis: null,
          matches: [],
          outreach: initialOutreach,
        }),
    }),
    {
      name: "gofamous-funnel",
    }
  )
);
