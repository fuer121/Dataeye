#!/usr/bin/env node
import { formatShanghaiDate } from "../lib/date.js";
import { runDataEyeDailyCollection, renderDataEyeDailyReport } from "../lib/dataeye-daily.js";
import { describeEnvFile, readEnvFile, readEnvLocal, rel, writeMarkdown } from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const source = args.source || "dataeye";
const rankingDate = args.date || resolveDefaultDate();
const rankType = args.rankType || "all";
const period = args.period || "all";
const envFileStatus = describeEnvFile(args.envFile);

applyEnvFiles(args.envFile);

let result;
if (source !== "dataeye") {
  result = {
    ok: false,
    source: "dataeye",
    rankingDate,
    status: "failed",
    preview: {
      ok: false,
      rows: [],
      error: "DataEye daily 调度只支持 source=dataeye。",
      action: "红果真实采集仍保持暂停；请不要把红果接入 daily 调度。"
    },
    live: null,
    nextAction: "红果真实采集仍保持暂停。"
  };
} else {
  result = await runDataEyeDailyCollection({ rankingDate, rankType, period });
}

const output = writeMarkdown("dataeye-daily-run.md", renderDataEyeDailyReport({ result, envFileStatus }));

console.log(`Source: dataeye`);
console.log(`Date: ${rankingDate}`);
console.log(`RankType: ${rankType}`);
console.log(`Period: ${period}`);
console.log(`Status: ${result.status}`);
console.log(`Preview rows: ${result.preview?.rows?.length || 0}`);
console.log(`Wrote ${rel(output)}`);

if (!result.ok) process.exitCode = 1;

function applyEnvFiles(envFile) {
  const env = {
    ...readEnvLocal(),
    ...readEnvFile(envFile)
  };
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolveDefaultDate() {
  const offset = Number(process.env.DATAEYE_DAILY_DATE_OFFSET_DAYS || 0);
  const date = new Date();
  if (Number.isFinite(offset) && offset !== 0) {
    date.setDate(date.getDate() + offset);
  }
  return formatShanghaiDate(date);
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--date") {
      parsed.date = argv[index + 1] || "";
      index += 1;
    } else if (item === "--source") {
      parsed.source = argv[index + 1] || "";
      index += 1;
    } else if (item === "--login-env-file") {
      parsed.envFile = argv[index + 1] || "";
      index += 1;
    } else if (item === "--rank-type") {
      parsed.rankType = argv[index + 1] || "";
      index += 1;
    } else if (item === "--period") {
      parsed.period = argv[index + 1] || "";
      index += 1;
    }
  }
  return parsed;
}
