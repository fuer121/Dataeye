#!/usr/bin/env node
import {
  assessRankingReadiness,
  extractRankingArrays,
  listCaptureFiles,
  matchesRequestSource,
  parseCaptureFiles,
  rel,
  sanitizeForDisplay,
  sortRankingCandidates,
  summarizeCaptureFreshness,
  summarizeHeaders,
  writeMarkdown
} from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const candidates = sortRankingCandidates(
  requests.filter((request) => request.isLikelyRanking && matchesRequestSource(request, args.source))
).slice(0, 20);

const markdown = renderAnalysis({ files, requests, candidates, errors, source: args.source });
const output = writeMarkdown("request-analysis.md", markdown);

console.log(`Capture files: ${files.length}`);
console.log(`Parsed requests: ${requests.length}`);
console.log(`Candidate ranking requests: ${candidates.length}`);
console.log(`Wrote ${rel(output)}`);

function renderAnalysis({ files, requests, candidates, errors, source }) {
  const now = new Date().toISOString();

  if (files.length === 0) {
    return `# 请求抓包分析

生成时间：${now}

## 结论

当前 /captures 目录下没有可分析的 HAR、JSON、txt 或 curl 文件。

请把 Chrome DevTools HAR、微信开发者工具 Network 导出、cURL 文本或 response JSON 放入：

\`\`\`text
captures/
\`\`\`

然后重新运行：

\`\`\`bash
npm run capture:analyze
\`\`\`
`;
  }

  return `# 请求抓包分析

生成时间：${now}

## 输入文件

${files.map((file) => `- \`${rel(file)}\``).join("\n")}

## 解析概览

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${files.length} |
| 解析到的请求 | ${requests.length} |
| 疑似榜单请求 | ${candidates.length} |
| 字段映射就绪请求 | ${candidates.filter((request) => assessRankingReadiness(request.responseBody).ready).length} |
| 解析错误 | ${errors.length} |
| 来源过滤 | ${source || "全部"} |

${renderErrors(errors)}

## 疑似榜单接口

${renderCandidates(candidates)}

## 全部请求摘要

${renderRequestTable(requests.slice(0, 100))}

## 说明

- Cookie、Authorization、Token 等敏感值已掩码，只显示是否存在和前后 4 位。
- 该文档只做候选识别，不代表真实接口已经验证成功。
- 下一步运行 \`npm run capture:validate\`，脚本会尝试用最小 Header 集合复现候选请求。
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

function renderErrors(errors) {
  if (!errors.length) return "";
  return `## 解析错误

${errors.map((error) => `- \`${rel(error.filePath)}\`: ${error.message}`).join("\n")}
`;
}

function renderCandidates(candidates) {
  if (!candidates.length) {
    return "未识别到疑似榜单接口。请确认抓包文件中包含榜单列表请求，而不是只有页面资源或静态文件。";
  }

  return candidates
    .map((request, index) => {
      const arrays = extractRankingArrays(request.responseBody);
      const firstArray = arrays[0] || [];
      const firstItem = firstArray[0] || {};
      const readiness = assessRankingReadiness(request.responseBody);
      const freshness = summarizeCaptureFreshness(request);
      return `### 候选 ${index + 1}: ${request.method} ${request.url}

| 项 | 内容 |
| --- | --- |
| 来源 | \`${rel(request.sourceFile)}\` |
| 请求 ID | \`${request.id}\` |
| 捕获时间 | ${freshness.capturedAt || "未知"} |
| 距今 | ${freshness.ageLabel}（${freshness.note}） |
| 评分 | ${request.score} |
| HTTP 方法 | ${request.method} |
| 响应状态 | ${request.responseStatus ?? "未提供"} |
| 包含 Cookie | ${request.hasCookie ? "是" : "否"} |
| 包含 Authorization | ${request.hasAuthorization ? "是" : "否"} |
| 包含 Token Header | ${request.hasToken ? "是" : "否"} |
| 响应疑似榜单数组 | ${request.hasLikelyRankingArray ? "是" : "否"} |
| 榜单条数 | ${firstArray.length || "未识别"} |
| 字段映射就绪 | ${readiness.ready ? "是" : "否"} |
| 缺失字段 | ${readiness.missing.length ? readiness.missing.join(", ") : "无"} |

Headers:

${renderHeaders(request)}

Payload:

\`\`\`text
${truncate(request.payload || "<empty>", 2000)}
\`\`\`

首条榜单字段：

\`\`\`json
${JSON.stringify(sanitizeForDisplay(firstItem), null, 2)}
\`\`\`

目标字段映射：

${renderReadiness(readiness)}
`;
    })
    .join("\n");
}

function renderRequestTable(requests) {
  if (!requests.length) return "未解析到请求。";
  const rows = requests.map(
    (request) =>
      `| \`${request.id}\` | ${request.score} | ${request.isLikelyRanking ? "是" : "否"} | ${request.method} | ${request.responseStatus ?? ""} | ${request.hasCookie ? "是" : "否"} | ${request.hasAuthorization ? "是" : "否"} | ${request.hasToken ? "是" : "否"} | ${request.url} |`
  );
  return `| 请求 ID | 评分 | 疑似榜单 | 方法 | 状态 | Cookie | Auth | Token | URL |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
${rows.join("\n")}`;
}

function renderHeaders(request) {
  const headers = summarizeHeaders(request.headers);
  if (!headers.length) return "无请求 Header。";
  return `| Header | 值 |
| --- | --- |
${headers.map((header) => `| \`${header.name}\` | \`${escapePipes(truncate(header.value, 180))}\` |`).join("\n")}`;
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

function truncate(value, length) {
  const text = String(value ?? "");
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...<truncated>`;
}

function escapePipes(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
