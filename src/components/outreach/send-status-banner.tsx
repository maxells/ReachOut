"use client";

import type { SendStatus } from "@/lib/outreach";

interface SendStatusBannerProps {
  status: SendStatus;
  message?: string;
  /** Compact text next to actions — no dashed dev-note frame */
  variant?: "panel" | "inline";
}

export function SendStatusBanner({
  status,
  message,
  variant = "panel",
}: SendStatusBannerProps) {
  if (status === "idle" && !message) {
    return null;
  }

  const labelByStatus: Record<SendStatus, string> = {
    idle: "Ready",
    sending: "Sending…",
    sent: "Sent",
    failed: "Failed",
  };

  const body =
    message ||
    (status === "sent"
      ? "The send adapter returned successfully."
      : "Review drafts and try again.");

  if (variant === "inline") {
    if (status === "idle" && message) {
      return (
        <p
          className="hint"
          role="status"
          style={{
            margin: "0.5rem 0 0",
            fontSize: "0.85rem",
            lineHeight: 1.45,
            color: "var(--text-muted)",
          }}
        >
          {message}
        </p>
      );
    }

    return (
      <div role="status" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
        <strong
          style={{
            display: "block",
            marginBottom: "0.2rem",
            fontSize: "0.8rem",
            color: "var(--text)",
          }}
        >
          {labelByStatus[status]}
        </strong>
        <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
          {body}
        </span>
      </div>
    );
  }

  return (
    <div className="dev-note" style={{ marginTop: "1rem" }}>
      <strong style={{ display: "block", marginBottom: "0.35rem" }}>
        {labelByStatus[status]}
      </strong>
      <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
        {body}
      </span>
    </div>
  );
}
