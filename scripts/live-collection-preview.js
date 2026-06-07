#!/usr/bin/env node
import { formatShanghaiDate, isValidDateString } from "../lib/date.js";
import { collectDataEyeRanking } from "../lib/collectors/live.js";
import { describeEnvFile, maskSensitiveValue, readEnvFile, readEnvLocal, rel, writeMarkdown } from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const source = args.source || "dataeye";
const rankingDate = args.date || formatShanghaiDate(new Date());
const rankType = args.rankType || "0";
const period = args.period || "day";
const envFileStatus = describeEnvFile(args.envFile);

applyEnvFiles(args.envFile);

if (!isValidDateString(rankingDate)) {
  console.error("date 必须是有效的 YYYY-MM-DD 日期。");
  process.exit(1);
}

const startedAt = Date.now();
const result = await previewLiveCollection({ source, rankingDate, rankType, period });
const output = writeMarkdown("live-collection-preview.md", renderPreview(result));

console.log(`Source: ${source}`);
console.log(`Date: ${rankingDate}`);
console.log(`RankType: ${rankType}`);
console.log(`Period: ${period}`);
console.log(`Status: ${result.ok ? "ready" : "failed"}`);
console.log(`Rows: ${result.rows.length}`);
console.log(`Wrote ${rel(output)}`);

async function previewLiveCollection({ source, rankingDate, rankType, period }) {
  if (source !== "dataeye") {
    return {
      ok: false,
      source,
      rankingDate,
      rankType,
      period,
      rows: [],
      durationMs: Date.now() - startedAt,
      error: "当前 dry-run 只支持 source=dataeye；红果接口尚未验证。",
      env: summarizeEnv(source),
      envFileStatus
    };
  }

  try {
    const rows = await collectDataEyeRanking({ rankingDate, rankType, period });
    return {
      ok: true,
      source,
      rankingDate,
      rankType,
      period,
      rows,
      durationMs: Date.now() - startedAt,
      error: "",
      env: summarizeEnv(source),
      envFileStatus
    };
  } catch (error) {
    return {
      ok: false,
      source,
      rankingDate,
      rankType,
      period,
      rows: [],
      durationMs: Date.now() - startedAt,
      error: error.message,
      action: error.action || "",
      env: summarizeEnv(source),
      envFileStatus
    };
  }
}

function applyEnvFiles(envFile) {
  const env = {
    ...readEnvLocal(),
    ...readEnvFile(envFile)
  };
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }
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

function renderPreview(result) {
  const now = new Date().toISOString();
  return `# 真实采集预检

生成时间：${now}

## 结论

${result.ok ? "已成功获取真实榜单预览。该脚本未写入 SQLite；确认无误后可通过页面或 `/api/collect` 执行 live 采集落库。" : "未获取到真实榜单数组。该脚本未写入 SQLite。"}

| 项 | 内容 |
| --- | --- |
| 来源 | ${result.source} |
| 日期 | ${result.rankingDate} |
| 榜单类型 | ${result.rankType} |
| 周期 | ${result.period} |
| 状态 | ${result.ok ? "ready" : "failed"} |
| 榜单条数 | ${result.rows.length} |
| 耗时 | ${result.durationMs} ms |
| 错误 | ${result.error || "无"} |
| 下一步 | ${result.action || "无"} |

## 环境变量状态

登录态文件：${result.envFileStatus.label}

| 变量 | 状态 |
| --- | --- |
${result.env.map((item) => `| ${item.key} | ${item.value} |`).join("\n")}

## 预览数据

${renderRows(result.rows.slice(0, 30))}

## 下一步

${renderNextStep(result)}
`;
}

function renderRows(rows) {
  if (!rows.length) return "未获取到榜单行。";

  return `| 榜单类型 | 周期 | 榜期 | 排名 | 短剧/漫剧名称 | 热度值 | 类型 |
| --- | --- | --- | ---: | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${escapePipes(row.rankTypeName || row.rankType)} | ${escapePipes(row.rankPeriod)} | ${escapePipes(row.periodValue)} | ${escapePipes(row.rank)} | ${escapePipes(row.title)} | ${escapePipes(row.heatValue)} | ${escapePipes(row.dramaType)} |`
  )
  .join("\n")}`;
}

function renderNextStep(result) {
  if (result.source !== "dataeye") {
    return `- ${result.source} live 预检当前未启用。请先补充抓包材料并运行 \`npm run capture:pipeline -- --source ${result.source}\`。
- 只有接口验证拿到可映射榜单数组后，才恢复对应 live 采集器。`;
  }

  const loginEnvArg = formatLoginEnvArg(result.envFileStatus);
  if (result.ok) {
    return `- 核对预览行是否对应剧查查小程序目标榜单和周期。
- 确认后执行：

\`\`\`bash
npm run collect:live -- --date ${result.rankingDate} --source dataeye${loginEnvArg} --rank-type ${result.rankType} --period ${result.period} --confirmed-preview
\`\`\``;
  }

  return `- 如果提示登录态缺失或失效，请重新从 Charles/Proxyman HAR 中补充 \`DATAEYE_AUTHENTICATION\`、\`DATAEYE_LOGIN_USER_ID\`，必要时补充 \`DATAEYE_S\`、\`DATAEYE_REFERER\` 和 \`DATAEYE_USER_AGENT\`。
- 补充后重新运行 \`npm run collect:preview -- --date ${result.rankingDate} --source dataeye${loginEnvArg} --rank-type ${result.rankType} --period ${result.period}\`。`;
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
