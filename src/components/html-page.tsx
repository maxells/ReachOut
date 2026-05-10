"use client";

import { useEffect, useState } from "react";

type HtmlPageProps = {
  page: "index" | "brand" | "mentions" | "campaign" | "outreach";
};

const pageRoutes: Record<string, string> = {
  "index.html": "/",
  "brand.html": "/funnel/step1-onboarding",
  "mentions.html": "/funnel/step2-analysis",
  "campaign.html": "/funnel/step3-campaign",
  "outreach.html": "/funnel/step5-outreach",
};

function assetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `/gofamous/${path.replace(/^\.\//, "")}`;
}

function rewriteLinks(root: HTMLElement) {
  root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href) return;

    const [path, suffix = ""] = href.split(/(?=[?#])/);
    const route = pageRoutes[path];

    if (route) {
      anchor.setAttribute("href", `${route}${suffix}`);
    }
  });
}

function syncBodyClass(bodyClass: string) {
  const managed = ["landing-page", "has-landing-splash"];

  managed.forEach((className) => {
    document.body.classList.remove(className);
  });

  bodyClass
    .split(/\s+/)
    .filter(Boolean)
    .forEach((className) => {
      document.body.classList.add(className);
    });
}

function ensureStyles() {
  if (document.querySelector('link[data-gofamous-style="true"]')) return;

  const fontPreconnect = document.createElement("link");
  fontPreconnect.rel = "preconnect";
  fontPreconnect.href = "https://fonts.googleapis.com";
  fontPreconnect.dataset.gofamousStyle = "true";
  document.head.appendChild(fontPreconnect);

  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
  font.dataset.gofamousStyle = "true";
  document.head.appendChild(font);

  const styles = document.createElement("link");
  styles.rel = "stylesheet";
  styles.href = "/gofamous/css/styles.css";
  styles.dataset.gofamousStyle = "true";
  document.head.appendChild(styles);
}

function runScripts(sources: string[]) {
  document
    .querySelectorAll("script[data-gofamous-script='true']")
    .forEach((script) => script.remove());

  return sources.reduce<Promise<void>>((chain, source) => {
    return chain.then(
      () =>
        new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = assetUrl(source);
          script.dataset.gofamousScript = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Unable to load ${source}`));
          document.body.appendChild(script);
        }),
    );
  }, Promise.resolve());
}

export function HtmlPage({ page }: HtmlPageProps) {
  const [markup, setMarkup] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      const response = await fetch(`/gofamous/${page}.html`);
      const html = await response.text();
      if (cancelled) return;

      const documentFromHtml = new DOMParser().parseFromString(
        html,
        "text/html",
      );
      const body = documentFromHtml.body;
      const scripts = [
        ...documentFromHtml.head.querySelectorAll<HTMLScriptElement>(
          "script[src]",
        ),
        ...body.querySelectorAll<HTMLScriptElement>("script[src]"),
      ].map((script) => script.getAttribute("src") || "");

      body.querySelectorAll("script").forEach((script) => script.remove());
      rewriteLinks(body);
      syncBodyClass(body.className);
      ensureStyles();

      setMarkup(body.innerHTML);

      requestAnimationFrame(() => {
        if (!cancelled) {
          void runScripts(scripts).then(() => {
            document.dispatchEvent(new Event("DOMContentLoaded"));
            window.dispatchEvent(new Event("load"));
          });
        }
      });
    }

    void loadPage();

    return () => {
      cancelled = true;
      document
        .querySelectorAll("script[data-gofamous-script='true']")
        .forEach((script) => script.remove());
    };
  }, [page]);

  return (
    <main
      className="gofamous-html-page"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
