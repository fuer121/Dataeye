#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

import {
  assessRankingReadiness,
  getRequestDate,
  listCaptureFiles,
  maskSensitiveValue,
  parseCaptureFiles,
  rel,
  ROOT_DIR,
  summarizeCaptureFreshness,
  writeMarkdown
} from "./capture-utils.js";
import {
  compareDataEyeMotionComicRequests,
  getDataEyeRequestRankingDate,
  isDataEyeMotionComicRequest
} from "../lib/dataeye-capture-target.js";

const args = parseArgs(process.argv.slice(2));
const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const candidates = requests.filter((request) => request.isLikelyRanking && isDataEyeMotionComicRequest(request)).sort(compareDataEyeMotionComicRequests);
const selected = candidates[0] || null;
const localEnvPath = args.writeLocal && selected ? writeLocalEnvFile(selected) : "";
const output = writeMarkdown(
  "live-env-template.md",
  renderTemplate({ files, requests, errors, selected, localEnvPath })
);

console.log(`Capture files: ${files.length}`);
console.log(`Parsed requests: ${requests.length}`);
console.log(`Target candidates: ${candidates.length}`);
if (localEnvPath) console.log(`Wrote ${rel(localEnvPath)} with sensitive local values`);
console.log(`Wrote ${rel(output)}`);

function renderTemplate({ files, requests, errors, selected, localEnvPath }) {
  const now = new Date().toISOString();

  if (!files.length) {
    return `# DataEye 真实采集环境变量模板

生成时间：${now}

## 状态

当前 \`captures/\` 下没有 HAR、JSON、txt 或 cURL 文件，无法提取环境变量线索。
`;
  }

  if (!selected) {
    return `# DataEye 真实采集环境变量模板

生成时间：${now}

## 状态

未找到 \`playlet-applet.dataeye.com/playlet/motionComic\` 目标请求。

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${files.length} |
| 解析请求 | ${requests.length} |
| 解析错误 | ${errors.length} |
`;
  }

  const envRows = buildEnvRows(selected);
  const readiness = assessRankingReadiness(selected.responseBody);
  const freshness = summarizeCaptureFreshness(selected);

  return `# DataEye 真实采集环境变量模板

生成时间：${now}

## 目标请求

| 项 | 内容 |
| --- | --- |
| 来源文件 | \`${rel(selected.sourceFile)}\` |
| 请求 ID | \`${selected.id}\` |
| 方法 | ${selected.method} |
| URL | ${selected.url} |
| 捕获时间 | ${freshness.capturedAt || "未知"} |
| 距今 | ${freshness.ageLabel}（${freshness.note}） |
| 抓包响应状态 | ${selected.responseStatus ?? "未提供"} |
| 抓包字段映射就绪 | ${readiness.ready ? "是" : "否"} |

## 建议写入 .env.local

以下值来自抓包 Header 的存在性和掩码预览。敏感值不会完整输出；请从 Charles/HAR 原请求中复制完整值到 \`.env.local\`。

\`\`\`bash
${envRows.map((row) => `${row.key}=${row.placeholder}`).join("\n")}
\`\`\`

## Header 对照

| 环境变量 | Header | 抓包状态 |
| --- | --- | --- |
${envRows.map((row) => `| ${row.key} | ${row.header} | ${row.status} |`).join("\n")}

## 可选本地导出

${localEnvPath ? `已按显式参数生成本地配置草稿：\`${rel(localEnvPath)}\`。该文件包含敏感值，只用于本机人工核对；确认后可复制到 \`.env.local\`，不要提交。` : `如需从本次目标请求生成包含完整 Header 值的本地配置草稿，可运行：

\`\`\`bash
npm run capture:env -- --write-local
\`\`\`

该命令会写入 \`.env.local.dataeye\`，不会把敏感值写入 docs。`}

## 使用方式

1. 将上方变量填入项目根目录 \`.env.local\`。
2. 先运行只读预检：

\`\`\`bash
npm run collect:preview -- --date ${getRequestDay(selected) || "2026-06-05"}
\`\`\`

如已生成 \`.env.local.dataeye\` 草稿，也可以先不复制，直接显式指定本地登录态文件：

\`\`\`bash
npm run capture:validate -- --login-env-file .env.local.dataeye
npm run collect:preview -- --date ${getRequestDay(selected) || "2026-06-05"} --source dataeye --login-env-file .env.local.dataeye
\`\`\`

3. 预检拿到榜单数组后，再用同一份登录态执行 live 落库：

\`\`\`bash
npm run collect:live -- --date ${getRequestDay(selected) || "2026-06-05"} --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
\`\`\`
`;
}

function writeLocalEnvFile(request) {
  const outputPath = path.join(ROOT_DIR, ".env.local.dataeye");
  const envRows = buildEnvRows(request);
  const lines = [
    "# Generated from local capture material by npm run capture:env -- --write-local",
    "# Contains sensitive mini-program login values. Keep this file local.",
    "# Copy verified values into .env.local before running collect:preview.",
    "",
    ...envRows.map((row) => `${row.key}=${escapeEnvValue(row.value || "")}`),
    ""
  ];
  fs.writeFileSync(outputPath, lines.join("\n"), { mode: 0o600 });
  return outputPath;
}

function buildEnvRows(request) {
  const headers = request.headers || {};
  return [
    envRow("DATAEYE_AUTHENTICATION", "authentication", headers.authentication, true),
    envRow("DATAEYE_LOGIN_USER_ID", "loginUserId", headers.loginuserid, true),
    envRow("DATAEYE_S", "S", headers.s, false),
    envRow("DATAEYE_REFERER", "referer", headers.referer, false),
    envRow("DATAEYE_USER_AGENT", "user-agent", headers["user-agent"], false),
    envRow("DATAEYE_COOKIE", "cookie", headers.cookie, false),
    envRow("DATAEYE_AUTHORIZATION", "authorization", headers.authorization, false),
    envRow("DATAEYE_TOKEN", "token", headers.token, false)
  ];
}

function envRow(key, header, value, required) {
  const present = Boolean(value);
  const masked = present ? maskSensitiveValue(value) : "未提供";
  return {
    key,
    header,
    value: present ? value : "",
    placeholder: required ? `<从 ${header} 复制完整值>` : "",
    status: present ? masked : "未提供"
  };
}

function parseArgs(argv) {
  return {
    writeLocal: argv.includes("--write-local")
  };
}

function escapeEnvValue(value) {
  const text = String(value ?? "");
  if (!text) return "";
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) return text;
  return JSON.stringify(text);
}

function getRequestDay(request) {
  return getDataEyeRequestRankingDate(request) || getRequestDate(request);
}
