#!/usr/bin/env node
import {
  assessRankingReadiness,
  containsLikelyRankingArray,
  extractRankingArrays,
  hasRedactedSensitiveValue,
  listCaptureFiles,
  maskSensitiveValue,
  matchesRequestSource,
  minimalHeaders,
  parseCaptureFiles,
  readRuntimeEnv,
  rel,
  sanitizeForDisplay,
  sanitizeText,
  sortRankingCandidates,
  summarizeHeaders,
  summarizeCaptureFreshness,
  tryParseJson,
  writeMarkdown
} from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const env = readRuntimeEnv({ envFile: args.envFile });
const candidates = sortRankingCandidates(
  requests.filter((request) => request.isLikelyRanking && matchesRequestSource(request, args.source))
);

const results = [];
if (files.length > 0 && candidates.length > 0) {
  for (const request of candidates.slice(0, 5)) {
    results.push(await validateRequest(request, env));
  }
}

const output = writeMarkdown(
  "request-validation.md",
  renderValidation({ files, requests, candidates, results, errors, env, source: args.source })
);

console.log(`Capture files: ${files.length}`);
console.log(`Candidate ranking requests: ${candidates.length}`);
console.log(`Validation attempts: ${results.length}`);
console.log(`Wrote ${rel(output)}`);

async function validateRequest(request, env) {
  const headers = minimalHeaders(request, env);
  const method = request.method || "GET";
  const init = { method, headers, redirect: "manual" };

  if (!["GET", "HEAD"].includes(method) && request.payload) {
    init.body = request.payload;
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(request.url, init);
    const responseText = await response.text();
    const parsed = tryParseJson(responseText);
    const arrays = extractRankingArrays(responseText);
    const readiness = assessRankingReadiness(responseText);

    return {
      request,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs: Date.now() - startedAt,
      headers,
      responseText,
      responseJson: parsed,
      hasRankingArray: containsLikelyRankingArray(responseText),
      rankingCount: arrays[0]?.length || 0,
      firstRankingItem: arrays[0]?.[0] || null,
      readiness,
      error: null
    };
  } catch (error) {
    return {
      request,
      ok: false,
      status: null,
      statusText: "",
      durationMs: Date.now() - startedAt,
      headers,
      responseText: "",
      responseJson: null,
      hasRankingArray: false,
      rankingCount: 0,
      firstRankingItem: null,
      readiness: {
        hasRankingArray: false,
        rankingCount: 0,
        fields: {},
        missing: ["rank", "title", "heatValue", "dramaType"],
        ready: false,
        firstItem: null
      },
      error: error.message
    };
  }
}

function renderValidation({ files, requests, candidates, results, errors, env, source }) {
  const now = new Date().toISOString();

  if (files.length === 0) {
    return `# 请求复现验证

生成时间：${now}

## 结论

当前 /captures 目录下没有可验证的 HAR、JSON、txt 或 curl 文件。

请先放入抓包材料，然后运行：

\`\`\`bash
npm run capture:analyze
npm run capture:validate
\`\`\`
`;
  }

  if (candidates.length === 0) {
    return `# 请求复现验证

生成时间：${now}

## 结论

已读取 /captures 文件，但没有识别到疑似榜单请求，因此未发起复现请求。

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${files.length} |
| 解析请求 | ${requests.length} |
| 解析错误 | ${errors.length} |
| 来源过滤 | ${source || "全部"} |

请确认抓包中包含榜单列表接口，而不是只有页面、JS、图片等静态资源。
`;
  }

  const success = results.find(
    (result) => result.status >= 200 && result.status < 300 && result.hasRankingArray && result.readiness.ready
  );

  return `# 请求复现验证

生成时间：${now}

## 结论

${success ? "已成功获取可映射的疑似真实榜单数组，当前登录态可用于真实采集验证。" : "尚未成功获取可映射的真实榜单数组。不要执行真实采集落库，也不要宣称真实采集成功。"}

## 环境登录态

来源过滤：${source || "全部"}

环境文件：${env.__ENV_FILE ? `\`${env.__ENV_FILE}\`（${env.__ENV_FILE_EXISTS ? "存在" : "不存在"}）` : "默认 .env.local / 当前进程环境"}

| 变量 | 状态 |
| --- | --- |
| DATAEYE_COOKIE | ${env.DATAEYE_COOKIE ? maskSensitiveValue(env.DATAEYE_COOKIE) : "未提供"} |
| DATAEYE_AUTHORIZATION | ${env.DATAEYE_AUTHORIZATION ? maskSensitiveValue(env.DATAEYE_AUTHORIZATION) : "未提供"} |
| DATAEYE_SESSION | ${env.DATAEYE_SESSION ? maskSensitiveValue(env.DATAEYE_SESSION) : "未提供"} |
| DATAEYE_AUTHENTICATION | ${env.DATAEYE_AUTHENTICATION ? maskSensitiveValue(env.DATAEYE_AUTHENTICATION) : "未提供"} |
| DATAEYE_LOGIN_USER_ID | ${env.DATAEYE_LOGIN_USER_ID ? maskSensitiveValue(env.DATAEYE_LOGIN_USER_ID) : "未提供"} |
| DATAEYE_S | ${env.DATAEYE_S ? maskSensitiveValue(env.DATAEYE_S) : "未提供"} |
| DATAEYE_REFERER | ${env.DATAEYE_REFERER ? "已提供" : "未提供"} |
| DATAEYE_USER_AGENT | ${env.DATAEYE_USER_AGENT ? "已提供" : "未提供"} |
| DATAEYE_TOKEN | ${env.DATAEYE_TOKEN ? maskSensitiveValue(env.DATAEYE_TOKEN) : "未提供"} |
| HONGGUO_COOKIE | ${env.HONGGUO_COOKIE ? maskSensitiveValue(env.HONGGUO_COOKIE) : "未提供"} |
| HONGGUO_AUTHORIZATION | ${env.HONGGUO_AUTHORIZATION ? maskSensitiveValue(env.HONGGUO_AUTHORIZATION) : "未提供"} |
| HONGGUO_SESSION | ${env.HONGGUO_SESSION ? maskSensitiveValue(env.HONGGUO_SESSION) : "未提供"} |
| HONGGUO_TOKEN | ${env.HONGGUO_TOKEN ? maskSensitiveValue(env.HONGGUO_TOKEN) : "未提供"} |

## 验证结果

${results.map(renderResult).join("\n")}

## 失败排查

${renderFailureAdvice(results)}
`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--login-env-file") {
      parsed.envFile = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function renderResult(result, index) {
  const request = result.request;
  const redacted = hasRedactedSensitiveValue(request);
  const freshness = summarizeCaptureFreshness(request);
  return `### 尝试 ${index + 1}: ${request.method} ${request.url}

| 项 | 内容 |
| --- | --- |
| 来源 | \`${rel(request.sourceFile)}\` |
| 请求 ID | \`${request.id}\` |
| 捕获时间 | ${freshness.capturedAt || "未知"} |
| 距今 | ${freshness.ageLabel}（${freshness.note}） |
| HTTP 状态码 | ${result.status ?? "请求失败"} |
| 状态文本 | ${result.statusText || result.error || ""} |
| 耗时 | ${result.durationMs} ms |
| 原始请求含脱敏敏感值 | ${redacted ? "是" : "否"} |
| 是否包含榜单数组 | ${result.hasRankingArray ? "是" : "否"} |
| 榜单条数 | ${result.rankingCount} |
| 字段映射就绪 | ${result.readiness.ready ? "是" : "否"} |
| 缺失字段 | ${result.readiness.missing.length ? result.readiness.missing.join(", ") : "无"} |

最小 Header:

${renderHeaders(result.headers)}

响应 JSON 结构:

\`\`\`json
${JSON.stringify(summarizeJson(result.responseJson), null, 2)}
\`\`\`

首条榜单字段:

\`\`\`json
${JSON.stringify(sanitizeForDisplay(result.firstRankingItem || {}), null, 2)}
\`\`\`

目标字段映射:

${renderReadiness(result.readiness)}

响应片段:

\`\`\`text
${truncate(sanitizeText(result.responseText || result.error || ""), 2000)}
\`\`\`
`;
}

function renderHeaders(headers) {
  const rows = summarizeHeaders(headers);
  if (!rows.length) return "无。";
  return `| Header | 值 |
| --- | --- |
${rows.map((header) => `| \`${header.name}\` | \`${escapePipes(truncate(header.value, 180))}\` |`).join("\n")}`;
}

function renderReadiness(readiness) {
  const rows = ["rank", "title", "heatValue", "dramaType"].map((name) => {
    const field = readiness.fields[name];
    return `| \`${name}\` | ${field ? "是" : "否"} | ${field?.key || ""} | ${field?.sample ? escapePipes(truncate(field.sample, 120)) : ""} |`;
  });

  return `| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
${rows.join("\n")}`;
}

function renderFailureAdvice(results) {
  if (results.some((result) => result.hasRankingArray && !result.readiness.ready)) {
    return "- 已拿到榜单数组，但字段映射不完整。请补充响应样本，或人工确认缺失字段对应关系后再开发采集器。";
  }

  if (results.some((result) => result.hasRankingArray && result.readiness.ready)) {
    return "已拿到可映射榜单数组，可基于本次结果整理 `docs/api-spec.md` 并进入采集器开发。";
  }

  const statuses = new Set(results.map((result) => result.status).filter(Boolean));
  if (results.some((result) => Number(result.responseJson?.statusCode) === 401)) {
    return `- HTTP 状态码为 200，但接口业务状态 \`statusCode=401\`：小程序登录态已失效。
- 请重新打开剧查查小程序并导出最新 HAR/cURL，或在 \`.env.local\` 中补充当前有效的 \`DATAEYE_AUTHENTICATION\`、\`DATAEYE_LOGIN_USER_ID\` 和必要的 \`DATAEYE_S\`。
- 当前验证未拿到榜单数组，不要把本次复现结果视为真实采集成功。`;
  }

  if (statuses.has(401) || statuses.has(403)) {
    return `- 返回 401/403：Cookie、Session、Authorization 或 Token 可能缺失、脱敏或已失效。
- 请在 \`.env.local\` 中提供当前有效值，或重新导出未过期 HAR/cURL。
- 如果请求体中包含 \`sign\`、\`thisTimes\` 等字段，请确认抓包提供的是完整原始 payload。`;
  }

  if (results.some((result) => result.error)) {
    return "- 请求发送失败：请检查 URL 是否完整、网络是否可访问、抓包是否为有效 HTTP 请求。";
  }

  return "- 请求返回了 JSON/文本，但未识别到榜单数组。请确认提供的是榜单列表请求，不是日期接口、详情接口或页面资源。";
}

function summarizeJson(value) {
  if (!value || typeof value !== "object") return value || null;
  if (Array.isArray(value)) return [`array(${value.length})`, summarizeJson(value[0])];

  const summary = {};
  for (const [key, child] of Object.entries(value).slice(0, 30)) {
    if (Array.isArray(child)) {
      summary[key] = [`array(${child.length})`, summarizeJson(child[0])];
    } else if (child && typeof child === "object") {
      summary[key] = summarizeJson(child);
    } else {
      summary[key] = typeof child;
    }
  }
  return summary;
}

function truncate(value, length) {
  const text = String(value ?? "");
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...<truncated>`;
}

function escapePipes(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
