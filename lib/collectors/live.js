import { nowIso } from "../date.js";
import {
  getDataEyeRankTypeName,
  normalizeDataEyePeriodSelection,
  normalizeDataEyeRankTypeSelection
} from "../dataeye-rankings.js";

export class CollectorUnavailableError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "CollectorUnavailableError";
    this.code = options.code || "COLLECTOR_UNAVAILABLE";
    this.action = options.action || "";
  }
}

const DATAEYE_MOTION_COMIC_URL = "https://playlet-applet.dataeye.com/playlet/motionComic";
const DATAEYE_MOTION_COMIC_DATE_URL = "https://playlet-applet.dataeye.com/playlet/motionComicDate";
const DATAEYE_PAGE_SIZE = 30;
const DATAEYE_MAX_PAGES = 10;
const DATAEYE_AUTH_EXPIRED_ACTION =
  "请重新打开剧查查小程序并用 Charles/Proxyman 导出新 HAR，然后更新 .env.local.dataeye 后重新预检。";

export async function collectDataEyeRanking({ rankingDate, rankType = "0", period = "day" }) {
  const result = await collectDataEyeRankingDetailed({ rankingDate, rankType, period });
  return result.rows;
}

export async function collectDataEyeRankingDetailed({ rankingDate, rankType = "0", period = "day" }) {
  const headers = buildDataEyeHeaders();
  const rows = [];
  const combos = [];
  const rankTypes = normalizeDataEyeRankTypeSelection(rankType);
  const periods = normalizeDataEyePeriodSelection(period);
  const isRankTypeProbe = String(rankType ?? "").trim() === "all";
  const shouldReadPeriodValues = rankTypes.length > 1 || periods.some((item) => item !== "day");

  for (const currentRankType of rankTypes) {
    let periodValues;
    try {
      periodValues = shouldReadPeriodValues
        ? await fetchDataEyeMotionComicDate({ rankType: currentRankType, headers })
        : { day: rankingDate };
    } catch (error) {
      combos.push(
        ...periods.map((currentPeriod) =>
          buildDataEyeComboResult({
            rankType: currentRankType,
            rankPeriod: currentPeriod,
            periodValue: "",
            status: "failed",
            count: 0,
            error
          })
        )
      );
      if (error?.code === "DATAEYE_AUTH_EXPIRED" || !isRankTypeProbe) throw error;
      continue;
    }

    for (const currentPeriod of periods) {
      const periodValue = periodValues[currentPeriod] || (currentPeriod === "day" ? rankingDate : "");
      if (!periodValue) {
        combos.push(
          buildDataEyeComboResult({
            rankType: currentRankType,
            rankPeriod: currentPeriod,
            periodValue: "",
            status: "failed",
            count: 0,
            error: new CollectorUnavailableError(`DataEye / 剧查查榜期接口未返回 ${currentPeriod} 榜期值。`)
          })
        );
        continue;
      }
      try {
        const comboRows = await collectDataEyeMotionComicCombo({
          rankingDate,
          rankType: currentRankType,
          rankPeriod: currentPeriod,
          periodValue,
          headers
        });
        rows.push(...comboRows);
        combos.push(
          buildDataEyeComboResult({
            rankType: currentRankType,
            rankPeriod: currentPeriod,
            periodValue,
            status: comboRows.length > 0 ? "ready" : "empty",
            count: comboRows.length,
            error: null
          })
        );
      } catch (error) {
        combos.push(
          buildDataEyeComboResult({
            rankType: currentRankType,
            rankPeriod: currentPeriod,
            periodValue,
            status: "failed",
            count: 0,
            error
          })
        );
        if (error?.code === "DATAEYE_AUTH_EXPIRED" || !isRankTypeProbe) throw error;
      }
    }
  }

  if (rows.length === 0) {
    throw new CollectorUnavailableError("DataEye / 剧查查真实采集未返回任何榜单，已停止落库。");
  }

  return { rows, combos };
}

async function collectDataEyeMotionComicCombo({ rankingDate, rankType, rankPeriod, periodValue, headers }) {
  const rows = [];
  const seenRowKeys = new Set();

  for (let pageId = 1; pageId <= DATAEYE_MAX_PAGES; pageId += 1) {
    const page = await fetchDataEyeMotionComicPage({ rankType, rankPeriod, periodValue, pageId, headers });
    const content = page.content;

    if (!Array.isArray(content)) {
      throw new CollectorUnavailableError("DataEye / 剧查查接口未返回 content 榜单数组，已停止真实采集。");
    }

    const newRows = [];
    for (const item of content) {
      const rowKey = buildDataEyeRowKey(item);
      if (seenRowKeys.has(rowKey)) continue;
      seenRowKeys.add(rowKey);
      newRows.push({ item, pageId });
    }

    if (pageId > 1 && newRows.length === 0) break;

    rows.push(
      ...newRows.map(({ item, pageId: rowPageId }) =>
        mapDataEyeMotionComicRow(item, {
          rankingDate,
          rankType,
          rankTypeName: getDataEyeRankTypeName(rankType),
          rankPeriod,
          periodValue,
          pageId: rowPageId
        })
      )
    );

    const totalRecords = Number(page.page?.totalRecords);
    if (content.length < DATAEYE_PAGE_SIZE) break;
    if (Number.isFinite(totalRecords) && pageId * DATAEYE_PAGE_SIZE >= totalRecords) break;
  }

  return rows;
}

function buildDataEyeHeaders() {
  const authentication = process.env.DATAEYE_AUTHENTICATION;
  const loginUserId = process.env.DATAEYE_LOGIN_USER_ID;

  if (!authentication || !loginUserId) {
    throw new CollectorUnavailableError(
      "DataEye / 剧查查真实采集需要先配置 DATAEYE_AUTHENTICATION 和 DATAEYE_LOGIN_USER_ID。当前不会绕过登录或风控。"
    );
  }

  const headers = {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
    authentication,
    loginUserId
  };

  if (process.env.DATAEYE_S) headers.S = process.env.DATAEYE_S;
  if (process.env.DATAEYE_REFERER) headers.referer = process.env.DATAEYE_REFERER;
  if (process.env.DATAEYE_USER_AGENT) headers["user-agent"] = process.env.DATAEYE_USER_AGENT;
  if (process.env.DATAEYE_COOKIE) headers.cookie = process.env.DATAEYE_COOKIE;
  if (process.env.DATAEYE_AUTHORIZATION) headers.authorization = process.env.DATAEYE_AUTHORIZATION;
  if (process.env.DATAEYE_TOKEN) headers.token = process.env.DATAEYE_TOKEN;

  return headers;
}

async function fetchDataEyeMotionComicDate({ rankType, headers }) {
  const url = new URL(DATAEYE_MOTION_COMIC_DATE_URL);
  url.searchParams.set("rankType", String(rankType));

  const json = await fetchDataEyeJson(url, headers);
  const content = json.content;
  if (!content || typeof content !== "object") {
    throw new CollectorUnavailableError("DataEye / 剧查查榜期接口未返回 content 对象，已停止真实采集。");
  }

  return {
    day: String(content.day || "").trim(),
    week: String(content.week || "").trim(),
    month: String(content.month || "").trim()
  };
}

async function fetchDataEyeMotionComicPage({ rankType, rankPeriod, periodValue, pageId, headers }) {
  const url = new URL(DATAEYE_MOTION_COMIC_URL);
  url.searchParams.set("pageId", String(pageId));
  url.searchParams.set("pageSize", String(DATAEYE_PAGE_SIZE));
  url.searchParams.set(rankPeriod, periodValue);
  url.searchParams.set("rankType", String(rankType));

  return fetchDataEyeJson(url, headers);
}

async function fetchDataEyeJson(url, headers) {
  const response = await fetch(url, {
    method: "GET",
    headers,
    redirect: "manual"
  });
  const text = await response.text();

  if (!response.ok) {
    throw new CollectorUnavailableError(
      `DataEye / 剧查查接口请求失败：HTTP ${response.status} ${response.statusText || ""}`.trim()
    );
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new CollectorUnavailableError("DataEye / 剧查查接口未返回 JSON，已停止真实采集。");
  }

  if (json.statusCode && Number(json.statusCode) !== 200) {
    throw buildDataEyeStatusError({
      statusCode: json.statusCode,
      message: json.message || ""
    });
  }

  return json;
}

function buildDataEyeStatusError({ statusCode, message }) {
  const text = `DataEye / 剧查查接口业务状态异常：statusCode=${statusCode}，message=${message}`;
  if (Number(statusCode) === 401 || /登录态已失效|重新登录|未登录/.test(message)) {
    return new CollectorUnavailableError(text, {
      code: "DATAEYE_AUTH_EXPIRED",
      action: DATAEYE_AUTH_EXPIRED_ACTION
    });
  }

  return new CollectorUnavailableError(text);
}

function mapDataEyeMotionComicRow(item, context) {
  const rank = Number(item.ranking);
  const title = String(item.playletName || "").trim();
  const heatValue = String(item.playCountAdd || item.playCount || "").trim();
  const dramaType = formatTags(item.tags);

  if (!Number.isFinite(rank) || !title || !heatValue || !Object.prototype.hasOwnProperty.call(item, "tags")) {
    throw new CollectorUnavailableError(
      `DataEye / 剧查查榜单字段缺失：rank=${item.ranking ?? ""}, title=${item.playletName ?? ""}, heat=${item.playCountAdd ?? item.playCount ?? ""}, tags=${item.tags ?? ""}`
    );
  }

  return {
    source: "dataeye",
    dataKind: "live",
    rankType: context.rankType,
    rankTypeName: context.rankTypeName,
    rankPeriod: context.rankPeriod,
    periodValue: context.periodValue,
    rankingDate: context.rankingDate,
    rank,
    title,
    heatValue,
    dramaType,
    sourceRef: buildDataEyeSourceRef(context),
    collectedAt: nowIso(),
    rawPayload: item
  };
}

function buildDataEyeSourceRef({ rankType, rankPeriod, periodValue, pageId }) {
  const url = new URL(DATAEYE_MOTION_COMIC_URL);
  url.searchParams.set("pageId", String(pageId));
  url.searchParams.set("pageSize", String(DATAEYE_PAGE_SIZE));
  url.searchParams.set(rankPeriod, periodValue);
  url.searchParams.set("rankType", String(rankType));
  return url.toString();
}

function buildDataEyeRowKey(item) {
  const playletId = String(item?.playletId ?? "").trim();
  if (playletId) return `playletId:${playletId}`;

  return `fallback:${String(item?.ranking ?? "").trim()}:${String(item?.playletName ?? "").trim()}`;
}

function buildDataEyeComboResult({ rankType, rankPeriod, periodValue, status, count, error }) {
  return {
    rankType,
    rankTypeName: getDataEyeRankTypeName(rankType),
    rankPeriod,
    periodValue,
    status,
    count,
    error: error?.message || ""
  };
}

function formatTags(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("/");
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.filter(Boolean).join("/");
  } catch {
    return trimmed;
  }

  return trimmed;
}

export async function collectHongguoRanking() {
  if (!process.env.HONGGUO_SESSION && !process.env.HONGGUO_COOKIE) {
    throw new CollectorUnavailableError(
      "红果真实采集需要先配置 HONGGUO_SESSION 或 HONGGUO_COOKIE。当前 MVP 不会绕过登录或风控。"
    );
  }

  throw new CollectorUnavailableError(
    "红果真实采集器接口已预留，但还需要确认榜单入口、请求参数和字段结构后接入。"
  );
}
