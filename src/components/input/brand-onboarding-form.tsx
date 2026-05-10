"use client";

import { INDUSTRY_OPTIONS } from "@/lib/constants";
import { normalizeWebsiteUrl } from "@/components/input/brand-validation";
import { useFunnelStore, type BrandSlice } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { TagField } from "@/components/input/tag-field";

export function BrandOnboardingForm() {
  const brand = useFunnelStore((s) => s.brand);
  const setBrand = useFunnelStore((s) => s.setBrand);

  const b = brand;
  const socials = b.socials ?? {};

  const patch = (partial: Partial<BrandSlice>) => setBrand(partial);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Brand identity</h3>
        <div className="grid gap-2">
          <Label htmlFor="brand-name">Primary brand name</Label>
          <Input
            id="brand-name"
            value={b.name}
            placeholder="e.g. Acme Labs"
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>
        <TagField
          id="brand-aliases"
          label="Other brand or product names"
          description="Alternate spellings, sub-brands, or products to match."
          placeholder="Add a name and press Enter"
          values={b.brandAliases ?? []}
          onChange={(brandAliases) => patch({ brandAliases })}
        />
        <div className="grid gap-2">
          <Label htmlFor="brand-url">Company website</Label>
          <Input
            id="brand-url"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={b.url}
            placeholder="https://yourcompany.com"
            onChange={(e) => patch({ url: e.target.value })}
            onBlur={(e) =>
              patch({ url: normalizeWebsiteUrl(e.currentTarget.value) })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="brand-industry">Industry</Label>
          <select
            id="brand-industry"
            className={cn(
              "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-8 w-full rounded-lg border px-2.5 py-1 text-sm shadow-none transition-colors outline-none focus-visible:ring-3 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              !b.industry && "text-muted-foreground"
            )}
            value={b.industry}
            onChange={(e) => patch({ industry: e.target.value })}
          >
            <option value="">Select industry…</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <h3 className="text-sm font-medium">Discovery signals</h3>
        <TagField
          id="brand-hashtags"
          label="Brand hashtags"
          description="Hashtags your audience or creators use when talking about you."
          variant="hashtag"
          placeholder="#launch — press Enter to add"
          values={b.hashtags ?? []}
          onChange={(hashtags) => patch({ hashtags })}
        />
        <TagField
          id="brand-keywords"
          label="Keywords & topics"
          description="Themes, categories, or phrases that describe your positioning."
          placeholder="e.g. API-first, developer tools"
          values={b.keywords ?? []}
          onChange={(keywords) => patch({ keywords })}
        />
        <div className="grid gap-2">
          <Label htmlFor="target-audience">Target audience</Label>
          <Textarea
            id="target-audience"
            value={b.targetAudience}
            placeholder="Who you sell to, regions, company size, roles…"
            rows={4}
            onChange={(e) => patch({ targetAudience: e.target.value })}
          />
        </div>
      </section>

      <Separator />

      <section className="grid gap-4">
        <div>
          <h3 className="text-sm font-medium">Social profiles</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Optional — helps matching creators on the same platforms.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="soc-tw">X (Twitter)</Label>
            <Input
              id="soc-tw"
              value={socials.twitter ?? ""}
              placeholder="@handle"
              onChange={(e) =>
                patch({
                  socials: { ...socials, twitter: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="soc-yt">YouTube</Label>
            <Input
              id="soc-yt"
              value={socials.youtube ?? ""}
              placeholder="Channel URL or @handle"
              onChange={(e) =>
                patch({
                  socials: { ...socials, youtube: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="soc-li">LinkedIn</Label>
            <Input
              id="soc-li"
              value={socials.linkedin ?? ""}
              placeholder="Company page URL"
              onChange={(e) =>
                patch({
                  socials: { ...socials, linkedin: e.target.value || undefined },
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="soc-web">Marketing site (if different)</Label>
            <Input
              id="soc-web"
              value={socials.website ?? ""}
              placeholder="Optional landing page"
              onChange={(e) =>
                patch({
                  socials: { ...socials, website: e.target.value || undefined },
                })
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
