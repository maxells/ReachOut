import {
  isOutreachDemoFixture,
  resolveDemoMatches,
  type OutreachDemoFixture,
} from "@/lib/outreach-demo-fixture";
import type { OutreachChannel } from "@/lib/outreach";
import { useFunnelStore } from "@/lib/store";

export const OUTREACH_STEP5_BOOTSTRAP_KEY = "gofamous-outreach-bootstrap";

/** Set by `/prepare` before `replace` to the main page; read on Step 5 to prove the user came through prepare (not removed on read — avoids React Strict Mode redirect loops). */
export const STEP5_ENTRY_GATE_KEY = "gofamous-from-prepare";

/** UI defaults carried from a loaded session JSON into Step 5 local state (read once). */
export type Step5BootstrapPayload = {
  channel?: OutreachChannel;
  productDescription?: string;
  senderName?: string;
  collaborationType?: string;
  linkedinRecipientProfileUrl?: string;
};

const COLLAB_OPTIONS = [
  "sponsored deep-dive video",
  "newsletter mention",
  "product demo thread",
  "co-hosted webinar",
] as const;

export type HydrateOutreachSessionResult =
  | { ok: true; matchCount: number }
  | { ok: false; message: string };

/**
 * Applies a validated outreach session fixture into the funnel store and queues
 * Step 5 UI bootstrap (channel, pitch context) for the next page.
 */
export function hydrateOutreachSessionFromFixture(
  data: OutreachDemoFixture
): HydrateOutreachSessionResult {
  const resolved = resolveDemoMatches(data);
  if (resolved.length === 0) {
    return { ok: false, message: "Session data has no creator matches." };
  }

  const {
    setBrand,
    setCampaign,
    setMatches,
    setStep,
    setAnalysis,
    setOutreach,
  } = useFunnelStore.getState();

  setBrand(data.brand);
  setCampaign(data.campaign);
  setMatches(resolved);
  setStep(5);
  if (data.analysis) {
    setAnalysis(data.analysis);
  }
  setOutreach({
    items: [],
    totalSent: 0,
    totalReplied: 0,
  });

  const pc = data.pitchContext ?? {};
  const payload: Step5BootstrapPayload = {};
  if (
    pc.channel === "linkedin" ||
    pc.channel === "email" ||
    pc.channel === "reddit" ||
    pc.channel === "youtube"
  ) {
    payload.channel = pc.channel;
  }
  if (typeof pc.productDescription === "string" && pc.productDescription !== "") {
    payload.productDescription = pc.productDescription;
  }
  if (typeof pc.senderName === "string" && pc.senderName !== "") {
    payload.senderName = pc.senderName;
  }
  if (
    typeof pc.collaborationType === "string" &&
    COLLAB_OPTIONS.includes(
      pc.collaborationType as (typeof COLLAB_OPTIONS)[number]
    )
  ) {
    payload.collaborationType = pc.collaborationType;
  }
  const url = data.linkedinRecipientProfileUrl?.trim();
  if (url) {
    payload.linkedinRecipientProfileUrl = url;
  }

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(
        OUTREACH_STEP5_BOOTSTRAP_KEY,
        JSON.stringify(payload)
      );
    } catch {
      /* ignore quota / private mode */
    }
  }

  return { ok: true, matchCount: resolved.length };
}

/**
 * Fetches the default bundled outreach session (`?default=1`) and hydrates the store.
 */
export async function fetchAndHydrateDefaultOutreachSession(): Promise<HydrateOutreachSessionResult> {
  try {
    const response = await fetch("/api/outreach-demo-fixture?default=1");
    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return {
        ok: false,
        message: err.error || "Could not load session data.",
      };
    }
    const data: unknown = await response.json();
    if (!isOutreachDemoFixture(data)) {
      return {
        ok: false,
        message: "Invalid session payload from server.",
      };
    }
    return hydrateOutreachSessionFromFixture(data);
  } catch {
    return { ok: false, message: "Failed to load session data." };
  }
}
