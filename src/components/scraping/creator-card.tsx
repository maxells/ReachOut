"use client";

import { stripEmojiPictographs } from "@/lib/sanitize-display";
import type { MatchResult } from "@/lib/types";

interface CreatorCardProps {
  match: MatchResult;
}

export function CreatorCard({ match }: CreatorCardProps) {
  const { creator, matchScore, reasoning } = match;
  const displayName = stripEmojiPictographs(creator.name);
  const displayBio = stripEmojiPictographs(creator.bio ?? "");

  const initials = initialsFromDisplayName(displayName);

  return (
    <div
      className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 flex flex-col gap-3.5 transition-all duration-200 hover:-translate-y-1"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 8px 40px rgba(0,0,0,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 24px rgba(0,0,0,0.06)";
      }}
    >
      {/* Top: Avatar + Name + Score */}
      <div className="flex gap-3.5 items-start">
        <div
          className="w-12 h-12 rounded-[var(--radius-sm)] flex-shrink-0 grid place-items-center font-bold text-sm"
          style={{
            background: "linear-gradient(145deg, var(--secondary), #e0e0da)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className="font-bold text-base tracking-tight truncate"
              style={{ letterSpacing: "-0.02em" }}
            >
              {displayName}
            </h3>
            <ScoreBadge score={matchScore} />
          </div>
          <p
            className="text-sm font-medium mt-0.5 truncate"
            style={{ color: "var(--foreground)" }}
          >
            {displayBio}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: "var(--foreground)", color: "var(--card)" }}
        >
          LinkedIn
        </span>
        {creator.niche.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(200,240,26,0.2)",
              color: "var(--foreground)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Why match — contrast on badge + softer left accent (avoid dark-bar glitch) */}
      <div className="rounded-[14px] border border-[var(--border)] bg-muted p-3.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:items-start">
          <span
            className="flex-shrink-0 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            Why
          </span>
          <p
            className="text-xs leading-relaxed flex-1 min-w-0"
            style={{ color: "var(--muted-foreground)" }}
          >
            {reasoning}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-3.5 border-t border-[var(--border)]">
        <Stat label="Connections" value={creator.followers > 0 ? formatNumber(creator.followers) : "—"} />
        <Stat label="Score" value={`${matchScore}/100`} />
        <Stat label="Platform" value="LinkedIn" />
      </div>

      {/* Action */}
      <a
        href={creator.handle}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-full border border-[var(--border)] bg-white transition-all hover:bg-[var(--secondary)]"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        View LinkedIn Profile →
      </a>
    </div>
  );
}

function initialsFromDisplayName(name: string): string {
  const s = stripEmojiPictographs(name).trim();
  const parts = s.split(/\s+/).filter(Boolean);
  const firstChars = (w: string) => {
    const g = [...(w.normalize("NFC") || "?")];
    return g.find((ch) => !/\s/.test(ch)) ?? "?";
  };
  if (parts.length >= 2) {
    return `${firstChars(parts[0])}${firstChars(parts[parts.length - 1])}`.toUpperCase();
  }
  const chars = [...(parts[0] || "").normalize("NFC")].filter((c) => !/\s/.test(c)).slice(0, 2);
  return chars.length ? chars.join("").toUpperCase() : "?";
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <span
        className="text-sm font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: "var(--primary)",
          color: "var(--primary-foreground)",
        }}
      >
        {score}%
      </span>
    );
  }

  const bg =
    score >= 60 ? "rgba(200,240,26,0.22)" : "var(--muted)";
  const color = score >= 60 ? "var(--foreground)" : "var(--muted-foreground)";

  return (
    <span
      className="text-sm font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
      style={{ background: bg, color }}
    >
      {score}%
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-bold tabular-nums">{value}</div>
      <div className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}
