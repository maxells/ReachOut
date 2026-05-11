/**
 * Strip emoji / pictographs from scraped social display strings so cards don’t show
 * random symbols (LinkedIn bios often suffix decorative emoji).
 */
export function stripEmojiPictographs(input: string): string {
  if (!input) return input;
  return input
    .replace(/\ufe0f/g, "") // variation selector (vs16)
    .replace(/\u200d/g, "") // zero-width joiner
    .replace(/\p{Extended_Pictographic}/gu, "") // emoji & pictographs
    .replace(/\xa0/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");
}
