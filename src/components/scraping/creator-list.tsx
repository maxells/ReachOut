"use client";

import { CreatorCard } from "./creator-card";
import type { MatchResult } from "@/lib/types";

interface CreatorListProps {
  matches: MatchResult[];
  isLoading?: boolean;
}

export function CreatorList({ matches, isLoading }: CreatorListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
        Found {matches.length} matching influencer{matches.length !== 1 ? "s" : ""} on LinkedIn
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match, index) => (
          <CreatorCard key={`${match.creator.id}-${index}`} match={match} />
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-16">
      <div
        className="mx-auto mb-4 w-10 h-10 rounded-full border-4 border-[var(--border)] animate-spin"
        style={{ borderTopColor: "var(--primary)" }}
      />
      <p className="text-lg font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
        Searching LinkedIn...
      </p>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
        AI is generating search queries and finding real influencers
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-lg font-bold" style={{ letterSpacing: "-0.02em" }}>
        No matching influencers found
      </p>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
        Try adjusting your campaign parameters or broadening your target audience
      </p>
    </div>
  );
}
