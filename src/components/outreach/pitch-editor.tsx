"use client";

import type { OutreachChannel } from "@/lib/outreach";

interface PitchEditorProps {
  channel: OutreachChannel;
  subject: string;
  body: string;
  disabled?: boolean;
  /** Suffix for input ids (e.g. creator id) so multiple editors can coexist. */
  htmlIdSuffix?: string;
  onSubjectChange: (subject: string) => void;
  onBodyChange: (body: string) => void;
}

export function PitchEditor({
  channel,
  subject,
  body,
  disabled = false,
  htmlIdSuffix = "",
  onSubjectChange,
  onBodyChange,
}: PitchEditorProps) {
  const showSubject = channel === "email";
  const suf = htmlIdSuffix ? `-${htmlIdSuffix}` : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {showSubject && (
        <div>
          <label className="form-label" htmlFor={`pitch-subject${suf}`}>
            Subject
          </label>
          <input
            id={`pitch-subject${suf}`}
            type="text"
            value={subject}
            placeholder="A short collaboration subject line"
            disabled={disabled}
            onChange={(e) => onSubjectChange(e.target.value)}
            autoComplete="off"
          />
        </div>
      )}
      <div>
        <label className="form-label" htmlFor={`pitch-body${suf}`}>
          Body
        </label>
        <textarea
          id={`pitch-body${suf}`}
          value={body}
          placeholder="Draft appears here after generation; edit before sending."
          className="draft-output"
          disabled={disabled}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={12}
          style={{ minHeight: "220px" }}
        />
      </div>
    </div>
  );
}
