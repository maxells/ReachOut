"use client";

import type { MatchResult } from "@/lib/types";

interface InfluencerSelectorProps {
  matches: MatchResult[];
  selectedCreatorId?: string;
  onSelect: (match: MatchResult) => void;
}

export function InfluencerSelector({
  matches,
  selectedCreatorId,
  onSelect,
}: InfluencerSelectorProps) {
  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <strong>No creators yet</strong>
        Complete creator matching (step 4), then compose outreach here.
      </div>
    );
  }

  return (
    <div>
      <label className="form-label" htmlFor="outreach-kol-nav">
        Creator
      </label>
      <p
        style={{
          marginTop: 0,
          marginBottom: "0.75rem",
          fontSize: "0.95rem",
          color: "var(--text-muted)",
          fontWeight: 400,
          lineHeight: 1.5,
        }}
      >
        Pick one to edit their draft. Batch actions use everyone in this list.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {matches.map((match) => {
          const { creator } = match;
          const selected = selectedCreatorId === creator.id;

          return (
            <button
              key={creator.id}
              id={
                selected ? "outreach-kol-nav" : undefined
              }
              type="button"
              className="pipeline-item"
              style={{
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                borderLeftWidth: "3px",
                borderLeftColor: selected ? "var(--accent)" : undefined,
                boxShadow: selected ? "var(--shadow-soft)" : undefined,
              }}
              onClick={() => onSelect(match)}
            >
              <span style={{ fontWeight: 700, color: "var(--text)" }}>
                {creator.name}
              </span>
              <span>
                {match.matchScore}% fit · {creator.followers.toLocaleString()}{" "}
                followers · {creator.platform}
              </span>
              <span style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                {match.reasoning}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
