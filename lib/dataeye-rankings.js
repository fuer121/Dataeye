export const DATAEYE_LEGACY_RANK_TYPE_NAMES = {
  0: "漫剧热播榜",
  1: "动态漫榜",
  2: "真人AI榜",
  3: "沙雕漫榜"
};

export const DATAEYE_RANKING_DEFINITIONS = [
  {
    rankType: 119,
    rankId: "hongguoAnimation",
    name: "红果漫剧榜",
    path: "/playlet/getComicsPlayletByDate",
    fixedParams: { type: "1" },
    periods: ["day"],
    heatFields: ["hotValueText", "hotValue"],
    typeFields: ["contentTypes", "playletTags"]
  },
  {
    rankType: 101,
    rankId: "hot",
    name: "热力榜",
    path: "/playlet/listHotRanking",
    dayOffset: -1,
    periods: ["day", "week", "month"],
    heatFields: ["consumeNum", "totalConsumeNum"],
    typeFields: ["playletTags"]
  },
  {
    rankType: 103,
    rankId: "DYHotPlay",
    name: "抖音热播",
    path: "/playlet/selectNativePlayletPlayCountListByDate",
    periods: ["day", "week", "month"],
    heatFields: ["playCountAdd", "playCount"],
    typeFields: ["tags"]
  },
  {
    rankType: 106,
    rankId: "hongguo",
    name: "红果榜",
    path: "/playlet/listHongGuoRanking",
    periods: ["day", "week", "month"],
    heatFields: ["hotValue", "hotValueText"],
    typeFields: ["contentTypes"]
  }
];

export const DATAEYE_ACTIVE_RANK_TYPES = DATAEYE_RANKING_DEFINITIONS.map((item) => item.rankType);

export const DATAEYE_RANK_TYPE_NAMES = {
  ...DATAEYE_LEGACY_RANK_TYPE_NAMES,
  ...Object.fromEntries(DATAEYE_RANKING_DEFINITIONS.map((item) => [item.rankType, item.name]))
};

export const DATAEYE_VISIBLE_RANK_TYPE_OPTIONS = [
  ...DATAEYE_RANKING_DEFINITIONS.map((item) => [String(item.rankType), item.name])
];

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

export function getDataEyeRankingDefinition(rankType) {
  const number = Number(rankType);
  return DATAEYE_RANKING_DEFINITIONS.find((item) => item.rankType === number) || null;
}

export function isLegacyDataEyeRankType(rankType) {
  return Object.prototype.hasOwnProperty.call(DATAEYE_LEGACY_RANK_TYPE_NAMES, Number(rankType));
}

export function normalizeDataEyeRankTypeSelection(value = "0") {
  const text = String(value ?? "0").trim();
  if (!text || text === "0") return [0];
  if (text === "all") {
    return [...DATAEYE_ACTIVE_RANK_TYPES];
  }

  const number = Number(text);
  if (
    !Number.isInteger(number) ||
    number < 0 ||
    (!DATAEYE_ACTIVE_RANK_TYPES.includes(number) && !isLegacyDataEyeRankType(number))
  ) {
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
