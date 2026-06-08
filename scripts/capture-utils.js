import fs from "node:fs";
import path from "node:path";

export const ROOT_DIR = process.cwd();
export const CAPTURES_DIR = path.join(ROOT_DIR, "captures");
export const DOCS_DIR = path.join(ROOT_DIR, "docs");

const CAPTURE_EXTENSIONS = new Set([".har", ".json", ".txt", ".curl"]);
const SENSITIVE_HEADER_RE = /cookie|authorization|authentication|token|session|userid|openid|unionid/i;
const RANKING_URL_RE =
  /rank|ranking|hot|hongguo|comic|playlet|manhua|manju|drama|listHongGuo|listRanking|listHotRanking/i;
const RANKING_FIELD_RE =
  /ranking|rank|playletName|hotValue|consumeNum|contentTypes|playletTags|剧名|热度|排名/i;
const FIELD_PATTERNS = {
  rank: /^(ranking|rank|rankNo|rank_num|sort|index|排名)$/i,
  title: /(playletName|title|name|dramaName|comicName|workName|shortPlayName|剧名|名称|作品名)/i,
  heatValue: /(hotValue|heatValue|consumeNum|hot|heat|score|popularity|playCount|播放|热度)/i,
  dramaType: /(contentTypes|playletTags|playletTypes|tags|tag|type|types|category|题材|类型)/i
};
const FIELD_PRIORITY_KEYS = {
  heatValue: ["playCountAdd"]
};
const REDACTION_RE = /(<[^>]*(redact|hidden|mask|脱敏|隐藏|省略)[^>]*>|\*{3,}|x{4,}|REDACTED|已脱敏)/i;

export function ensureDirs() {
  fs.mkdirSync(CAPTURES_DIR, { recursive: true });
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

export function listCaptureFiles() {
  ensureDirs();
  return fs
    .readdirSync(CAPTURES_DIR)
    .filter(isCaptureFileName)
    .map((name) => path.join(CAPTURES_DIR, name))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .sort();
}

export function isCaptureFileName(name) {
  return CAPTURE_EXTENSIONS.has(path.extname(String(name)).toLowerCase());
}

export function readEnvLocal() {
  return readEnvFile(".env.local");
}

export function readEnvFile(filePath) {
  if (!filePath) return {};
  const envPath = resolveEnvFilePath(filePath);
  if (!fs.existsSync(envPath)) return {};

  const env = {};
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

export function resolveEnvFilePath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIR, filePath);
}

export function describeEnvFile(filePath) {
  if (!filePath) {
    return {
      requested: "",
      resolvedPath: "",
      exists: false,
      label: "默认 .env.local / 当前进程环境"
    };
  }

  const resolvedPath = resolveEnvFilePath(filePath);
  return {
    requested: filePath,
    resolvedPath,
    exists: fs.existsSync(resolvedPath),
    label: `${filePath}（${fs.existsSync(resolvedPath) ? "存在" : "不存在"}）`
  };
}

export function readRuntimeEnv({ envFile = "" } = {}) {
  const env = {
    ...readEnvLocal(),
    ...readEnvFile(envFile),
    ...process.env
  };
  if (envFile) {
    const status = describeEnvFile(envFile);
    env.__ENV_FILE = status.requested;
    env.__ENV_FILE_EXISTS = status.exists;
  }
  return env;
}

export function maskSensitiveValue(value) {
  if (!value) return "<empty>";
  const text = String(value);
  if (text.length <= 8) return "<set>";
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

export function sanitizeForDisplay(value) {
  if (Array.isArray(value)) return value.map(sanitizeForDisplay);

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, child]) => {
      acc[key] = isSensitiveDisplayKey(key) ? maskSensitiveValue(child) : sanitizeForDisplay(child);
      return acc;
    }, {});
  }

  if (typeof value === "string") return sanitizeText(value);
  return value;
}

export function sanitizeText(value) {
  return String(value ?? "")
    .replace(/([?&](?:auth_key|token|sign|session|authorization|authentication)=)[^&#\s"]+/gi, "$1<redacted>")
    .replace(
      /("(?:secUid|userId|openId|openid|unionId|unionid|phone|mobile|deviceId|account)"\s*:\s*")([^"]+)(")/gi,
      (_, prefix, sensitiveValue, suffix) => `${prefix}${maskSensitiveValue(sensitiveValue)}${suffix}`
    )
    .replace(
      /(\\+"(?:secUid|userId|openId|openid|unionId|unionid|phone|mobile|deviceId|account)\\+"\s*:\s*\\+")([^\\"]+)(\\+")/gi,
      (_, prefix, sensitiveValue, suffix) => `${prefix}${maskSensitiveValue(sensitiveValue)}${suffix}`
    );
}

function isSensitiveDisplayKey(key) {
  return /^(secUid|userId|openId|openid|unionId|unionid|phone|mobile|deviceId|account)$/i.test(key);
}

export function isSensitiveHeader(name) {
  return SENSITIVE_HEADER_RE.test(name) || String(name).toLowerCase() === "s";
}

export function normalizeHeaders(headers = {}) {
  if (Array.isArray(headers)) {
    return headers.reduce((acc, item) => {
      if (!item || !item.name) return acc;
      acc[item.name.toLowerCase()] = String(item.value ?? "");
      return acc;
    }, {});
  }

  if (headers && typeof headers === "object") {
    return Object.entries(headers).reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = Array.isArray(value) ? value.join("; ") : String(value ?? "");
      return acc;
    }, {});
  }

  return {};
}

export function summarizeHeaders(headers = {}) {
  return Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({
      name,
      value: isSensitiveHeader(name) ? maskSensitiveValue(value) : value
    }));
}

export function parseCaptureFiles(files = listCaptureFiles()) {
  const requests = [];
  const errors = [];

  for (const filePath of files) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const text = fs.readFileSync(filePath, "utf8");

      if (ext === ".har") {
        requests.push(...parseHar(text, filePath));
      } else if (ext === ".json") {
        requests.push(...parseJsonCapture(text, filePath));
      } else if (ext === ".txt" || ext === ".curl") {
        requests.push(...parseTextCapture(text, filePath));
      }
    } catch (error) {
      errors.push({ filePath, message: error.message });
    }
  }

  return { requests: sortRankingCandidates(requests.map(scoreRequest)), errors };
}

function parseHar(text, filePath) {
  const data = JSON.parse(text);
  if (!data?.log?.entries) return parseJsonObject(data, filePath);

  return data.log.entries.map((entry, index) => {
    const request = entry.request || {};
    const response = entry.response || {};
    return makeRequest({
      sourceFile: filePath,
      sourceType: "har",
      index,
      url: request.url,
      method: request.method,
      headers: normalizeHeaders(request.headers),
      payload: request.postData?.text || request.postData?.params || "",
      capturedAt: entry.startedDateTime || "",
      capturedAtSource: entry.startedDateTime ? "har" : "file_mtime",
      responseStatus: response.status,
      responseHeaders: normalizeHeaders(response.headers),
      responseBody: decodeHarContent(response.content),
      responseMimeType: response.content?.mimeType || ""
    });
  });
}

function decodeHarContent(content = {}) {
  if (!content?.text) return "";
  if (content.encoding === "base64") {
    try {
      return Buffer.from(content.text, "base64").toString("utf8");
    } catch {
      return content.text;
    }
  }
  return content.text;
}

function parseJsonCapture(text, filePath) {
  const data = JSON.parse(text);
  return parseJsonObject(data, filePath);
}

function parseJsonObject(data, filePath) {
  if (data?.log?.entries) return parseHar(JSON.stringify(data), filePath);

  const found = [];
  const visit = (value, trail = []) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, trail.concat(index)));
      return;
    }

    const url = value.url || value.requestUrl || value.requestURL || value.href;
    const method = value.method || value.requestMethod || value.httpMethod;
    const request = value.request && typeof value.request === "object" ? value.request : null;
    const response = value.response && typeof value.response === "object" ? value.response : null;

    if (url || request?.url) {
      found.push(
        makeRequest({
          sourceFile: filePath,
          sourceType: "json",
          index: found.length,
          url: url || request.url,
          method: method || request?.method || "GET",
          headers: normalizeHeaders(value.headers || request?.headers),
          payload:
            value.payload ||
            value.body ||
            value.data ||
            value.postData?.text ||
            request?.postData?.text ||
            request?.body ||
            "",
          responseStatus: value.status || value.statusCode || response?.status || response?.statusCode,
          responseHeaders: normalizeHeaders(value.responseHeaders || response?.headers),
          responseBody:
            value.responseBody ||
            value.responseText ||
            value.response ||
            response?.body ||
            response?.content?.text ||
            "",
          responseMimeType: value.mimeType || response?.content?.mimeType || ""
        })
      );
    }

    for (const [key, child] of Object.entries(value)) {
      if (trail.length > 8) continue;
      if (["request", "response", "headers"].includes(key)) continue;
      visit(child, trail.concat(key));
    }
  };

  visit(data);
  return found;
}

function parseTextCapture(text, filePath) {
  const chunks = splitTextIntoRequests(text);
  return chunks
    .map((chunk, index) => parseCurl(chunk, filePath, index) || parseRawHttp(chunk, filePath, index))
    .filter(Boolean);
}

function splitTextIntoRequests(text) {
  if (/curl\s+/.test(text)) {
    return text
      .split(/\n(?=curl\s+)/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [text.trim()].filter(Boolean);
}

function parseCurl(text, filePath, index) {
  if (!/^\s*curl\s+/i.test(text)) return null;
  const tokens = shellSplit(text.replace(/\\\r?\n/g, " "));
  const headers = {};
  let method = "GET";
  let payload = "";
  let url = "";

  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    const next = tokens[i + 1];

    if (token === "-X" || token === "--request") {
      method = next || method;
      i += 1;
    } else if (token === "-H" || token === "--header") {
      addHeader(headers, next);
      i += 1;
    } else if (
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary" ||
      token === "-d"
    ) {
      payload = next || "";
      method = method === "GET" ? "POST" : method;
      i += 1;
    } else if (!token.startsWith("-") && /^https?:\/\//i.test(token)) {
      url = token;
    }
  }

  if (!url) return null;
  return makeRequest({
    sourceFile: filePath,
    sourceType: "curl",
    index,
    url,
    method,
    headers: normalizeHeaders(headers),
    payload
  });
}

function parseRawHttp(text, filePath, index) {
  const lines = text.split(/\r?\n/);
  const firstLine = lines[0]?.trim();
  const match = firstLine?.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s+(\S+)/i);
  if (!match) return null;

  const method = match[1].toUpperCase();
  let url = match[2];
  const headers = {};
  let bodyStart = -1;

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      bodyStart = i + 1;
      break;
    }
    addHeader(headers, line);
  }

  if (!/^https?:\/\//i.test(url) && headers.host) {
    url = `https://${headers.host}${url}`;
  }

  return makeRequest({
    sourceFile: filePath,
    sourceType: "raw-http",
    index,
    url,
    method,
    headers: normalizeHeaders(headers),
    payload: bodyStart >= 0 ? lines.slice(bodyStart).join("\n").trim() : ""
  });
}

function addHeader(headers, line) {
  if (!line) return;
  const index = line.indexOf(":");
  if (index < 0) return;
  const name = line.slice(0, index).trim();
  const value = line.slice(index + 1).trim();
  if (name) headers[name] = value;
}

function shellSplit(input) {
  const tokens = [];
  let current = "";
  let quote = null;
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function makeRequest({
  sourceFile,
  sourceType,
  index,
  url,
  method = "GET",
  headers = {},
  payload = "",
  capturedAt = "",
  capturedAtSource = "",
  responseStatus,
  responseHeaders = {},
  responseBody = "",
  responseMimeType = ""
}) {
  const responseText =
    typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody ?? "");
  const fallbackCapturedAt = getFileMtimeIso(sourceFile);

  return {
    id: `${path.basename(sourceFile)}#${index}`,
    sourceFile,
    sourceType,
    index,
    url: String(url || ""),
    method: String(method || "GET").toUpperCase(),
    headers: normalizeHeaders(headers),
    payload: stringifyPayload(payload),
    capturedAt: normalizeIsoDate(capturedAt) || fallbackCapturedAt,
    capturedAtSource: normalizeIsoDate(capturedAt) ? capturedAtSource || "capture" : "file_mtime",
    responseStatus,
    responseHeaders: normalizeHeaders(responseHeaders),
    responseBody: responseText,
    responseMimeType,
    hasCookie: hasHeader(headers, "cookie"),
    hasAuthorization: hasHeader(headers, "authorization"),
    hasToken: Object.keys(normalizeHeaders(headers)).some((key) => /token/i.test(key))
  };
}

export function summarizeCaptureFreshness(request = {}, now = new Date()) {
  const capturedAt = normalizeIsoDate(request.capturedAt);
  if (!capturedAt) {
    return {
      capturedAt: "",
      ageLabel: "未知",
      status: "unknown",
      note: "未识别到抓包时间。"
    };
  }

  const ageMs = now.getTime() - new Date(capturedAt).getTime();
  if (!Number.isFinite(ageMs)) {
    return {
      capturedAt: "",
      ageLabel: "未知",
      status: "unknown",
      note: "抓包时间无法解析。"
    };
  }

  const absMs = Math.abs(ageMs);
  const ageLabel = formatAge(absMs, ageMs < 0);
  const status = ageMs < 0 ? "future" : ageMs <= 2 * 60 * 60 * 1000 ? "fresh" : ageMs <= 24 * 60 * 60 * 1000 ? "aging" : "stale";
  const note =
    status === "fresh"
      ? "较新"
      : status === "aging"
        ? "可能需要重新抓取"
        : status === "future"
          ? "时间晚于当前机器时间"
          : "建议重新抓取";

  return {
    capturedAt,
    ageLabel,
    status,
    note
  };
}

function normalizeIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toISOString();
}

function getFileMtimeIso(filePath) {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return "";
  }
}

function formatAge(ageMs, future) {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  let label;
  if (ageMs < minute) {
    label = "小于 1 分钟";
  } else if (ageMs < hour) {
    label = `${Math.round(ageMs / minute)} 分钟`;
  } else if (ageMs < day) {
    label = `${(ageMs / hour).toFixed(1)} 小时`;
  } else {
    label = `${(ageMs / day).toFixed(1)} 天`;
  }

  return future ? `未来 ${label}` : label;
}

function stringifyPayload(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return JSON.stringify(payload);
}

function hasHeader(headers, name) {
  const normalized = normalizeHeaders(headers);
  return Object.prototype.hasOwnProperty.call(normalized, name);
}

function scoreRequest(request) {
  let score = 0;
  const target = `${request.url}\n${request.payload}\n${request.responseBody}`;
  const priority = getRankingCandidatePriority(request);

  if (RANKING_URL_RE.test(request.url)) score += 5;
  if (priority >= 100) score += 10;
  else if (priority >= 80) score += 6;
  if (/list/i.test(request.url)) score += 2;
  if (/date/i.test(request.url)) score -= 1;
  if (/\.js|\.css|\.png|\.jpg|\.svg|\.woff/i.test(request.url)) score -= 6;
  if (RANKING_FIELD_RE.test(target)) score += 4;
  if (containsLikelyRankingArray(request.responseBody)) score += 8;
  if (request.hasCookie || request.hasAuthorization || request.hasToken) score += 1;

  return {
    ...request,
    score,
    targetPriority: priority,
    isLikelyRanking: score >= 6,
    hasLikelyRankingArray: containsLikelyRankingArray(request.responseBody)
  };
}

export function sortRankingCandidates(candidates = []) {
  return [...candidates].sort((a, b) => {
    const priorityDiff = getRankingCandidatePriority(b) - getRankingCandidatePriority(a);
    if (priorityDiff) return priorityDiff;
    const dayDiff = getRequestDayValue(b) - getRequestDayValue(a);
    if (dayDiff) return dayDiff;
    const capturedAtDiff = getCapturedAtValue(b) - getCapturedAtValue(a);
    if (capturedAtDiff) return capturedAtDiff;
    return (b.score || 0) - (a.score || 0);
  });
}

export function getRankingCandidatePriority(request = {}) {
  const parsed = safeUrl(request.url);
  if (!parsed) return 0;

  const host = parsed.hostname.toLowerCase();
  const pathName = parsed.pathname.toLowerCase();
  const rankType = parsed.searchParams.get("rankType");
  const hasDay = parsed.searchParams.has("day");

  if (host === "playlet-applet.dataeye.com" && pathName === "/playlet/motioncomic") {
    if (rankType === "0" && hasDay) return 100;
    return 80;
  }

  if (host === "playlet-applet.dataeye.com" && /listhotranking/i.test(pathName)) return 40;
  if (host === "playlet-applet.dataeye.com" && /listhongguoranking/i.test(pathName)) return 20;
  return 0;
}

function safeUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function getRequestDayValue(request = {}) {
  const digits = getRequestDate(request).replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function getCapturedAtValue(request = {}) {
  const timestamp = Date.parse(request.startedDateTime || request.capturedAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getRequestDate(request = {}) {
  const fromUrl = getRequestDateFromUrl(request.url);
  if (fromUrl) return fromUrl;

  const fromPayload = getRequestDateFromPayload(request.payload);
  if (fromPayload) return fromPayload;

  return "";
}

function getRequestDateFromUrl(value) {
  const parsed = safeUrl(value);
  if (!parsed) return "";
  return pickDateValue(parsed.searchParams);
}

function getRequestDateFromPayload(payload) {
  const text = String(payload || "").trim();
  if (!text) return "";

  const parsed = tryParseJson(text);
  if (parsed && typeof parsed === "object") {
    const value = findDateValue(parsed);
    if (value) return value;
  }

  try {
    const params = new URLSearchParams(text);
    return pickDateValue(params);
  } catch {
    return "";
  }
}

function pickDateValue(params) {
  const keys = ["day", "date", "rankDate", "rankingDate", "ranking_date", "dt"];
  for (const key of keys) {
    const value = normalizeDateValue(params.get(key));
    if (value) return value;
  }
  return "";
}

function findDateValue(value) {
  if (!value || typeof value !== "object") return "";
  const keys = ["day", "date", "rankDate", "rankingDate", "ranking_date", "dt"];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const found = normalizeDateValue(value[key]);
      if (found) return found;
    }
  }

  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      const found = findDateValue(child);
      if (found) return found;
    }
  }

  return "";
}

function normalizeDateValue(value) {
  const text = String(value ?? "").trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? match[0] : "";
}

export function containsLikelyRankingArray(body) {
  const parsed = tryParseJson(body);
  if (!parsed) return false;
  const arrays = findArrays(parsed);
  return arrays.some((items) => {
    if (!items.length || typeof items[0] !== "object" || Array.isArray(items[0])) return false;
    const keys = Object.keys(items[0]).join("|");
    return RANKING_FIELD_RE.test(keys);
  });
}

export function extractRankingArrays(body) {
  const parsed = tryParseJson(body);
  if (!parsed) return [];
  return findArrays(parsed).filter((items) => {
    if (!items.length || !items[0] || typeof items[0] !== "object" || Array.isArray(items[0])) return false;
    return RANKING_FIELD_RE.test(Object.keys(items[0]).join("|"));
  });
}

export function assessRankingReadiness(body) {
  const arrays = extractRankingArrays(body);
  const firstArray = arrays[0] || [];
  const firstItem = firstArray[0] || null;
  const fields = firstItem ? detectRankingFields(firstItem) : {};
  const required = ["rank", "title", "heatValue", "dramaType"];
  const missing = required.filter((name) => !fields[name]);

  return {
    hasRankingArray: firstArray.length > 0,
    rankingCount: firstArray.length,
    fields,
    missing,
    ready: firstArray.length > 0 && missing.length === 0,
    firstItem
  };
}

export function detectRankingFields(item) {
  const flattened = flattenObject(item);
  const fields = {};

  for (const [fieldName, pattern] of Object.entries(FIELD_PATTERNS)) {
    const match = findPreferredField(flattened, fieldName) || flattened.find(([key]) => pattern.test(key));
    if (match) {
      fields[fieldName] = {
        key: match[0],
        sample: maskIfSensitive(match[1])
      };
    }
  }

  return fields;
}

function findPreferredField(flattened, fieldName) {
  const preferredKeys = FIELD_PRIORITY_KEYS[fieldName] || [];
  return flattened.find(([key]) => preferredKeys.some((preferredKey) => key.split(".").pop().toLowerCase() === preferredKey.toLowerCase()));
}

export function tryParseJson(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function findArrays(value, found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    found.push(value);
    for (const item of value) findArrays(item, found);
    return found;
  }
  for (const child of Object.values(value)) findArrays(child, found);
  return found;
}

function flattenObject(value, prefix = "", rows = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return rows;

  for (const [key, child] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenObject(child, nextKey, rows);
    } else {
      rows.push([nextKey, child]);
    }
  }

  return rows;
}

function maskIfSensitive(value) {
  if (value == null) return "";
  const text = String(value);
  return SENSITIVE_HEADER_RE.test(text) ? maskSensitiveValue(text) : text.slice(0, 80);
}

export function minimalHeaders(request, env = {}) {
  const original = request.headers || {};
  const keep = new Set([
    "accept",
    "content-type",
    "content-language",
    "referer",
    "user-agent",
    "x-request-with",
    "x-requested-with",
    "s",
    "authentication",
    "loginuserid",
    "authorization",
    "cookie",
    "session",
    "token"
  ]);
  const headers = {};

  for (const [name, value] of Object.entries(original)) {
    if (keep.has(name) || /token/i.test(name)) {
      headers[name] = value;
    }
  }

  const prefix = detectRequestSource(request) === "hongguo" ? "HONGGUO" : "DATAEYE";

  if (env[`${prefix}_COOKIE`]) headers.cookie = env[`${prefix}_COOKIE`];
  if (env[`${prefix}_AUTHORIZATION`]) headers.authorization = env[`${prefix}_AUTHORIZATION`];
  if (env[`${prefix}_SESSION`]) headers.session = env[`${prefix}_SESSION`];
  if (env[`${prefix}_TOKEN`]) headers.token = env[`${prefix}_TOKEN`];
  if (env[`${prefix}_AUTHENTICATION`]) headers.authentication = env[`${prefix}_AUTHENTICATION`];
  if (env[`${prefix}_LOGIN_USER_ID`]) headers.loginUserId = env[`${prefix}_LOGIN_USER_ID`];
  if (env[`${prefix}_S`]) headers.S = env[`${prefix}_S`];
  if (env[`${prefix}_REFERER`]) headers.referer = env[`${prefix}_REFERER`];
  if (env[`${prefix}_USER_AGENT`]) headers["user-agent"] = env[`${prefix}_USER_AGENT`];

  return headers;
}

export function detectRequestSource(request = {}) {
  const sourceHint = `${request.url || ""} ${request.sourceFile || ""}`.toLowerCase();
  if (sourceHint.includes("hongguo")) return "hongguo";
  if (sourceHint.includes("dataeye") || sourceHint.includes("playlet-applet.dataeye.com")) return "dataeye";
  return "";
}

export function matchesRequestSource(request = {}, source = "") {
  const normalized = String(source || "").trim();
  if (!normalized || normalized === "all") return true;
  return detectRequestSource(request) === normalized;
}

export function hasRedactedSensitiveValue(request) {
  return Object.entries(request.headers || {}).some(([name, value]) => {
    if (!isSensitiveHeader(name)) return false;
    return /<|>|\*|REDACTED|脱敏|xxxx/i.test(String(value));
  });
}

export function auditCaptureMaterial({ files = listCaptureFiles(), requests = [], errors = [] } = {}) {
  const issues = [];
  const likelyRankingRequests = requests.filter((request) => request.isLikelyRanking);
  const readyRequests = likelyRankingRequests.filter((request) => assessRankingReadiness(request.responseBody).ready);

  if (files.length === 0) {
    issues.push(issue("missing_files", "缺少抓包文件", "请将 HAR、JSON、txt 或 curl 文件放入 captures/。"));
  }

  if (errors.length > 0) {
    issues.push(issue("parse_errors", "存在解析错误", "请检查抓包文件格式，优先导出 HAR with content 或 cURL。"));
  }

  if (files.length > 0 && requests.length === 0) {
    issues.push(issue("missing_requests", "未解析到请求", "抓包材料中需要包含 URL、Method、Headers、Payload 和 Response。"));
  }

  if (requests.length > 0 && likelyRankingRequests.length === 0) {
    issues.push(issue("missing_ranking_request", "未识别到疑似榜单请求", "请补充剧查查小程序漫剧热播榜列表接口。"));
  }

  if (likelyRankingRequests.length > 0 && readyRequests.length === 0) {
    issues.push(issue("missing_mappable_response", "缺少可映射榜单响应", "榜单响应首条数据需要能映射 rank、title、heatValue、dramaType。"));
  }

  for (const request of requests) {
    if (!request.url) {
      issues.push(issue("missing_url", "请求缺少 URL", `请求 ${request.id} 无法复现。`));
    }
    if (!request.method) {
      issues.push(issue("missing_method", "请求缺少 Method", `请求 ${request.id} 无法复现。`));
    }
    if (request.isLikelyRanking && !request.responseBody) {
      issues.push(issue("missing_response_body", "疑似榜单请求缺少响应体", `请求 ${request.id} 需要 HAR with content 或 response JSON。`));
    }
    if (hasForbiddenRedaction(request.url) || hasForbiddenRedaction(request.payload)) {
      issues.push(issue("redacted_request_params", "请求 URL 或 Payload 疑似过度脱敏", `请求 ${request.id} 的 URL/Payload 不能脱敏日期、分页、榜单类型、sign 或 timestamp。`));
    }
    if (request.isLikelyRanking && hasForbiddenRedaction(request.responseBody)) {
      issues.push(issue("redacted_response_body", "榜单响应疑似过度脱敏", `请求 ${request.id} 的响应字段名和至少一条榜单数据不能脱敏。`));
    }
  }

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      files: files.length,
      requests: requests.length,
      parseErrors: errors.length,
      likelyRankingRequests: likelyRankingRequests.length,
      readyRankingRequests: readyRequests.length
    }
  };
}

export function hasForbiddenRedaction(value) {
  return REDACTION_RE.test(String(value || ""));
}

function issue(code, title, detail) {
  return { code, title, detail };
}

export function writeMarkdown(fileName, content) {
  ensureDirs();
  const filePath = path.join(DOCS_DIR, fileName);
  fs.writeFileSync(filePath, content.trimEnd() + "\n");
  return filePath;
}

export function rel(filePath) {
  return path.relative(ROOT_DIR, filePath);
}
