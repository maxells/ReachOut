/**
 * HeyReach Campaign API adapter (server-side only).
 * Docs: https://www.heyreach.io/blog/campaign-api — Settings → API for key.
 */

import type { SendOutreachRequest, SendOutreachResponse } from "@/lib/outreach";
import { isLikelyLinkedInProfileUrl } from "@/lib/outreach";

const DEFAULT_BASE = "https://api.heyreach.io/api/public";

type HeyReachSequenceNode = Record<string, unknown>;

function trimMessage(body: string): string {
  const t = body.trim();
  return t.length > 8000 ? `${t.slice(0, 7997)}...` : t;
}

function messageSequence(body: string): HeyReachSequenceNode {
  const msg = trimMessage(body);
  /**
   * HeyReach rejects any unconditional edge still at 00:00:00 (START→MESSAGE and MESSAGE→END).
   * Set ≥3h delay on MESSAGE and on the END leaf so both segments are valid.
   */
  const stepHours = Math.max(
    3,
    Number.parseInt(process.env.HEYREACH_SEQUENCE_FIRST_DELAY_HOURS ?? "3", 10) || 3
  );

  const delayFields = {
    actionDelay: stepHours,
    actionDelayUnit: "HOUR" as const,
  };

  return {
    nodeType: "MESSAGE",
    ...delayFields,
    payload: {
      messages: [msg],
      fallbackMessage: msg,
    },
    unconditionalNode: {
      nodeType: "END",
      ...delayFields,
    },
  };
}

async function heyReachPost<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  body: unknown
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof (json as { message: unknown }).message === "string"
        ? (json as { message: string }).message
        : text || res.statusText;
    throw new Error(`HeyReach ${path} failed (${res.status}): ${detail}`);
  }

  return json as T;
}

async function heyReachGet<T>(
  baseUrl: string,
  apiKey: string,
  pathWithQuery: string
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}/${pathWithQuery.replace(/^\//, "")}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-KEY": apiKey,
    },
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof (json as { message: unknown }).message === "string"
        ? (json as { message: string }).message
        : text || res.statusText;
    throw new Error(`HeyReach ${pathWithQuery} failed (${res.status}): ${detail}`);
  }

  return json as T;
}

function pickNumericId(data: unknown, keys: string[]): number | null {
  if (typeof data !== "object" || data === null) return null;
  const o = data as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

function extractListId(createResponse: unknown): number {
  const id =
    pickNumericId(createResponse, ["id", "listId", "linkedInUserListId"]) ??
    (typeof createResponse === "object" &&
    createResponse !== null &&
    "data" in createResponse
      ? pickNumericId(
          (createResponse as { data: unknown }).data,
          ["id", "listId"]
        )
      : null);

  if (id === null) {
    throw new Error(
      "Could not read list id from HeyReach list/CreateEmptyList response."
    );
  }
  return id;
}

function extractCampaignId(createResponse: unknown): number {
  const id =
    pickNumericId(createResponse, ["campaignId", "id"]) ??
    (typeof createResponse === "object" &&
    createResponse !== null &&
    "data" in createResponse
      ? pickNumericId(
          (createResponse as { data: unknown }).data,
          ["campaignId", "id"]
        )
      : null);

  if (id === null) {
    throw new Error(
      "Could not read campaign id from HeyReach campaign/Create response."
    );
  }
  return id;
}

function extractLinkedInAccountIdsFromResponse(data: unknown): number[] {
  if (typeof data !== "object" || data === null) return [];
  const root = data as Record<string, unknown>;
  const arrays: unknown[][] = [];
  const pushArr = (v: unknown) => {
    if (Array.isArray(v)) arrays.push(v);
  };

  pushArr(root.items);
  pushArr(root.linkedInAccounts);
  pushArr(root.accounts);
  pushArr(root.results);

  const dataObj = root.data;
  if (typeof dataObj === "object" && dataObj !== null) {
    const d = dataObj as Record<string, unknown>;
    pushArr(d.items);
    pushArr(d.linkedInAccounts);
    pushArr(d.accounts);
  }

  const ids: number[] = [];
  for (const arr of arrays) {
    for (const item of arr) {
      if (typeof item !== "object" || item === null) continue;
      const row = item as Record<string, unknown>;
      const id =
        row.id ??
        row.linkedInAccountId ??
        row.accountId ??
        row.senderId ??
        row.liAccountId;
      if (typeof id === "number" && Number.isFinite(id) && id > 0) {
        ids.push(id);
      }
    }
    if (ids.length > 0) return [...new Set(ids)];
  }
  return [];
}

/** Paths differ across HeyReach API versions; try in order (Campaign API era uses li_account). */
const LINKEDIN_ACCOUNT_LIST_PATHS = [
  "li_account/GetAll",
  "linkedinAccount/GetAll",
  "LinkedInAccount/GetAll",
] as const;

function isHttp404FromHeyReachError(message: string): boolean {
  return /\(\s*404\s*\)/.test(message) || message.includes("failed (404)");
}

async function resolveLinkedInAccountIds(
  baseUrl: string,
  apiKey: string,
  envHint: string | undefined
): Promise<number[]> {
  const trimmed = envHint?.trim();
  if (trimmed) {
    const parsed = trimmed
      .split(/[\s,]+/)
      .map((s) => Number.parseInt(s, 10))
      .filter((n) => Number.isFinite(n));
    if (parsed.length > 0) return parsed;
  }

  const body = { limit: 100, offset: 0 };
  let last404Message: string | null = null;

  for (const path of LINKEDIN_ACCOUNT_LIST_PATHS) {
    try {
      const data = await heyReachPost<unknown>(
        baseUrl,
        apiKey,
        path,
        body
      );

      const ids = extractLinkedInAccountIdsFromResponse(data);
      if (ids.length === 0) {
        throw new Error(
          "HeyReach returned no LinkedIn sender ids. Connect a LinkedIn account in HeyReach or set HEYREACH_LINKEDIN_ACCOUNT_ID."
        );
      }
      return ids;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (isHttp404FromHeyReachError(msg)) {
        last404Message = msg;
        continue;
      }
      throw error;
    }
  }

  throw new Error(
    last404Message
      ? `Could not list LinkedIn senders (tried ${LINKEDIN_ACCOUNT_LIST_PATHS.join(", ")}). Last error: ${last404Message} Set HEYREACH_LINKEDIN_ACCOUNT_ID to the numeric sender id from HeyReach (LinkedIn Accounts / Settings).`
      : "Could not list LinkedIn sender accounts."
  );
}

/**
 * End-to-end: temporary USER_LIST with one lead → draft campaign with a MESSAGE step → StartCampaign.
 * Delivery is subject to HeyReach/LINKEDIN rules (connection state, limits, subscription).
 */
export async function sendViaHeyReach(
  payload: SendOutreachRequest,
  options?: { baseUrl?: string }
): Promise<SendOutreachResponse> {
  const apiKey = process.env.HEYREACH_API_KEY?.trim();
  if (!apiKey || apiKey.includes("your-key-here")) {
    return {
      ok: false,
      status: "failed",
      message:
        "Missing HEYREACH_API_KEY. Add it to .env.local (server-side only).",
    };
  }

  const profileUrl = payload.recipient?.trim();
  if (!profileUrl || !isLikelyLinkedInProfileUrl(profileUrl)) {
    return {
      ok: false,
      status: "failed",
      message:
        "LinkedIn channel requires a full profile URL in recipient (e.g. https://www.linkedin.com/in/username).",
    };
  }

  const baseUrl =
    options?.baseUrl?.trim() ||
    process.env.HEYREACH_API_BASE_URL?.trim() ||
    DEFAULT_BASE;

  try {
    const listName = `ReachOut-${Date.now()}`.slice(0, 50);
    const createListRes = await heyReachPost<unknown>(
      baseUrl,
      apiKey,
      "list/CreateEmptyList",
      { name: listName, type: "USER_LIST" }
    );
    const listId = extractListId(createListRes);

    const leadRow: Record<string, string> = { linkedinUrl: profileUrl };
    if (payload.creatorName?.trim()) {
      const parts = payload.creatorName.trim().split(/\s+/);
      leadRow.firstName = parts[0] ?? "";
      if (parts.length > 1) {
        leadRow.lastName = parts.slice(1).join(" ");
      }
    }

    await heyReachPost<unknown>(baseUrl, apiKey, "list/AddLeadsToListV2", {
      listId,
      leads: [leadRow],
    });

    const accountIds = await resolveLinkedInAccountIds(
      baseUrl,
      apiKey,
      process.env.HEYREACH_LINKEDIN_ACCOUNT_ID
    );

    const campaignName = `ReachOut-${payload.creatorId}`.slice(0, 50);
    const createCampRes = await heyReachPost<unknown>(
      baseUrl,
      apiKey,
      "campaign/Create",
      {
        name: campaignName,
        linkedInUserListId: listId,
        linkedInAccountIds: accountIds,
        sequence: messageSequence(payload.body),
      }
    );
    const campaignId = extractCampaignId(createCampRes);

    await heyReachPost<unknown>(
      baseUrl,
      apiKey,
      `campaign/StartCampaign?campaignId=${encodeURIComponent(String(campaignId))}`,
      {}
    );

    return {
      ok: true,
      status: "sent",
      message: `HeyReach accepted campaign ${campaignId} and started it. Messaging runs on HeyReach's schedule; delivery depends on LinkedIn connection rules.`,
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "HeyReach send failed.";
    return { ok: false, status: "failed", message: msg };
  }
}

/** Optional: verify key without side effects (GET auth/CheckApiKey). */
export async function checkHeyReachApiKeyReachable(): Promise<boolean> {
  const apiKey = process.env.HEYREACH_API_KEY?.trim();
  const baseUrl =
    process.env.HEYREACH_API_BASE_URL?.trim() || DEFAULT_BASE;
  if (!apiKey) return false;
  try {
    await heyReachGet(baseUrl, apiKey, "auth/CheckApiKey");
    return true;
  } catch {
    return false;
  }
}
