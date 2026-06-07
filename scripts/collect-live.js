#!/usr/bin/env node
import { formatShanghaiDate, nowIso } from "../lib/date.js";
import { runCollection } from "../lib/collection.js";
import { normalizeCollectRequest } from "../lib/collectors/index.js";
import { insertCollectionRun } from "../lib/rankings.js";
import { describeEnvFile, maskSensitiveValue, readEnvFile, readEnvLocal, rel, writeMarkdown } from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const source = args.source || "dataeye";
const rankingDate = args.date || formatShanghaiDate(new Date());
const rankType = args.rankType || "0";
const period = args.period || "day";
const envFileStatus = describeEnvFile(args.envFile);

applyEnvFiles(args.envFile);

let result;
try {
  normalizeCollectRequest({ date: rankingDate, source, mode: "live", rankType, period });
  result = args.confirmedPreview
    ? await runCollection({ date: rankingDate, source, mode: "live", rankType, period })
    : buildUnconfirmedPreviewResult({ source, rankingDate });
} catch (error) {
  result = {
    runs: [],
    failed: true,
    setupError: error.message
  };
}

const output = writeMarkdown(
  "live-collection-run.md",
  renderRunReport({ source, rankingDate, rankType, period, result, envFileStatus, confirmedPreview: args.confirmedPreview })
);

console.log(`Source: ${source}`);
console.log(`Date: ${rankingDate}`);
console.log(`RankType: ${rankType}`);
console.log(`Period: ${period}`);
console.log(`Status: ${result.failed ? "failed" : "success"}`);
console.log(`Runs: ${result.runs.length}`);
console.log(`Wrote ${rel(output)}`);

if (result.failed) process.exitCode = 1;

function applyEnvFiles(envFile) {
  const env = {
    ...readEnvLocal(),
    ...readEnvFile(envFile)
  };
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

function buildUnconfirmedPreviewResult({ source, rankingDate }) {
  const startedAt = nowIso();
  const run = {
    source,
    rankingDate,
    mode: "live",
    status: "failed",
    message: "真实采集落库前需要先完成预检，并显式传入 --confirmed-preview。",
    insertedCount: 0,
    skippedCount: 0,
    startedAt,
    finishedAt: nowIso()
  };
  insertCollectionRun(run);
  return {
    runs: [run],
    failed: true,
    unconfirmedPreview: true
  };
}

function renderRunReport({ source, rankingDate, rankType, period, result, envFileStatus, confirmedPreview }) {
  const now = new Date().toISOString();
  const rows = result.runs.length
    ? result.runs
        .map(
          (run) =>
            `| ${run.source} | ${run.rankingDate} | ${run.mode} | ${run.status} | ${run.insertedCount} | ${run.skippedCount} | ${escapePipes(run.message)} |`
        )
        .join("\n")
    : "| - | - | - | failed | 0 | 0 | " + escapePipes(result.setupError || "采集请求未执行。") + " |";

  return `# 真实采集落库报告

生成时间：${now}

## 结论

${result.failed ? "真实采集落库未完成。不要宣称真实数据已入库。" : "真实采集落库完成。请打开页面核对榜单日期、来源、排名、热度值、类型和匹配结果。"}

| 项 | 内容 |
| --- | --- |
| 请求来源 | ${source} |
| 请求日期 | ${rankingDate} |
| 榜单类型 | ${rankType} |
| 周期 | ${period} |
| 状态 | ${result.failed ? "failed" : "success"} |
| 预检确认 | ${confirmedPreview ? "是" : "否"} |

## 环境变量状态

登录态文件：${envFileStatus.label}

| 变量 | 状态 |
| --- | --- |
${summarizeEnv(source).map((item) => `| ${item.key} | ${item.value} |`).join("\n")}

## 运行结果

| 来源 | 日期 | 模式 | 状态 | 新增 | 跳过重复 | 消息 |
| --- | --- | --- | --- | ---: | ---: | --- |
${rows}

## 下一步

${renderNextStep({ source, rankingDate, rankType, period, result, envFileStatus })}
`;
}

function renderNextStep({ source, rankingDate, rankType, period, result, envFileStatus }) {
  if (source !== "dataeye") {
    return `- ${source} live 采集当前未启用。请先补充抓包材料并运行 \`npm run capture:pipeline -- --source ${source}\`。
- 只有接口验证拿到可映射榜单数组后，才恢复对应 live 采集器。`;
  }

  const loginEnvArg = formatLoginEnvArg(envFileStatus);
  const confirmedPreviewArg = " --confirmed-preview";
  if (result.unconfirmedPreview) {
    return `- 先运行 \`npm run collect:preview -- --date ${rankingDate} --source ${source}${loginEnvArg} --rank-type ${rankType} --period ${period}\`。
- 预检拿到榜单数组并人工核对无误后，再运行 \`npm run collect:live -- --date ${rankingDate} --source ${source}${loginEnvArg}${confirmedPreviewArg} --rank-type ${rankType} --period ${period}\`。`;
  }

  if (!result.failed) {
    return `- 访问 \`http://localhost:3000/?date=${rankingDate}&source=${source}&dataKind=live&rankType=${rankType}&rankPeriod=${period}\` 核对页面展示。
- 重复执行同一天采集时，应看到新增 0 条、跳过重复若干条。`;
  }

  return `- 如果提示登录态缺失或失效，请重新从 Charles/HAR 中补充 \`DATAEYE_AUTHENTICATION\`、\`DATAEYE_LOGIN_USER_ID\`，必要时补充 \`DATAEYE_S\`、\`DATAEYE_REFERER\` 和 \`DATAEYE_USER_AGENT\`。
- 补充后先运行 \`npm run collect:preview -- --date ${rankingDate} --source ${source}${loginEnvArg} --rank-type ${rankType} --period ${period}\`。
- 预检拿到榜单数组并核对无误后，再运行 \`npm run collect:live -- --date ${rankingDate} --source ${source}${loginEnvArg}${confirmedPreviewArg} --rank-type ${rankType} --period ${period}\`。`;
}

function formatLoginEnvArg(envFileStatus) {
  if (!envFileStatus?.requested) return "";
  return ` --login-env-file ${shellQuote(envFileStatus.requested)}`;
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:@-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function summarizeEnv(source) {
  const keys =
    source === "hongguo"
      ? ["HONGGUO_SESSION", "HONGGUO_COOKIE", "HONGGUO_AUTHORIZATION", "HONGGUO_TOKEN"]
      : [
          "DATAEYE_AUTHENTICATION",
          "DATAEYE_LOGIN_USER_ID",
          "DATAEYE_S",
          "DATAEYE_REFERER",
          "DATAEYE_USER_AGENT",
          "DATAEYE_COOKIE",
          "DATAEYE_AUTHORIZATION",
          "DATAEYE_TOKEN"
        ];

  return keys.map((key) => ({
    key,
    value: process.env[key] ? maskSensitiveValue(process.env[key]) : "未提供"
  }));
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--date") {
      parsed.date = argv[index + 1];
      index += 1;
    } else if (item === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    } else if (item === "--login-env-file") {
      parsed.envFile = argv[index + 1];
      index += 1;
    } else if (item === "--confirmed-preview") {
      parsed.confirmedPreview = true;
    } else if (item === "--rank-type") {
      parsed.rankType = argv[index + 1];
      index += 1;
    } else if (item === "--period") {
      parsed.period = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
