#!/usr/bin/env node
import {
  assessRankingReadiness,
  auditCaptureMaterial,
  listCaptureFiles,
  parseCaptureFiles,
  rel,
  summarizeCaptureFreshness,
  writeMarkdown
} from "./capture-utils.js";

const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const audit = auditCaptureMaterial({ files, requests, errors });
const output = writeMarkdown(
  "capture-material-audit.md",
  renderAudit({ files, requests, errors, audit })
);

console.log(`Capture files: ${files.length}`);
console.log(`Parsed requests: ${requests.length}`);
console.log(`Audit issues: ${audit.issues.length}`);
console.log(`Wrote ${rel(output)}`);

function renderAudit({ files, requests, errors, audit }) {
  const now = new Date().toISOString();
  const readyRequests = requests.filter(
    (request) => request.isLikelyRanking && assessRankingReadiness(request.responseBody).ready
  );
  return `# 抓包材料质量审计

生成时间：${now}

## 结论

${audit.ok ? "抓包材料结构审计通过。仍需结合验证报告确认接口可复现。" : "抓包材料尚不满足进入真实采集器开发的要求。"}

## 概览

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${audit.counts.files} |
| 解析请求 | ${audit.counts.requests} |
| 解析错误 | ${audit.counts.parseErrors} |
| 疑似榜单请求 | ${audit.counts.likelyRankingRequests} |
| 可映射榜单请求 | ${audit.counts.readyRankingRequests} |
| 审计问题 | ${audit.issues.length} |

## 审计问题

${renderIssues(audit.issues)}

## 抓包新鲜度

${renderFreshnessTable(readyRequests)}

## 输入文件

${files.length ? files.map((file) => `- \`${rel(file)}\``).join("\n") : "当前没有抓包文件。"}

## 解析错误

${errors.length ? errors.map((error) => `- \`${rel(error.filePath)}\`: ${error.message}`).join("\n") : "无。"}

## 说明

- Cookie、Authorization、Token、Session 可以脱敏。
- URL、Method、Header 名称、Content-Type、日期参数、分页参数、榜单类型、sign、timestamp 不能脱敏。
- 响应 JSON 字段名和至少一条榜单数据行不能脱敏。
- 该审计只判断材料完整度，不代表真实接口已经接入。
`;
}

function renderFreshnessTable(requests) {
  if (!requests.length) return "暂无可映射榜单候选。";

  const rows = requests.slice(0, 10).map((request) => {
    const freshness = summarizeCaptureFreshness(request);
    return `| \`${request.id}\` | ${freshness.capturedAt || "未知"} | ${freshness.ageLabel} | ${freshness.note} |`;
  });

  return `| 请求 ID | 捕获时间 | 距今 | 提示 |
| --- | --- | --- | --- |
${rows.join("\n")}`;
}

function renderIssues(issues) {
  if (!issues.length) return "无。";

  return `| 代码 | 问题 | 处理建议 |
| --- | --- | --- |
${issues.map((item) => `| \`${item.code}\` | ${escapePipes(item.title)} | ${escapePipes(item.detail)} |`).join("\n")}`;
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
