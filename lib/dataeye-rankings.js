export const DATAEYE_RANK_TYPE_MAX = 20;

export const DATAEYE_RANK_TYPE_NAMES = {
  0: "漫剧热播榜",
  1: "动态漫榜",
  2: "沙雕漫榜",
  3: "真人AI榜"
};

export const DATAEYE_PERIODS = ["day", "week", "month"];

export const DATAEYE_PERIOD_LABELS = {
  day: "日榜",
  week: "周榜",
  month: "月榜"
};

export function getDataEyeRankTypeName(rankType) {
  const number = Number(rankType);
  return DATAEYE_RANK_TYPE_NAMES[number] || `未命名榜单 rankType=${number}`;
}

export function normalizeDataEyeRankTypeSelection(value = "0") {
  const text = String(value ?? "0").trim();
  if (!text || text === "0") return [0];
  if (text === "all") {
    return Array.from({ length: DATAEYE_RANK_TYPE_MAX + 1 }, (_, index) => index);
  }

  const number = Number(text);
  if (!Number.isInteger(number) || number < 0 || number > DATAEYE_RANK_TYPE_MAX) {
    throw new Error(`不支持的榜单类型：${value}`);
  }

  return [number];
}

export function normalizeDataEyePeriodSelection(value = "day") {
  const text = String(value ?? "day").trim();
  if (!text || text === "day") return ["day"];
  if (text === "all") return [...DATAEYE_PERIODS];
  if (!DATAEYE_PERIODS.includes(text)) {
    throw new Error(`不支持的榜单周期：${value}`);
  }
  return [text];
}

export function normalizeSingleDataEyeRankPeriod(value = "day") {
  const text = String(value ?? "day").trim() || "day";
  if (!DATAEYE_PERIODS.includes(text)) {
    throw new Error(`不支持的榜单周期：${value}`);
  }
  return text;
}
