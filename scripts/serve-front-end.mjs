/**
 * Serves FrontEnd/ on 127.0.0.1 — no npx/serve dependency (avoids env-specific failures).
 * Usage: npm run landing
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "FrontEnd");
const PORT = Number(process.env.LANDING_PORT) || 4173;
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath.split("?")[0] || "/").replace(/^\/+/, ""));
  const segments = decoded.split("/").filter((s) => s && s !== "..");
  return path.join(ROOT, ...segments);
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }

  try {
    let filePath = req.url === "/" ? path.join(ROOT, "index.html") : safePath(req.url);

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      res.writeHead(404).end("Not found");
      return;
    }

    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      try {
        await fs.access(filePath);
      } catch {
        res.writeHead(404).end("Not found");
        return;
      }
    }

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    if (req.method === "HEAD") {
      res.writeHead(200).end();
      return;
    }
    res.writeHead(200).end(data);
  } catch {
    res.writeHead(500).end("Server error");
  }
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("  GoFamous static UI (FrontEnd/index.html)");
  console.log(`  → http://${HOST}:${PORT}/`);
  console.log("");
});
