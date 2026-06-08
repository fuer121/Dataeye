export function isDataEyeMotionComicRequest(request) {
  try {
    const url = new URL(request?.url || "");
    return url.hostname === "playlet-applet.dataeye.com" && url.pathname === "/playlet/motionComic" && url.searchParams.has("rankType");
  } catch {
    return false;
  }
}

export function getDataEyeRequestPeriodValue(request) {
  try {
    const url = new URL(request?.url || "");
    return url.searchParams.get("day") || url.searchParams.get("week") || url.searchParams.get("month") || "";
  } catch {
    return "";
  }
}

export function getDataEyeRequestPeriodKey(request) {
  try {
    const url = new URL(request?.url || "");
    if (url.searchParams.has("day")) return "day";
    if (url.searchParams.has("week")) return "week";
    if (url.searchParams.has("month")) return "month";
    return "";
  } catch {
    return "";
  }
}

export function getDataEyeRequestRankingDate(request) {
  const periodKey = getDataEyeRequestPeriodKey(request);
  const periodValue = getDataEyeRequestPeriodValue(request);

  if (periodKey === "day") {
    return periodValue;
  }

  if (periodKey === "week") {
    const match = String(periodValue).match(/(\d{4}-\d{2}-\d{2})\s*$/);
    return match?.[1] || "";
  }

  if (periodKey === "month") {
    const match = String(periodValue).match(/^(\d{4}-\d{2})$/);
    return match ? `${match[1]}-01` : "";
  }

  return "";
}

export function compareDataEyeMotionComicRequests(a, b) {
  const authDiff = Number(Boolean(b?.headers?.authentication)) - Number(Boolean(a?.headers?.authentication));
  if (authDiff) return authDiff;

  const capturedAtDiff = getCapturedAtValue(b) - getCapturedAtValue(a);
  if (capturedAtDiff) return capturedAtDiff;

  return getDataEyeMotionComicSpecificity(b) - getDataEyeMotionComicSpecificity(a);
}

function getCapturedAtValue(request) {
  const timestamp = Date.parse(request?.startedDateTime || request?.capturedAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getDataEyeMotionComicSpecificity(request) {
  try {
    const url = new URL(request?.url || "");
    let score = 0;
    if (url.searchParams.has("day")) score += 3;
    if (url.searchParams.get("rankType") === "0") score += 2;
    if (url.searchParams.get("pageSize") === "30") score += 1;
    return score;
  } catch {
    return 0;
  }
}
