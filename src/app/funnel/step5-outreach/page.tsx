"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { StepNav } from "@/components/funnel/step-nav";
import { ChannelSelector } from "@/components/outreach/channel-selector";
import { InfluencerSelector } from "@/components/outreach/influencer-selector";
import { PitchEditor } from "@/components/outreach/pitch-editor";
import { PitchGeneratingOverlay } from "@/components/outreach/pitch-generating-overlay";
import { SendStatusBanner } from "@/components/outreach/send-status-banner";
import {
  buildPitchGenerationRequest,
  createEmptyPitch,
  defaultLinkedInRecipientFromMatch,
  isLikelyLinkedInProfileUrl,
  type OutreachChannel,
  type PitchDraft,
  type SendOutreachResponse,
  type SendStatus,
} from "@/lib/outreach";
import {
  OUTREACH_STEP5_BOOTSTRAP_KEY,
  STEP5_ENTRY_GATE_KEY,
  type Step5BootstrapPayload,
} from "@/lib/outreach-session-hydrate";
import { useFunnelStore } from "@/lib/store";
import type { MatchResult, OutreachItem, Pitch } from "@/lib/types";

const DEFAULT_CHANNEL: OutreachChannel = "linkedin";
const COLLAB_OPTIONS = [
  "sponsored deep-dive video",
  "newsletter mention",
  "product demo thread",
  "co-hosted webinar",
];

function persistPitchToStore(
  match: MatchResult,
  nextSubject: string,
  nextBody: string,
  status: OutreachItem["status"] = "draft",
  sentAt?: string
) {
  const { outreach, setOutreach } = useFunnelStore.getState();
  const existing = outreach.items.find(
    (item) => item.pitch.creatorId === match.creator.id
  );
  const pitch: Pitch = {
    ...(existing?.pitch ??
      createEmptyPitch(match.creator.id, match.creator.name)),
    subject: nextSubject,
    body: nextBody,
    generatedAt: existing?.pitch.generatedAt ?? new Date().toISOString(),
  };
  const nextItem: OutreachItem = {
    pitch,
    status,
    sentAt,
  };
  const nextItems = [
    nextItem,
    ...outreach.items.filter(
      (item) => item.pitch.creatorId !== match.creator.id
    ),
  ];

  setOutreach({
    items: nextItems,
    totalSent: nextItems.filter((item) => item.status === "sent").length,
    totalReplied: outreach.totalReplied,
  });
}

export default function Step5Outreach() {
  const router = useRouter();
  const [entryAllowed, setEntryAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STEP5_ENTRY_GATE_KEY) !== "1") {
      router.replace("/funnel/step5-outreach/prepare");
      return;
    }
    // Do not remove the gate here: Strict Mode remounts would clear it before the second
    // mount and cause an infinite prepare ↔ outreach redirect loop.
    setEntryAllowed(true);
  }, [router]);

  const {
    brand,
    campaign,
    matches,
    outreach,
    analysis,
    setOutreach,
  } = useFunnelStore();

  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [channel, setChannel] = useState<OutreachChannel>(DEFAULT_CHANNEL);
  /** Per-creator LinkedIn profile URLs (prefilled from `creator.handle` when valid). */
  const [recipientUrlByCreatorId, setRecipientUrlByCreatorId] = useState<
    Record<string, string>
  >({});
  const [valueProp, setValueProp] = useState("");
  const [senderName, setSenderName] = useState("");
  const [collaborationType, setCollaborationType] = useState(COLLAB_OPTIONS[0]);
  const [draftsByCreator, setDraftsByCreator] = useState<
    Record<string, PitchDraft>
  >({});
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchSending, setBatchSending] = useState(false);
  const [sendingCreatorId, setSendingCreatorId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  /** Routes feedback next to "Send all" vs a creator card (`batch` | creatorId). */
  const [sendFeedbackTarget, setSendFeedbackTarget] = useState<
    "batch" | string | null
  >(null);
  /** Progress for the generating overlay (batch or single). */
  const [genProgress, setGenProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  /** One automatic batch per match-set key (prevents duplicate requests). */
  const autoGenAttemptedRef = useRef<Record<string, boolean>>({});
  const bootstrapConsumedRef = useRef(false);

  const activeCreatorId = selectedCreatorId || matches[0]?.creator.id || "";

  useEffect(() => {
    setRecipientUrlByCreatorId((prev) => {
      const next = { ...prev };
      for (const m of matches) {
        const id = m.creator.id;
        if (next[id] === undefined) {
          next[id] = defaultLinkedInRecipientFromMatch(m);
        }
      }
      for (const k of Object.keys(next)) {
        if (!matches.some((m) => m.creator.id === k)) {
          delete next[k];
        }
      }
      return next;
    });
  }, [matches]);

  /** Apply channel / pitch defaults from the prepare loader (session JSON), once matches exist. */
  useEffect(() => {
    if (!entryAllowed) return;
    if (matches.length === 0) return;
    if (bootstrapConsumedRef.current) return;
    if (typeof window === "undefined") return;

    try {
      const raw = sessionStorage.getItem(OUTREACH_STEP5_BOOTSTRAP_KEY);
      if (!raw) return;

      const b = JSON.parse(raw) as Step5BootstrapPayload;
      sessionStorage.removeItem(OUTREACH_STEP5_BOOTSTRAP_KEY);
      bootstrapConsumedRef.current = true;

      if (
        b.channel === "linkedin" ||
        b.channel === "email" ||
        b.channel === "reddit" ||
        b.channel === "youtube"
      ) {
        setChannel(b.channel);
      }
      if (typeof b.productDescription === "string" && b.productDescription !== "") {
        setValueProp(b.productDescription);
      }
      if (typeof b.senderName === "string" && b.senderName !== "") {
        setSenderName(b.senderName);
      }
      if (
        typeof b.collaborationType === "string" &&
        COLLAB_OPTIONS.includes(b.collaborationType)
      ) {
        setCollaborationType(b.collaborationType);
      }

      const url = b.linkedinRecipientProfileUrl?.trim();
      const firstId = matches[0]?.creator.id;
      if (url && firstId) {
        setRecipientUrlByCreatorId((prev) => ({
          ...prev,
          [firstId]: url,
        }));
      }
    } catch {
      sessionStorage.removeItem(OUTREACH_STEP5_BOOTSTRAP_KEY);
    }
  }, [matches, entryAllowed]);

  const handleSelectMatch = (match: MatchResult) => {
    setSelectedCreatorId(match.creator.id);
    setSendStatus("idle");
    setStatusMessage("");
    const el = document.getElementById(`pitch-card-${match.creator.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const handleChannelChange = (nextChannel: OutreachChannel) => {
    setChannel(nextChannel);
    setSendStatus("idle");
    setStatusMessage("");
    setSendFeedbackTarget(null);
  };

  const draftForMatch = (match: MatchResult) => {
    const d = draftsByCreator[match.creator.id];
    const o = outreach.items.find(
      (item) => item.pitch.creatorId === match.creator.id
    )?.pitch;
    return {
      subject: d?.subject ?? o?.subject ?? "",
      body: d?.body ?? o?.body ?? "",
    };
  };

  const handleSubjectChangeForMatch = (
    match: MatchResult,
    nextSubject: string
  ) => {
    const { body: prevBody } = draftForMatch(match);
    setDraftsByCreator((drafts) => ({
      ...drafts,
      [match.creator.id]: {
        subject: nextSubject,
        body: prevBody,
      },
    }));
    if (prevBody.trim() || nextSubject.trim()) {
      persistPitchToStore(match, nextSubject, prevBody);
    }
  };

  const handleBodyChangeForMatch = (match: MatchResult, nextBody: string) => {
    const { subject: prevSubject } = draftForMatch(match);
    setDraftsByCreator((drafts) => ({
      ...drafts,
      [match.creator.id]: {
        subject: prevSubject,
        body: nextBody,
      },
    }));
    if (nextBody.trim() || prevSubject.trim()) {
      persistPitchToStore(match, prevSubject, nextBody);
    }
  };

  const runGenerateForMatch = useCallback(
    async (match: MatchResult): Promise<void> => {
      const response = await fetch("/api/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPitchGenerationRequest({
            brand,
            campaign,
            match,
            channel,
            valueProp,
            collaborationType,
            senderName,
            analysis,
          })
        ),
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(error.message || "Failed to generate pitch draft.");
      }

      const draft = (await response.json()) as PitchDraft;
      const nextSubject = channel === "email" ? draft.subject ?? "" : "";
      const nextBody = draft.body;

      setDraftsByCreator((drafts) => ({
        ...drafts,
        [match.creator.id]: {
          subject: nextSubject,
          body: nextBody,
        },
      }));
      persistPitchToStore(match, nextSubject, nextBody);
    },
    [
      brand,
      campaign,
      channel,
      valueProp,
      collaborationType,
      senderName,
      analysis,
    ]
  );

  const handleGenerateAll = useCallback(async () => {
    if (matches.length === 0) return;

    setBatchGenerating(true);
    setSendFeedbackTarget("batch");
    setGenProgress({ done: 0, total: matches.length });
    setSendStatus("idle");
    setStatusMessage("");

    const errors: string[] = [];
    let ok = 0;
    try {
      for (const match of matches) {
        try {
          await runGenerateForMatch(match);
          ok += 1;
          setGenProgress({ done: ok, total: matches.length });
          setStatusMessage(`Generated ${ok}/${matches.length}…`);
        } catch (e) {
          errors.push(
            `${match.creator.name}: ${e instanceof Error ? e.message : "failed"}`
          );
        }
      }
      setStatusMessage(
        errors.length
          ? `Done with ${ok} ok, ${errors.length} failed. ${errors.slice(0, 3).join(" · ")}`
          : `Generated all ${matches.length} pitch drafts.`
      );
      setSendStatus(errors.length === matches.length ? "failed" : "idle");
    } finally {
      setBatchGenerating(false);
      setGenProgress(null);
    }
  }, [matches, runGenerateForMatch]);

  useEffect(() => {
    if (!entryAllowed) return;
    if (matches.length === 0) return;
    if (!brand.name?.trim()) return;
    if (!campaign.channels?.length) return;

    const key = [...matches.map((m) => m.creator.id)].sort().join("|");

    const allDrafted = matches.every((m) => {
      const d = draftsByCreator[m.creator.id]?.body?.trim();
      const o = outreach.items.find((i) => i.pitch.creatorId === m.creator.id)
        ?.pitch.body?.trim();
      return Boolean(d || o);
    });
    if (allDrafted) return;
    if (autoGenAttemptedRef.current[key]) return;

    autoGenAttemptedRef.current[key] = true;
    void handleGenerateAll();
  }, [
    matches,
    brand.name,
    campaign.channels?.length,
    draftsByCreator,
    outreach.items,
    handleGenerateAll,
    entryAllowed,
  ]);

  const handleSendMatch = async (match: MatchResult) => {
    const { subject: subj, body: bod } = draftForMatch(match);

    setSendFeedbackTarget(match.creator.id);
    setSendingCreatorId(match.creator.id);
    setSendStatus("sending");
    setStatusMessage(`Sending to ${match.creator.name}…`);

    try {
      const recipient =
        channel === "linkedin"
          ? (recipientUrlByCreatorId[match.creator.id]?.trim() ||
              defaultLinkedInRecipientFromMatch(match))
          : match.creator.handle;

      const response = await fetch("/api/send-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          creatorId: match.creator.id,
          creatorName: match.creator.name,
          recipient,
          subject: channel === "email" ? subj : undefined,
          body: bod,
        }),
      });
      const result = (await response.json()) as SendOutreachResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Failed to send outreach.");
      }

      const sentAt = new Date().toISOString();

      persistPitchToStore(match, subj, bod, "sent", sentAt);
      setSendStatus("sent");
      setStatusMessage(
        result.message ||
          "Sent means the adapter returned successfully, not confirmed delivery."
      );
    } catch (error) {
      setSendStatus("failed");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to send outreach."
      );
    } finally {
      setSendingCreatorId(null);
    }
  };

  const handleSendAll = async () => {
    if (matches.length === 0) return;

    setSendFeedbackTarget("batch");
    setBatchSending(true);
    setSendStatus("sending");
    setStatusMessage("Sending batch…");

    const lines: string[] = [];
    let sent = 0;

    try {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const draft =
          draftsByCreator[match.creator.id] ??
          outreach.items.find((it) => it.pitch.creatorId === match.creator.id)
            ?.pitch;
        const subj = draft?.subject ?? "";
        const bod = draft?.body ?? "";

        setStatusMessage(`Sending ${i + 1}/${matches.length}…`);

        if (!bod.trim()) {
          lines.push(`${match.creator.name}: skipped (no draft)`);
          continue;
        }
        if (channel === "email" && !subj.trim()) {
          lines.push(`${match.creator.name}: skipped (email needs subject)`);
          continue;
        }

        const recipient =
          channel === "linkedin"
            ? (recipientUrlByCreatorId[match.creator.id]?.trim() ||
                defaultLinkedInRecipientFromMatch(match))
            : match.creator.handle;

        if (
          channel === "linkedin" &&
          !isLikelyLinkedInProfileUrl(recipient.trim())
        ) {
          lines.push(`${match.creator.name}: skipped (no valid LinkedIn URL)`);
          continue;
        }

        try {
          const response = await fetch("/api/send-outreach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel,
              creatorId: match.creator.id,
              creatorName: match.creator.name,
              recipient,
              subject: channel === "email" ? subj : undefined,
              body: bod,
            }),
          });
          const result = (await response.json()) as SendOutreachResponse;
          if (!response.ok || !result.ok) {
            lines.push(
              `${match.creator.name}: ${result.message || "send failed"}`
            );
            continue;
          }
          persistPitchToStore(match, subj, bod, "sent", new Date().toISOString());
          sent += 1;
        } catch (e) {
          lines.push(
            `${match.creator.name}: ${e instanceof Error ? e.message : "error"}`
          );
        }

        await new Promise((r) => setTimeout(r, 350));
      }

      setStatusMessage(
        `Batch finished: ${sent} sent. ${lines.length ? lines.slice(0, 6).join(" · ") : ""}`
      );
      setSendStatus(sent > 0 ? "sent" : "failed");
    } finally {
      setBatchSending(false);
    }
  };

  const handleCopyDraftForMatch = async (match: MatchResult) => {
    const { subject: subj, body: bod } = draftForMatch(match);
    if (!bod.trim()) return;

    const text =
      channel === "email" && subj.trim() ? `${subj}\n\n${bod}` : bod;

    try {
      await navigator.clipboard.writeText(text);
      setSendFeedbackTarget(match.creator.id);
      setSendStatus("idle");
      setStatusMessage(`Draft for ${match.creator.name} copied to clipboard.`);
    } catch {
      setSendFeedbackTarget(match.creator.id);
      setSendStatus("failed");
      setStatusMessage("Could not copy the draft to clipboard.");
    }
  };

  const canSendMatch = (match: MatchResult) => {
    const { subject: subj, body: bod } = draftForMatch(match);
    if (!bod.trim()) return false;
    if (channel === "email" && !subj.trim()) return false;
    if (channel === "linkedin") {
      const u =
        recipientUrlByCreatorId[match.creator.id]?.trim() ||
        defaultLinkedInRecipientFromMatch(match);
      return isLikelyLinkedInProfileUrl(u);
    }
    return true;
  };

  const canSendAll =
    matches.length > 0 && matches.every((m) => canSendMatch(m));

  const sendDisabled =
    batchGenerating || batchSending || sendingCreatorId !== null;

  if (!entryAllowed) {
    return null;
  }

  return (
    <>
      <PitchGeneratingOverlay
        visible={batchGenerating}
        progress={genProgress}
        creatorNames={matches.map((m) => m.creator.name)}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          color: "#171717",
        }}
      >
        <section
          className="panel"
          style={{
            position: "relative",
            zIndex: 2,
            backgroundColor: "var(--surface, #ffffff)",
            color: "var(--text, #171717)",
          }}
        >
          {matches.length === 0 ? (
            <div
              role="status"
              style={{
                marginBottom: "1.25rem",
                padding: "1rem 1.25rem",
                borderRadius: "16px",
                border: "1px solid rgba(23, 23, 23, 0.12)",
                background: "rgba(200, 240, 26, 0.15)",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.35rem" }}>
                No matched creators yet
              </strong>
              Finish{" "}
              <Link href="/funnel/step4-matching">
                <strong>Step 4 · Creator matching</strong>
              </Link>{" "}
              so your match list is filled, or{" "}
              <Link href="/funnel/step5-outreach/prepare">
                <strong>load your session</strong>
              </Link>{" "}
              if your campaign data is ready on the server.
            </div>
          ) : null}

          <div className="panel-header">
            <div>
              <h2>Send a customized message</h2>
              <p>
                Drafts are generated from your campaign context when you open this
                step. Edit each message below, then use{" "}
                <strong>Send single</strong> on a card or{" "}
                <strong>Send all</strong> under the creator list.
              </p>
            </div>
          </div>

          {matches.length > 0 ? (
          <div className="outreach-grid">
            <div>
              <InfluencerSelector
                matches={matches}
                selectedCreatorId={activeCreatorId}
                onSelect={handleSelectMatch}
              />

              <div style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: "100%" }}
                  disabled={!canSendAll || sendDisabled}
                  onClick={() => void handleSendAll()}
                >
                  {batchSending ? "Sending all…" : "Send all"}
                </button>
                <p
                  className="hint"
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.82rem",
                    lineHeight: 1.45,
                  }}
                >
                  Sends every creator with a ready draft and valid recipient. Rows
                  missing body, email subject, or LinkedIn URL are skipped.
                </p>
                {(batchSending ||
                  batchGenerating ||
                  (sendFeedbackTarget === "batch" &&
                    (sendStatus !== "idle" || Boolean(statusMessage)))) && (
                  <SendStatusBanner
                    variant="inline"
                    status={
                      batchSending
                        ? "sending"
                        : batchGenerating
                          ? statusMessage
                            ? "idle"
                            : "sending"
                          : sendStatus
                    }
                    message={statusMessage}
                  />
                )}
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <ChannelSelector
                  channel={channel}
                  onChannelChange={handleChannelChange}
                />
              </div>

              <div style={{ marginTop: "1.25rem" }}>
                <label className="form-label" htmlFor="field-company">
                  Company / product
                </label>
                <input
                  id="field-company"
                  type="text"
                  readOnly
                  value={brand.name}
                  placeholder="From your brand profile"
                  aria-readonly
                />

                <label
                  className="form-label"
                  htmlFor="field-product"
                  style={{ marginTop: "1rem" }}
                >
                  Value prop (one line)
                </label>
                <input
                  id="field-product"
                  type="text"
                  value={valueProp}
                  placeholder="What your AI agent delivers…"
                  onChange={(e) => setValueProp(e.target.value)}
                  autoComplete="off"
                />

                <label
                  className="form-label"
                  htmlFor="field-sender"
                  style={{ marginTop: "1rem" }}
                >
                  Sender name
                </label>
                <input
                  id="field-sender"
                  type="text"
                  value={senderName}
                  placeholder="Alex from Partnerships"
                  onChange={(e) => setSenderName(e.target.value)}
                  autoComplete="name"
                />

                <label
                  className="form-label"
                  htmlFor="field-collab"
                  style={{ marginTop: "1rem" }}
                >
                  Collaboration type
                </label>
                <select
                  id="field-collab"
                  value={collaborationType}
                  onChange={(e) => setCollaborationType(e.target.value)}
                >
                  {COLLAB_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              className="ai-panel"
              style={{
                background:
                  "linear-gradient(160deg, rgba(200, 240, 26, 0.2) 0%, #ffffff 45%)",
                border: "1px solid #e8e8e4",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                <span aria-hidden="true">
                  ✦
                </span>
                Drafts
              </h3>
              <p className="hint" style={{ marginBottom: "1.25rem" }}>
                One preview per creator. LinkedIn URLs are prefilled from matching
                when possible.
              </p>

              {matches.map((match, index) => {
                const idSuffix = match.creator.id.replace(
                  /[^a-zA-Z0-9_-]/g,
                  "-"
                );
                const draft = draftForMatch(match);
                const sendingThis = sendingCreatorId === match.creator.id;
                const isLast = index === matches.length - 1;

                return (
                  <div
                    key={match.creator.id}
                    id={`pitch-card-${match.creator.id}`}
                    style={{
                      marginBottom: isLast ? 0 : "1.5rem",
                      paddingBottom: isLast ? 0 : "1.5rem",
                      borderBottom: isLast
                        ? "none"
                        : "1px solid var(--border, #e8e8e4)",
                    }}
                  >
                    <h4
                      style={{
                        marginTop: 0,
                        marginBottom: "0.75rem",
                        fontSize: "1.05rem",
                      }}
                    >
                      {match.creator.name}
                    </h4>

                    {channel === "linkedin" ? (
                      <div style={{ marginBottom: "1rem" }}>
                        <label
                          className="form-label"
                          htmlFor={`linkedin-url-${idSuffix}`}
                        >
                          LinkedIn profile URL
                        </label>
                        <input
                          id={`linkedin-url-${idSuffix}`}
                          type="url"
                          inputMode="url"
                          autoComplete="url"
                          placeholder="https://www.linkedin.com/in/username"
                          value={
                            recipientUrlByCreatorId[match.creator.id] ?? ""
                          }
                          onChange={(e) =>
                            setRecipientUrlByCreatorId((prev) => ({
                              ...prev,
                              [match.creator.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}

                    <PitchEditor
                      htmlIdSuffix={idSuffix}
                      channel={channel}
                      subject={draft.subject}
                      body={draft.body}
                      disabled={batchGenerating || batchSending}
                      onSubjectChange={(s) =>
                        handleSubjectChangeForMatch(match, s)
                      }
                      onBodyChange={(b) =>
                        handleBodyChangeForMatch(match, b)
                      }
                    />

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginTop: "1rem",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={!canSendMatch(match) || sendDisabled}
                        onClick={() => void handleSendMatch(match)}
                      >
                        {sendingThis ? "Sending…" : "Send single"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={
                          !draft.body.trim() ||
                          batchGenerating ||
                          batchSending
                        }
                        onClick={() => void handleCopyDraftForMatch(match)}
                      >
                        Copy draft
                      </button>
                    </div>
                    {(sendingCreatorId === match.creator.id ||
                      (sendFeedbackTarget === match.creator.id &&
                        (sendStatus !== "idle" ||
                          Boolean(statusMessage)))) && (
                      <SendStatusBanner
                        variant="inline"
                        status={
                          sendingCreatorId === match.creator.id
                            ? "sending"
                            : sendStatus
                        }
                        message={statusMessage}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          ) : null}
        </section>

        <StepNav nextLabel="Launch Campaign" variant="gofamous" />
      </div>
    </>
  );
}
