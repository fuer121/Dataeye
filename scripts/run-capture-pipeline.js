#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assessRankingReadiness,
  auditCaptureMaterial,
  describeEnvFile,
  listCaptureFiles,
  matchesRequestSource,
  parseCaptureFiles,
  rel,
  summarizeCaptureFreshness,
  writeMarkdown
} from "./capture-utils.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const loginEnvArgs = args.envFile ? ["--login-env-file", args.envFile] : [];
const sourceArgs = args.source ? ["--source", args.source] : [];
const envFileStatus = describeEnvFile(args.envFile);
const steps = [
  { name: "preflight", command: "node", args: [scriptPath("capture-preflight.js"), ...loginEnvArgs] },
  { name: "audit", command: "node", args: [scriptPath("audit-capture-material.js")] },
  { name: "analyze", command: "node", args: [scriptPath("analyze-capture.js"), ...sourceArgs] },
  { name: "validate", command: "node", args: [scriptPath("validate-request.js"), ...loginEnvArgs, ...sourceArgs] },
  { name: "preview", command: "node", args: [scriptPath("extract-ranking-preview.js"), ...sourceArgs] },
  { name: "spec", command: "node", args: [scriptPath("generate-api-spec.js"), ...sourceArgs] }
];

const results = steps.map(runStep);
const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const audit = auditCaptureMaterial({ files, requests, errors });
const readyCandidates = requests.filter(
  (request) =>
    request.isLikelyRanking &&
    matchesRequestSource(request, args.source) &&
    assessRankingReadiness(request.responseBody).ready
);
const output = writeMarkdown(
  "capture-pipeline.md",
  renderPipeline({ files, requests, errors, audit, readyCandidates, results, envFileStatus, source: args.source })
);
const hasFailure = results.some((result) => result.status !== 0);

console.log(`Wrote ${rel(output)}`);
if (hasFailure) process.exitCode = 1;

function runStep(step) {
  const startedAt = Date.now();
  const child = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  process.stdout.write(child.stdout || "");
  process.stderr.write(child.stderr || "");

  return {
    ...step,
    status: child.status ?? 1,
    durationMs: Date.now() - startedAt,
    stdout: child.stdout || "",
    stderr: child.stderr || ""
  };
}

function scriptPath(fileName) {
  return path.join(SCRIPT_DIR, fileName);
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

function renderPipeline({ files, requests, errors, audit, readyCandidates, results, envFileStatus, source }) {
  const now = new Date().toISOString();
  return `# 抓包流水线总览

生成时间：${now}

## 结论

${renderConclusion({ files, requests, errors, audit, readyCandidates, results })}

## 执行步骤

| 步骤 | 命令 | 状态 | 耗时 |
| --- | --- | ---: | ---: |
${results.map((result) => `| ${result.name} | \`${renderCommand(result)}\` | ${result.status} | ${result.durationMs} ms |`).join("\n")}

## 抓包材料

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${files.length} |
| 解析请求 | ${requests.length} |
| 解析错误 | ${errors.length} |
| 可映射榜单候选 | ${readyCandidates.length} |
| 材料审计问题 | ${audit.issues.length} |
| 来源过滤 | ${source || "全部"} |

${files.length ? files.map((file) => `- \`${rel(file)}\``).join("\n") : "当前没有 HAR、JSON、txt 或 curl 抓包材料。"}

## 登录态文件

${envFileStatus.label}

## 来源过滤

${source || "全部"}

## 抓包新鲜度

${renderFreshnessTable(readyCandidates)}

## 下一步

${renderNextStep({ files, audit, readyCandidates, results })}

## 相关报告

- \`docs/capture-preflight.md\`
- \`docs/capture-material-audit.md\`
- \`docs/request-analysis.md\`
- \`docs/request-validation.md\`
- \`docs/ranking-preview.md\`
- \`docs/api-spec.md\`
`;
}

function renderCommand(result) {
  return `${result.command} ${result.args.map((arg) => (arg.startsWith(process.cwd()) ? rel(arg) : arg)).join(" ")}`;
}

function renderConclusion({ files, requests, errors, audit, readyCandidates, results }) {
  if (results.some((result) => result.status !== 0)) {
    return "流水线脚本执行失败。请先查看下方步骤状态和 stderr。";
  }

  if (files.length === 0) {
    return "流水线已运行，但当前没有抓包材料。不要进入真实采集器开发。";
  }

  if (!audit.ok) {
    return "抓包材料已读取，但材料质量审计未通过。请先查看 `docs/capture-material-audit.md`。";
  }

  if (errors.length > 0 && requests.length === 0) {
    return "抓包文件存在，但解析失败。请检查 HAR/JSON/cURL 文件格式。";
  }

  if (readyCandidates.length === 0) {
    return "抓包文件已解析，但没有可映射的榜单候选。请补充剧查查小程序漫剧热播榜列表接口。";
  }

  if (hasAgingCapture(readyCandidates)) {
    return "已识别抓包响应中的可映射榜单候选，但候选抓包可能已经偏旧。建议重新抓取新鲜 HAR，再验证 live HTTP 复现。";
  }

  return "已识别抓包响应中的可映射榜单候选。请结合 `docs/request-validation.md` 确认 HTTP 复现同时满足 2xx、返回榜单数组、字段映射就绪，再决定是否执行真实采集落库；CLI 落库还需要显式传入 `--confirmed-preview`。";
}

function renderNextStep({ files, audit, readyCandidates, results }) {
  if (results.some((result) => result.status !== 0)) {
    return "- 修复失败步骤后重新运行 `npm run capture:pipeline`。";
  }

  if (files.length === 0) {
    return `- 在 iPhone Wi-Fi 代理里填入 \`docs/capture-preflight.md\` 的本机 IP 和端口。
- 按 \`docs/dataeye-miniprogram-capture-runbook.md\` 抓剧查查小程序「漫剧热播榜 + 日榜」。
- 将 HAR 或 cURL 保存到 \`captures/\` 后重新运行 \`npm run capture:pipeline\`。`;
  }

  if (!audit.ok) {
    return "- 打开 `docs/capture-material-audit.md`，按审计问题补抓或重新导出材料。";
  }

  if (readyCandidates.length === 0) {
    return "- 打开 `docs/request-analysis.md`，确认是否抓到了榜单列表接口；如果没有，补抓列表接口、日期接口和分页接口。";
  }

  if (hasAgingCapture(readyCandidates)) {
    return `- 当前可映射榜单候选的抓包时间可能偏旧，优先重新抓取剧查查小程序「漫剧热播榜 + 日榜」HAR。
- 新 HAR 放入 \`captures/\` 后重新运行 \`npm run capture:pipeline\`。
- 如确认为新鲜登录态，再运行 \`npm run capture:env -- --write-local\` 和 \`npm run collect:preview -- --date <日期> --source dataeye --login-env-file .env.local.dataeye\`。`;
  }

  return "- 打开 `docs/ranking-preview.md` 核对抓包中的榜单行，再看 `docs/request-validation.md` 确认当前登录态能复现榜单数组且字段映射就绪；满足后再执行带 `--confirmed-preview` 的 live 采集落库。";
}

function hasAgingCapture(requests) {
  return requests.some((request) => {
    const freshness = summarizeCaptureFreshness(request);
    return ["aging", "stale", "unknown"].includes(freshness.status);
  });
}

function renderFreshnessTable(requests) {
  if (!requests.length) return "暂无可映射榜单候选。";

  const rows = requests.slice(0, 10).map((request) => {
    const freshness = summarizeCaptureFreshness(request);
    return `| \`${request.id}\` | ${freshness.capturedAt || "未知"} | ${freshness.ageLabel} | ${freshness.note} | ${request.url} |`;
  });

  return `| 请求 ID | 捕获时间 | 距今 | 提示 | URL |
| --- | --- | --- | --- | --- |
${rows.join("\n")}`;
}
