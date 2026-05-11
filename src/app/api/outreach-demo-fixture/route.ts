import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse, type NextRequest } from "next/server";

/**
 * Serves bundled outreach session JSON for Step 5 hydration (`/funnel/step5-outreach/prepare`).
 * Resolution order (default GET): OUTREACH_DEMO_FIXTURE_PATH →
 * .context/e2e/outreach-e2e.fixture.local.json →
 * .context/e2e/outreach-e2e.fixture.example.json → public/outreach-demo-fixture.json
 *
 * **GET ?default=1** (or ?source=default) always returns `public/outreach-demo-fixture.json`
 * so the default bundle is not overridden by a local single-creator e2e file.
 *
 * Gated: development only, or OUTREACH_DEMO_FIXTURE=1 (e.g. preview demos).
 */
export async function GET(request: NextRequest) {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.OUTREACH_DEMO_FIXTURE === "1";

  if (!allowed) {
    return NextResponse.json(
      { error: "Demo fixture endpoint disabled." },
      { status: 404 }
    );
  }

  const cwd = process.cwd();
  const source = request.nextUrl.searchParams.get("source");
  const defaultQ = request.nextUrl.searchParams.get("default");

  if (source === "default" || defaultQ === "1") {
    const publicCandidates = [
      join(cwd, "public/outreach-demo-fixture.json"),
      join(cwd, "ReachOut/public/outreach-demo-fixture.json"),
    ];
    for (const publicPath of publicCandidates) {
      if (!existsSync(publicPath)) continue;
      try {
        const raw = readFileSync(publicPath, "utf8");
        const data = JSON.parse(raw) as unknown;
        return NextResponse.json(data);
      } catch {
        return NextResponse.json(
          { error: `Invalid JSON in fixture: ${publicPath}` },
          { status: 500 }
        );
      }
    }
    return NextResponse.json(
      { error: "public/outreach-demo-fixture.json not found (check project cwd)." },
      { status: 404 }
    );
  }

  const candidates = [
    process.env.OUTREACH_DEMO_FIXTURE_PATH?.trim(),
    join(cwd, ".context/e2e/outreach-e2e.fixture.local.json"),
    join(cwd, ".context/e2e/outreach-e2e.fixture.example.json"),
    join(cwd, "public/outreach-demo-fixture.json"),
  ].filter((p): p is string => Boolean(p));

  for (const filepath of candidates) {
    if (!existsSync(filepath)) continue;
    try {
      const raw = readFileSync(filepath, "utf8");
      const data = JSON.parse(raw) as unknown;
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        { error: `Invalid JSON in fixture: ${filepath}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      error:
        "No outreach fixture file found. Add .context/e2e/outreach-e2e.fixture.local.json or public/outreach-demo-fixture.json.",
    },
    { status: 404 }
  );
}
