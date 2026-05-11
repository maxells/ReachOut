"use client";

import { OUTREACH_CHANNELS, type OutreachChannel } from "@/lib/outreach";

interface ChannelSelectorProps {
  channel: OutreachChannel;
  onChannelChange: (channel: OutreachChannel) => void;
}

export function ChannelSelector({
  channel,
  onChannelChange,
}: ChannelSelectorProps) {
  return (
    <div>
      <p className="form-label" style={{ marginBottom: "0.65rem" }}>
        Send channel
      </p>
      <div className="toolbar">
        {OUTREACH_CHANNELS.map((option) => {
          const selected = option.value === channel;
          return (
            <button
              key={option.value}
              type="button"
              className={
                selected ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"
              }
              onClick={() => onChannelChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
