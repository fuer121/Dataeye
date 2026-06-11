import { nowIso } from "../date.js";
import {
  DATAEYE_PERIOD_LABELS,
  getDataEyeRankingDefinition,
  getDataEyeRankTypeName,
  isLegacyDataEyeRankType,
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
const DATAEYE_BASE_URL = "https://playlet-applet.dataeye.com";
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

  for (const currentRankType of rankTypes) {
    const definition = getDataEyeRankingDefinition(currentRankType);
    if (definition) {
      for (const currentPeriod of periods) {
        if (!definition.periods.includes(currentPeriod)) {
          combos.push(
            buildDataEyeComboResult({
              rankType: currentRankType,
              rankPeriod: currentPeriod,
              periodValue: "",
              status: "failed",
              count: 0,
              error: new CollectorUnavailableError(`${definition.name} 暂不支持${getPeriodLabel(currentPeriod)}。`)
            })
          );
          continue;
        }

        const periodValue = getDataEyeEndpointPeriodValue({ definition, rankingDate, rankPeriod: currentPeriod });
        try {
          const comboRows = await collectDataEyeEndpointCombo({
            definition,
            rankingDate,
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
      continue;
    }

    if (!isLegacyDataEyeRankType(currentRankType)) {
      combos.push(
        ...periods.map((currentPeriod) =>
          buildDataEyeComboResult({
            rankType: currentRankType,
            rankPeriod: currentPeriod,
            periodValue: "",
            status: "failed",
            count: 0,
            error: new CollectorUnavailableError(`未配置 DataEye 榜单类型：${currentRankType}`)
          })
        )
      );
      continue;
    }

    const shouldReadPeriodValues = rankTypes.length > 1 || periods.some((item) => item !== "day");
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

async function collectDataEyeEndpointCombo({ definition, rankingDate, rankPeriod, periodValue, headers }) {
  const rows = [];
  const seenRowKeys = new Set();

  for (let pageId = 1; pageId <= DATAEYE_MAX_PAGES; pageId += 1) {
    const page = await fetchDataEyeEndpointPage({ definition, rankPeriod, periodValue, pageId, headers });
    const content = page.content;

    if (!Array.isArray(content)) {
      throw new CollectorUnavailableError(`${definition.name} 接口未返回 content 榜单数组，已停止真实采集。`);
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
        mapDataEyeEndpointRow(item, {
          definition,
          rankingDate,
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

async function fetchDataEyeEndpointPage({ definition, rankPeriod, periodValue, pageId, headers }) {
  const url = new URL(definition.path, DATAEYE_BASE_URL);
  url.searchParams.set("pageId", String(pageId));
  url.searchParams.set("pageSize", String(DATAEYE_PAGE_SIZE));
  for (const [key, value] of Object.entries(definition.fixedParams || {})) {
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set(rankPeriod, periodValue);

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

function mapDataEyeEndpointRow(item, context) {
  const rank = Number(item.ranking);
  const title = String(item.playletName || "").trim();
  const heat = getFirstDataEyeValue(item, context.definition.heatFields);
  const tags = getFirstDataEyeValue(item, context.definition.typeFields);
  const heatValue = formatHeatValue(heat);
  const dramaType = formatTags(tags);

  if (!Number.isFinite(rank) || !title || !heatValue || tags === undefined) {
    throw new CollectorUnavailableError(
      `${context.definition.name} 榜单字段缺失：rank=${item.ranking ?? ""}, title=${item.playletName ?? ""}, heat=${heat ?? ""}, tags=${tags ?? ""}`
    );
  }

  return {
    source: "dataeye",
    dataKind: "live",
    rankType: context.definition.rankType,
    rankTypeName: context.definition.name,
    rankPeriod: context.rankPeriod,
    periodValue: context.periodValue,
    rankingDate: context.rankingDate,
    rank,
    title,
    heatValue,
    dramaType,
    sourceRef: buildDataEyeEndpointSourceRef(context),
    collectedAt: nowIso(),
    rawPayload: item
  };
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

function buildDataEyeEndpointSourceRef({ definition, rankPeriod, periodValue, pageId }) {
  const url = new URL(definition.path, DATAEYE_BASE_URL);
  url.searchParams.set("pageId", String(pageId));
  url.searchParams.set("pageSize", String(DATAEYE_PAGE_SIZE));
  for (const [key, value] of Object.entries(definition.fixedParams || {})) {
    url.searchParams.set(key, String(value));
  }
  url.searchParams.set(rankPeriod, periodValue);
  return url.toString();
}

function buildDataEyeRowKey(item) {
  const playletId = String(item?.playletId ?? "").trim();
  if (playletId) return `playletId:${playletId}`;

  const playletNativeId = String(item?.playletNativeId ?? "").trim();
  if (playletNativeId) return `playletNativeId:${playletNativeId}`;

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

function formatHeatValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function getFirstDataEyeValue(item, fields = []) {
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(item, field)) return item[field];
  }
  return undefined;
}

function getDataEyeEndpointPeriodValue({ definition, rankingDate, rankPeriod }) {
  if (rankPeriod === "day") return shiftIsoDate(rankingDate, definition.dayOffset || 0);
  if (rankPeriod === "week") return getPreviousCompleteWeekValue(rankingDate);
  if (rankPeriod === "month") return getPreviousMonthValue(rankingDate);
  return "";
}

function shiftIsoDate(value, offsetDays) {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatIsoDate(date);
}

function getPreviousCompleteWeekValue(value) {
  const date = parseIsoDate(value);
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - daysSinceMonday - 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return `${formatIsoDate(start)} ~ ${formatIsoDate(end)}`;
}

function getPreviousMonthValue(value) {
  const date = parseIsoDate(value);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const previous = new Date(Date.UTC(year, month - 1, 1));
  return formatIsoDate(previous).slice(0, 7);
}

function parseIsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new CollectorUnavailableError(`DataEye 榜单日期格式无效：${value}`);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodLabel(period) {
  return DATAEYE_PERIOD_LABELS[period] || period;
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
