export function normalizeTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[《》「」『』“”"'`]/g, "")
    .replace(/\s+/g, "")
    .replace(/[·•・，,。.!！?？:：;；\-_/\\()[\]{}【】]/g, "");
}

export function getMatchStatus(matchedNovelNames) {
  return matchedNovelNames ? "matched" : "unmatched";
}
