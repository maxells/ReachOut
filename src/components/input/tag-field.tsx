"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type TagFieldVariant = "plain" | "hashtag";

function normalizeToken(raw: string, variant: TagFieldVariant): string | null {
  let t = raw.trim();
  if (!t) return null;
  if (variant === "hashtag") {
    t = t.replace(/^#+/, "");
    if (!t) return null;
    return t.toLowerCase();
  }
  return t;
}

function displayToken(token: string, variant: TagFieldVariant): string {
  if (variant === "hashtag") return `#${token}`;
  return token;
}

interface TagFieldProps {
  id: string;
  label: string;
  description?: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  variant?: TagFieldVariant;
  className?: string;
}

export function TagField({
  id,
  label,
  description,
  values,
  onChange,
  placeholder = "Type and press Enter",
  variant = "plain",
  className,
}: TagFieldProps) {
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commitTokens = (raw: string) => {
    const parts = raw.split(/[,;\n]/).map((s) => normalizeToken(s, variant));
    const next = parts.filter((p): p is string => p !== null);
    if (next.length === 0) return;
    const merged = [...values];
    for (const t of next) {
      if (!merged.includes(t)) merged.push(t);
    }
    onChange(merged);
    setDraft("");
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTokens(draft);
      return;
    }
    if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        ) : null}
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((token, i) => (
            <Badge
              key={`${token}-${i}`}
              variant="secondary"
              className="gap-1 pr-1 pl-2 font-normal"
            >
              {displayToken(token, variant)}
              <button
                type="button"
                className="hover:bg-muted -mr-0.5 rounded-full p-0.5"
                aria-label={`Remove ${displayToken(token, variant)}`}
                onClick={() => removeAt(i)}
              >
                <X className="size-3 opacity-70" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <Input
        ref={inputRef}
        id={id}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) commitTokens(draft);
        }}
      />
    </div>
  );
}
