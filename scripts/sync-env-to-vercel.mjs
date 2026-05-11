#!/usr/bin/env node
/**
 * Pushes keys from .env.local into a linked Vercel project (never commits keys).
 *
 * Prereqs:
 *   1. npx vercel login
 *   2. npx vercel link   (creates .vercel/project.json — gitignored)
 *
 * Usage:
 *   node scripts/sync-env-to-vercel.mjs
 *   npm run vercel:sync-env
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

/** Keys this app reads at runtime (add more if you use them in .env.local). */
const KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "CLOD_API_KEY",
  "APIFY_API_TOKEN",
  "HEYREACH_API_KEY",
  "HEYREACH_API_BASE_URL",
  "HEYREACH_LINKEDIN_ACCOUNT_ID",
  "HEYREACH_SEQUENCE_FIRST_DELAY_HOURS",
  "OUTREACH_SEND_MODE",
];

/** Vercel targets so Preview + Production builds both get secrets. */
const TARGETS = ["production", "preview"];

function parseEnvFile(raw) {
  const out = {};
  for (let line of raw.split("\n")) {
    line = line.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).replace(/\\n/g, "\n");
    }
    out[k] = v;
  }
  return out;
}

function main() {
  if (!fs.existsSync(path.join(root, ".vercel", "project.json"))) {
    console.error(
      "Missing .vercel/project.json — run:  npx vercel link\n" +
        "(from the repo root; .vercel stays local and is gitignored)."
    );
    process.exit(1);
  }

  if (!fs.existsSync(envPath)) {
    console.error(`Missing ${path.relative(root, envPath)} — copy .env.local.example and fill keys.`);
    process.exit(1);
  }

  const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));
  let pushed = 0;

  for (const key of KEYS) {
    const value = env[key];
    if (value === undefined || value === "") continue;

    for (const target of TARGETS) {
      const r = spawnSync(
        "npx",
        [
          "vercel",
          "env",
          "add",
          key,
          target,
          "--value",
          value,
          "--yes",
          "--force",
        ],
        {
          cwd: root,
          stdio: "inherit",
          env: { ...process.env },
        }
      );
      if (r.status !== 0) {
        console.error(`Failed: vercel env add ${key} ${target}`);
        process.exit(r.status ?? 1);
      }
      pushed++;
    }
  }

  if (pushed === 0) {
    console.warn(
      "No overlapping keys pushed. Check .env.local contains at least one of:\n  " +
        KEYS.join(", ")
    );
    process.exit(2);
  }

  console.log(`Done. Upserted ${pushed} Vercel env slot(s) across targets: ${TARGETS.join(", ")}.`);
}

main();
