"use client";

import { useEffect } from "react";

const STYLE_ID = "gofamous-marketing-css";
const FONT_ID = "gofamous-font-dm-sans";

/**
 * Injects `/gofamous/css/styles.css` + DM Sans so Step pages can use the same
 * classes as static `public/gofamous/*.html` (panel, outreach-grid, btn, …).
 * Removed on unmount so other routes are unaffected.
 */
export function GofamousStylesLoader() {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const link = document.createElement("link");
      link.id = STYLE_ID;
      link.rel = "stylesheet";
      link.href = "/gofamous/css/styles.css";
      document.head.appendChild(link);
    }

    if (!document.getElementById(FONT_ID)) {
      const font = document.createElement("link");
      font.id = FONT_ID;
      font.rel = "stylesheet";
      font.href =
        "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(font);
    }

    return () => {
      /* Keep sheets mounted: React Strict Mode remount would otherwise flash unstyled UI. */
    };
  }, []);

  return null;
}
