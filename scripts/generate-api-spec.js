#!/usr/bin/env node
import {
  assessRankingReadiness,
  detectRequestSource,
  listCaptureFiles,
  matchesRequestSource,
  parseCaptureFiles,
  rel,
  sanitizeForDisplay,
  sortRankingCandidates,
  summarizeHeaders,
  writeMarkdown
} from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const readyCandidates = requests
  .map((request) => ({ request, readiness: assessRankingReadiness(request.responseBody) }))
  .filter(({ request, readiness }) => request.isLikelyRanking && readiness.ready && matchesRequestSource(request, args.source))
  .sort(compareReadyCandidates);

const output = writeMarkdown(
  "api-spec.md",
  renderSpec({ files, requests, readyCandidates, errors, source: args.source })
);

console.log(`Capture files: ${files.length}`);
console.log(`Parsed requests: ${requests.length}`);
console.log(`Ready ranking candidates: ${readyCandidates.length}`);
console.log(`Wrote ${rel(output)}`);

function renderSpec({ files, requests, readyCandidates, errors, source }) {
  const now = new Date().toISOString();

  if (files.length === 0) {
    return `# 榜单 API 规格草稿

生成时间：${now}

## 状态

未生成 API 规格。当前 \`/captures\` 目录下没有 HAR、JSON、txt 或 curl 文件。

请先按 \`docs/dataeye-miniprogram-capture-runbook.md\` 放入抓包材料，然后运行：

\`\`\`bash
npm run capture:analyze
npm run capture:validate
npm run capture:spec
\`\`\`
`;
  }

  if (readyCandidates.length === 0) {
    return `# 榜单 API 规格草稿

生成时间：${now}

## 状态

未生成可用于采集器开发的 API 规格。

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${files.length} |
| 解析请求 | ${requests.length} |
| 解析错误 | ${errors.length} |
| 可映射榜单候选 | 0 |
| 来源过滤 | ${source || "全部"} |

原因：没有找到同时满足以下条件的请求：

- 疑似榜单接口。
- 响应包含榜单数组。
- 首条榜单能映射 \`rank\`、\`title\`、\`heatValue\`、\`dramaType\`。

请补充剧查查小程序「漫剧热播榜 + 日榜」的列表接口 HAR/cURL/响应 JSON。
`;
  }

  const selected = readyCandidates[0];
  const { request, readiness } = selected;
  const detectedSource = detectRequestSource(request) || "待人工确认";

  return `# 榜单 API 规格草稿

生成时间：${now}

## 状态

已从抓包材料中生成候选 API 规格草稿。该文档仍需结合 \`docs/request-validation.md\` 确认当前登录态是否能复现榜单数组；只有验证通过后，才可将本次登录态视为可用于真实采集落库。

## 候选接口

| 项 | 内容 |
| --- | --- |
| 来源文件 | \`${rel(request.sourceFile)}\` |
| 请求 ID | \`${request.id}\` |
| HTTP 方法 | ${request.method} |
| URL | ${request.url} |
| 抓包响应状态 | ${request.responseStatus ?? "未提供"} |
| 评分 | ${request.score} |
| 榜单条数 | ${readiness.rankingCount} |
| 识别来源 | ${detectedSource} |
| 来源过滤 | ${source || "全部"} |

## 请求 Header

${renderHeaders(request)}

## 请求 Payload

\`\`\`text
${truncate(request.payload || "<empty>", 4000)}
\`\`\`

## 字段映射

${renderFieldMapping(readiness)}

## 首条榜单样例

\`\`\`json
${JSON.stringify(sanitizeForDisplay(readiness.firstItem || {}), null, 2)}
\`\`\`

## 采集器落库映射

| 数据库字段 | 来源 |
| --- | --- |
| \`source\` | \`${detectedSource}\` |
| \`rankingDate\` | API 日期参数，第一版由采集入参传入 |
| \`rank\` | \`${readiness.fields.rank.key}\` |
| \`title\` | \`${readiness.fields.title.key}\` |
| \`heatValue\` | \`${readiness.fields.heatValue.key}\` |
| \`dramaType\` | \`${readiness.fields.dramaType.key}\` |
| \`sourceRef\` | 请求 URL |
| \`rawPayload\` | 完整原始榜单条目 |

## 启用门槛

- \`npm run capture:validate\` 必须显示 HTTP 状态码为 2xx，且业务响应包含榜单数组。
- \`docs/request-validation.md\` 必须显示字段映射就绪，目标字段 \`rank\`、\`title\`、\`heatValue\`、\`dramaType\` 均可识别。
- CLI live 落库必须显式传入 \`--confirmed-preview\`；API live 落库必须传入 \`confirmedPreview=true\`。
- 如果 HTTP 为 2xx 但响应业务状态为登录失效、无权限或未返回榜单数组，仍然不得执行真实采集落库。
- 同一日期重复验证结果应稳定。
- 登录态只允许从 \`.env.local\` 或运行环境变量读取。
- 未满足以上条件时，不要宣称真实采集成功，也不要用失败响应落库。
`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function compareReadyCandidates(a, b) {
  const sorted = sortRankingCandidates([a.request, b.request]);
  return sorted.indexOf(a.request) - sorted.indexOf(b.request);
}

function renderHeaders(request) {
  const headers = summarizeHeaders(request.headers);
  if (!headers.length) return "无请求 Header。";
  return `| Header | 值 |
| --- | --- |
${headers.map((header) => `| \`${header.name}\` | \`${escapePipes(truncate(header.value, 180))}\` |`).join("\n")}`;
}

function renderFieldMapping(readiness) {
  const rows = ["rank", "title", "heatValue", "dramaType"].map((name) => {
    const field = readiness.fields[name];
    return `| \`${name}\` | \`${field.key}\` | \`${escapePipes(truncate(field.sample, 120))}\` |`;
  });

  return `| 目标字段 | 响应字段 | 样例 |
| --- | --- | --- |
${rows.join("\n")}`;
}

function truncate(value, length) {
  const text = String(value ?? "");
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...<truncated>`;
}

function escapePipes(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
