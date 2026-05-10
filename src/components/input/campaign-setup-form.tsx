"use client";

import {
  CAMPAIGN_BUDGET_MAX,
  CAMPAIGN_BUDGET_MIN,
  CAMPAIGN_BUDGET_STEP,
  CHANNEL_OPTIONS,
  CREATOR_TONE_OPTIONS,
  FOLLOWER_RANGE_MAX,
  FOLLOWER_RANGE_MIN,
  FOLLOWER_RANGE_PRESETS,
  FOLLOWER_RANGE_STEP,
} from "@/lib/constants";
import { useFunnelStore } from "@/lib/store";
import type { ChannelType } from "@/lib/types";
import {
  cn,
  formatFollowerCount,
  formatUsd,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";

function asSliderArray(value: number | readonly number[]): number[] {
  if (typeof value === "number") return [value];
  return Array.from(value);
}

export function CampaignSetupForm() {
  const campaign = useFunnelStore((s) => s.campaign);
  const setCampaign = useFunnelStore((s) => s.setCampaign);

  const [minFollowers, maxFollowers] = campaign.followerRange;

  const toggleChannel = (ch: ChannelType) => {
    const set = new Set(campaign.channels);
    if (set.has(ch)) set.delete(ch);
    else set.add(ch);
    setCampaign({ channels: Array.from(set) });
  };

  const onFollowerSlider = (value: number | readonly number[]) => {
    const values = asSliderArray(value);
    if (values.length < 2) return;
    const [a, b] = values;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    setCampaign({ followerRange: [lo, hi] });
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">Campaign budget</h3>
            <p className="text-muted-foreground mt-1 text-xs">
              Total planned spend for creator partnerships (USD).
            </p>
          </div>
          <p className="text-lg font-semibold tabular-nums">
            {formatUsd(campaign.budget)}
          </p>
        </div>
        <Slider
          min={CAMPAIGN_BUDGET_MIN}
          max={CAMPAIGN_BUDGET_MAX}
          step={CAMPAIGN_BUDGET_STEP}
          value={[campaign.budget]}
          onValueChange={(v) => {
            const arr = asSliderArray(v);
            const n = arr[0];
            if (typeof n === "number") setCampaign({ budget: n });
          }}
        />
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>{formatUsd(CAMPAIGN_BUDGET_MIN)}</span>
          <span>{formatUsd(CAMPAIGN_BUDGET_MAX)}</span>
        </div>
      </section>

      <Separator />

      <section className="grid gap-3">
        <div>
          <h3 className="text-sm font-medium">Channels</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Where should creators reach your audience? Pick one or more.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_OPTIONS.map(({ value, label }) => {
            const active = campaign.channels.includes(value);
            return (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="rounded-full"
                onClick={() => toggleChannel(value)}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-medium">Creator follower range</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Preferred audience size for matched creators.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FOLLOWER_RANGE_PRESETS.map(({ label, range }) => {
            const matches =
              campaign.followerRange[0] === range[0] &&
              campaign.followerRange[1] === range[1];
            return (
              <Button
                key={label}
                type="button"
                size="sm"
                variant={matches ? "secondary" : "outline"}
                className="rounded-full text-xs"
                onClick={() => setCampaign({ followerRange: range })}
              >
                {label}
              </Button>
            );
          })}
        </div>
        <div className="grid gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Range</span>
            <span className="font-medium tabular-nums">
              {formatFollowerCount(minFollowers)} –{" "}
              {formatFollowerCount(maxFollowers)} followers
            </span>
          </div>
          <Slider
            min={FOLLOWER_RANGE_MIN}
            max={FOLLOWER_RANGE_MAX}
            step={FOLLOWER_RANGE_STEP}
            value={[minFollowers, maxFollowers]}
            onValueChange={onFollowerSlider}
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{formatFollowerCount(FOLLOWER_RANGE_MIN)}</span>
            <span>{formatFollowerCount(FOLLOWER_RANGE_MAX)}</span>
          </div>
        </div>
      </section>

      <Separator />

      <section className="grid gap-3">
        <Label className="text-sm font-medium">Creator tone</Label>
        <p className="text-muted-foreground -mt-1 text-xs">
          The voice and style you want partners to embody.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CREATOR_TONE_OPTIONS.map(({ value, label, description }) => {
              const selected = campaign.creatorTone === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCampaign({ creatorTone: value })}
                  className={cn(
                    "border-input hover:bg-muted/50 rounded-lg border p-3 text-left transition-colors",
                    selected &&
                      "border-primary bg-primary/5 ring-primary ring-2 ring-offset-2"
                  )}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-muted-foreground mt-1 text-xs leading-snug">
                    {description}
                  </p>
                </button>
              );
          })}
        </div>
      </section>
    </div>
  );
}
