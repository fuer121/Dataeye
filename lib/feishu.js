const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";

export class FeishuImportError extends Error {
  constructor(message) {
    super(message);
    this.name = "FeishuImportError";
  }
}

export function buildFeishuConfig(env = process.env) {
  const appId = env.FEISHU_APP_ID || "";
  const appSecret = env.FEISHU_APP_SECRET || "";
  const tenantAccessToken = env.FEISHU_TENANT_ACCESS_TOKEN || "";
  const spreadsheetToken = env.FEISHU_SPREADSHEET_TOKEN || "";
  const sheetId = env.FEISHU_SHEET_ID || "";
  const range = env.FEISHU_RANGE || "A:D";

  return {
    appId,
    appSecret,
    tenantAccessToken,
    spreadsheetToken,
    range: buildSheetRange({ sheetId, range })
  };
}

export function validateFeishuConfig(config) {
  if (!config.spreadsheetToken) {
    throw new FeishuImportError("请配置 FEISHU_SPREADSHEET_TOKEN。Wiki 链接不能直接替代表格 token。");
  }

  if (!config.range) {
    throw new FeishuImportError("请配置 FEISHU_SHEET_ID 或带 sheet 前缀的 FEISHU_RANGE，例如 Sheet1!A:D。");
  }

  if (!config.tenantAccessToken && (!config.appId || !config.appSecret)) {
    throw new FeishuImportError(
      "请配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET，或直接配置 FEISHU_TENANT_ACCESS_TOKEN。"
    );
  }
}

export async function fetchFeishuNovelRows(config, fetchImpl = fetch) {
  validateFeishuConfig(config);
  const tenantAccessToken =
    config.tenantAccessToken || (await fetchTenantAccessToken(config, fetchImpl));
  const values = await fetchSpreadsheetValues(
    {
      spreadsheetToken: config.spreadsheetToken,
      range: config.range,
      tenantAccessToken
    },
    fetchImpl
  );
  return valuesToObjects(values);
}

export async function fetchTenantAccessToken(config, fetchImpl = fetch) {
  const response = await fetchImpl(`${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret
    })
  });
  const json = await readFeishuJson(response, "获取 tenant_access_token 失败");
  const token = json.tenant_access_token || json.data?.tenant_access_token;

  if (!token) {
    throw new FeishuImportError("飞书未返回 tenant_access_token。");
  }

  return token;
}

export async function fetchSpreadsheetValues({ spreadsheetToken, range, tenantAccessToken }, fetchImpl = fetch) {
  const encodedRange = encodeURIComponent(range);
  const url = `${FEISHU_API_BASE}/sheets/v2/spreadsheets/${spreadsheetToken}/values/${encodedRange}`;
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${tenantAccessToken}`,
      "content-type": "application/json"
    }
  });
  const json = await readFeishuJson(response, "读取飞书表格失败");
  const values =
    json.data?.valueRange?.values ||
    json.data?.valueRanges?.[0]?.values ||
    json.data?.values ||
    json.valueRange?.values ||
    [];

  if (!Array.isArray(values)) {
    throw new FeishuImportError("飞书表格响应不包含 values 二维数组。");
  }

  return values;
}

export function valuesToObjects(values) {
  const rows = values.filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim()));
  if (rows.length < 2) return [];

  const headers = rows[0].map((cell) => String(cell ?? "").trim());
  return rows.slice(1).map((row) =>
    headers.reduce((acc, header, index) => {
      if (header) acc[header] = row[index] == null ? "" : String(row[index]).trim();
      return acc;
    }, {})
  );
}

async function readFeishuJson(response, fallbackMessage) {
  const text = await response.text();
  let json;

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new FeishuImportError(`${fallbackMessage}：响应不是 JSON。`);
  }

  const code = Number(json.code ?? 0);
  if (!response.ok || code !== 0) {
    throw new FeishuImportError(`${fallbackMessage}：HTTP ${response.status}，code=${json.code ?? ""}，msg=${json.msg || ""}`);
  }

  return json;
}

function buildSheetRange({ sheetId, range }) {
  const trimmed = String(range || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("!")) return trimmed;
  if (!sheetId) return "";
  return `${sheetId}!${trimmed}`;
}
