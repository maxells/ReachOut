import type { OutreachChannel } from "@/lib/outreach";

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
