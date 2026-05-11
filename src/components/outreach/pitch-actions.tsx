"use client";

import type { OutreachChannel } from "@/lib/outreach";

interface PitchActionsProps {
  channel: OutreachChannel;
  canGenerate: boolean;
  canSend: boolean;
  isGenerating: boolean;
  isSending: boolean;
  onGenerate: () => void;
  onSend: () => void;
  /** Batch: generate pitches for every creator in `matches` */
  canGenerateAll?: boolean;
  canSendAll?: boolean;
  onGenerateAll?: () => void;
  onSendAll?: () => void;
  batchGenerating?: boolean;
  batchSending?: boolean;
}

function sendButtonLabel(
  channel: OutreachChannel,
  isSending: boolean
): string {
  if (isSending) return "Sending…";
  switch (channel) {
    case "linkedin":
      return "Send via LinkedIn";
    case "email":
      return "Send email";
    case "reddit":
      return "Send (Reddit · P0)";
    case "youtube":
      return "Send (YouTube · P0)";
    default:
      return "Send";
  }
}

export function PitchActions({
  channel,
  canGenerate,
  canSend,
  isGenerating,
  isSending,
  onGenerate,
  onSend,
  canGenerateAll = false,
  canSendAll = false,
  onGenerateAll,
  onSendAll,
  batchGenerating = false,
  batchSending = false,
}: PitchActionsProps) {
  const batchBusy = batchGenerating || batchSending;
  const disabledSingle =
    isGenerating || isSending || batchGenerating || batchSending;

  const showBatchRow = Boolean(onGenerateAll || onSendAll);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!canGenerate || disabledSingle}
          onClick={onGenerate}
        >
          {isGenerating ? "Generating…" : "Generate draft"}
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!canSend || disabledSingle}
          onClick={onSend}
        >
          {sendButtonLabel(channel, isSending)}
        </button>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          lineHeight: 1.45,
          maxWidth: "48ch",
        }}
      >
        Single send uses the draft below for the selected creator only.
      </p>

      {showBatchRow ? (
        <div
          style={{
            marginTop: "0.25rem",
            paddingTop: "1rem",
            borderTop: "1px dashed var(--border, #e8e8e4)",
          }}
        >
          <p
            className="form-label"
            style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}
          >
            Batch (all matched creators)
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!canGenerateAll || disabledSingle}
              onClick={onGenerateAll}
            >
              {batchGenerating ? "Generating all…" : "Generate all pitches"}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!canSendAll || disabledSingle}
              onClick={onSendAll}
            >
              {batchSending ? "Sending all…" : "Send all"}
            </button>
          </div>
          <p
            style={{
              margin: "0.5rem 0 0",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              lineHeight: 1.45,
              maxWidth: "52ch",
            }}
          >
            <strong>Send all</strong> runs one request per creator who already has a
            draft, in order, with a short pause between sends. For LinkedIn, each row
            needs a valid profile URL (prefilled from matching when possible). Email
            requires a subject line per draft.
          </p>
          {batchBusy ? (
            <p
              style={{
                margin: "0.5rem 0 0",
                fontSize: "0.82rem",
                color: "var(--text-muted)",
              }}
            >
              Batch is running — keep this tab open until it finishes.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
