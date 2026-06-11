import fs from "node:fs";
import path from "node:path";

import {
  compareDataEyeRankingRequests,
  getDataEyeRequestRankingDate,
  isDataEyeRankingRequest
} from "./dataeye-capture-target.js";
import { getDbPath } from "./db.js";
import { listNovelMappings } from "./novels.js";
import { listCollectionRuns, listRankingEntries } from "./rankings.js";
import { listCaptureFiles, parseCaptureFiles, summarizeCaptureFreshness } from "../scripts/capture-utils.js";

export function getMvpStatus() {
  const dataeyeLiveRows = listRankingEntries({ source: "dataeye", dataKind: "live" });
  const latestLiveDate = dataeyeLiveRows[0]?.rankingDate || "";
  const latestLiveRows = latestLiveDate
    ? listRankingEntries({ date: latestLiveDate, source: "dataeye", dataKind: "live" })
    : [];
  const liveRankTypeCount = new Set(dataeyeLiveRows.map((row) => row.rankType).filter((value) => value !== undefined)).size;
  const livePeriodCount = new Set(dataeyeLiveRows.map((row) => row.rankPeriod).filter(Boolean)).size;
  const matchedRows = latestLiveRows.filter((row) => row.matchStatus === "matched");
  const novelMappings = listNovelMappings("");
  const recentRuns = listCollectionRuns({ limit: 5, source: "dataeye", mode: "live" });
  const envFile = getLocalEnvFileStatus(".env.local.dataeye");
  const latestPreview = getLatestPreviewStatus();
  const latestDaily = getLatestDailyStatus();
  const latestCapture = getLatestDataEyeCaptureStatus();

  const checks = [
    {
      name: "DataEye live 数据",
      status: latestLiveRows.length ? "ready" : "missing",
      evidence: latestLiveRows.length
        ? `${latestLiveDate} 已有 ${latestLiveRows.length} 条 dataeye/live 榜单；累计 ${liveRankTypeCount} 个榜单类型、${livePeriodCount} 个周期`
        : "本地 SQLite 尚无 dataeye/live 榜单"
    },
    {
      name: "小说映射",
      status: novelMappings.length ? "ready" : "missing",
      evidence: novelMappings.length ? `已有 ${novelMappings.length} 条小说映射` : "尚无小说映射"
    },
    {
      name: "榜单匹配",
      status: latestLiveRows.length && matchedRows.length ? "ready" : "partial",
      evidence: latestLiveRows.length
        ? `${matchedRows.length}/${latestLiveRows.length} 条 latest dataeye/live 已匹配`
        : "缺少 live 榜单，无法计算匹配率"
    },
    {
      name: "DataEye 登录态文件",
      status: envFile.exists ? "configured" : "missing",
      evidence: envFile.label
    },
    {
      name: "最新 DataEye 抓包",
      status: latestCapture.exists ? "ready" : "missing",
      evidence: latestCapture.exists
        ? `${latestCapture.rankingDate || "未知日期"}：${latestCapture.requestId}，${latestCapture.freshness.ageLabel}（${latestCapture.freshness.note}）`
        : "captures/ 尚未发现 DataEye 榜单目标请求"
    },
    {
      name: "最近 DataEye 预检",
      status: latestPreview.health,
      evidence: latestPreview.exists
        ? `${latestPreview.date || "未知日期"}：${latestPreview.error || latestPreview.status || "无错误"}`
        : "尚无 live 预检报告"
    },
    {
      name: "最近 DataEye 调度",
      status: latestDaily.health,
      evidence: latestDaily.exists
        ? `${latestDaily.date || "未知日期"}：${latestDaily.status || "unknown"}，${latestDaily.nextAction || "无下一步"}`
        : "尚无 DataEye daily 调度报告"
    },
    {
      name: "红果 live",
      status: "paused",
      evidence: "用户已要求红果先不推进；当前只保留抓包分析入口，不启用 live 采集"
    }
  ];
  const overall = getOverallStatus(checks);

  return {
    overall,
    checks,
    sqlitePath: getDbPath(),
    dataeye: {
      latestLiveDate,
      liveCount: latestLiveRows.length,
      liveRankTypeCount,
      livePeriodCount,
      matchedCount: matchedRows.length,
      sampleRows: latestLiveRows.slice(0, 10),
      recentRuns,
      latestPreview,
      latestDaily,
      latestCapture
    },
    novels: {
      mappingCount: novelMappings.length
    },
    envFile
  };
}

export function renderMvpStatusReport(status, generatedAt = new Date().toISOString()) {
  return `# MVP 状态检查

生成时间：${generatedAt}

## 结论

当前状态：${status.overall}

本脚本不发起网络请求，只读取本地 SQLite、运行日志和本地登录态文件状态。

| 检查项 | 状态 | 证据 |
| --- | --- | --- |
${status.checks.map((check) => `| ${check.name} | ${check.status} | ${escapePipes(check.evidence)} |`).join("\n")}

## 本地数据

| 项 | 内容 |
| --- | --- |
| SQLite | \`${escapePipes(status.sqlitePath)}\` |
| 最新 DataEye live 日期 | ${status.dataeye.latestLiveDate || "无"} |
| 最新 DataEye live 条数 | ${status.dataeye.liveCount} |
| DataEye live 类型数 | ${status.dataeye.liveRankTypeCount} |
| DataEye live 周期数 | ${status.dataeye.livePeriodCount} |
| 最新 DataEye live 匹配条数 | ${status.dataeye.matchedCount} |
| 最新 DataEye 抓包 | ${status.dataeye.latestCapture.exists ? `${status.dataeye.latestCapture.rankingDate || "未知日期"} / ${status.dataeye.latestCapture.requestId}` : "无"} |
| 抓包新鲜度 | ${status.dataeye.latestCapture.exists ? `${status.dataeye.latestCapture.freshness.ageLabel}（${status.dataeye.latestCapture.freshness.note}）` : "无"} |
| 最近 DataEye 预检 | ${status.dataeye.latestPreview.exists ? `${status.dataeye.latestPreview.date || "未知日期"} / ${status.dataeye.latestPreview.health}` : "无"} |
| 最近 DataEye daily | ${status.dataeye.latestDaily.exists ? `${status.dataeye.latestDaily.date || "未知日期"} / ${status.dataeye.latestDaily.health}` : "无"} |
| 小说映射总数 | ${status.novels.mappingCount} |

## 最新 DataEye live 样例

${renderRankingRows(status.dataeye.sampleRows)}

## 最近 DataEye live 采集日志

${renderRunRows(status.dataeye.recentRuns)}

## 后续动作

${renderNextSteps(status)}
`;
}

function getLocalEnvFileStatus(fileName) {
  const resolvedPath = path.join(process.cwd(), fileName);
  return {
    requested: fileName,
    resolvedPath,
    exists: fs.existsSync(resolvedPath),
    label: `${fileName}${fs.existsSync(resolvedPath) ? "（存在）" : "（不存在）"}`
  };
}

function getLatestDataEyeCaptureStatus() {
  const files = listCaptureFiles();
  const { requests } = parseCaptureFiles(files);
  const selected = requests
    .filter((request) => request.isLikelyRanking && isDataEyeMotionComicTarget(request))
    .sort(compareDataEyeRankingRequests)[0];

  if (!selected) {
    return {
      exists: false,
      requestId: "",
      sourceFile: "",
      url: "",
      rankingDate: "",
      freshness: {
        capturedAt: "",
        ageLabel: "未知",
        status: "unknown",
        note: "未发现目标抓包。"
      }
    };
  }

  return {
    exists: true,
    requestId: selected.id,
    sourceFile: selected.sourceFile,
    url: selected.url,
    rankingDate: getRequestDay(selected),
    freshness: summarizeCaptureFreshness(selected)
  };
}

function isDataEyeMotionComicTarget(request) {
  return isDataEyeRankingRequest(request);
}

function getRequestDay(request) {
  return getDataEyeRequestRankingDate(request);
}

function getLatestPreviewStatus() {
  const reportPath = path.join(process.cwd(), "docs/live-collection-preview.md");
  if (!fs.existsSync(reportPath)) {
    return {
      exists: false,
      status: "",
      health: "missing",
      date: "",
      rowCount: 0,
      error: "",
      action: ""
    };
  }

  const text = fs.readFileSync(reportPath, "utf8");
  const fields = parseMarkdownKeyValueTable(beforeFirstSection(text, ["## 登录态文件", "## 预检结果"]));
  const status = fields["状态"] || "";
  const error = fields["错误"] || "";
  const health = getPreviewHealth(status, error);

  return {
    exists: true,
    status,
    health,
    date: fields["日期"] || "",
    rowCount: Number(fields["榜单条数"] || 0),
    error,
    action: fields["下一步"] || ""
  };
}

function beforeFirstSection(text, headings) {
  const indexes = headings.map((heading) => String(text || "").indexOf(heading)).filter((index) => index >= 0);
  const index = indexes.length ? Math.min(...indexes) : -1;
  return index >= 0 ? text.slice(0, index) : text;
}

function getLatestDailyStatus() {
  const reportPath = path.join(process.cwd(), "docs/dataeye-daily-run.md");
  if (!fs.existsSync(reportPath)) {
    return {
      exists: false,
      status: "",
      health: "missing",
      date: "",
      previewRows: 0,
      liveExecuted: "",
      nextAction: ""
    };
  }

  const text = fs.readFileSync(reportPath, "utf8");
  const fields = parseMarkdownKeyValueTable(beforeFirstSection(text, ["## 登录态文件", "## 预检结果"]));
  const status = fields["状态"] || "";

  return {
    exists: true,
    status,
    health: getDailyHealth(status),
    date: fields["日期"] || "",
    previewRows: Number(fields["预检条数"] || 0),
    liveExecuted: fields["live 是否执行"] || "",
    nextAction: fields["下一步"] || ""
  };
}

function getDailyHealth(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") return "ready";
  if (normalized === "auth_expired") return "auth_expired";
  if (["failed", "preview_failed", "live_failed"].includes(normalized)) return "failed";
  if (!normalized) return "missing";
  return normalized;
}

function getPreviewHealth(status, error) {
  const normalizedStatus = String(status || "").toLowerCase();
  const text = `${status || ""} ${error || ""}`;
  if (normalizedStatus === "ready") return "ready";
  if (/DATAEYE_AUTH_EXPIRED|statusCode=401|登录态已失效|重新登录|未登录/.test(text)) return "auth_expired";
  if (normalizedStatus === "failed") return "failed";
  return "unknown";
}

function parseMarkdownKeyValueTable(text) {
  const fields = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim();
    if (!key || key === "项" || key === "---") continue;
    fields[key] = value;
  }
  return fields;
}

function getOverallStatus(checks) {
  const optionalMissingChecks = new Set(["最近 DataEye 预检", "最近 DataEye 调度", "最新 DataEye 抓包"]);
  if (checks.some((check) => check.status === "missing" && !optionalMissingChecks.has(check.name))) return "partial";
  if (checks.some((check) => ["auth_expired", "failed"].includes(check.status))) return "attention";
  return "ready";
}

function renderRankingRows(rows) {
  if (!rows.length) return "暂无 dataeye/live 榜单。";

  return `| 榜单类型 | 周期 | 榜期 | 排名 | 作品 | 热度 | 类型 | 匹配 | 小说 |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${escapePipes(row.rankTypeName || row.rankType)} | ${escapePipes(row.rankPeriod)} | ${escapePipes(row.periodValue)} | ${row.rank} | ${escapePipes(row.title)} | ${escapePipes(row.heatValue)} | ${escapePipes(row.dramaType)} | ${row.matchStatus} | ${escapePipes(row.matchedNovelNames)} |`
  )
  .join("\n")}`;
}

function renderRunRows(rows) {
  if (!rows.length) return "暂无 dataeye/live 采集日志。";

  return `| 日期 | 状态 | 新增 | 跳过 | 消息 |
| --- | --- | ---: | ---: | --- |
${rows
  .map(
    (run) =>
      `| ${run.rankingDate} | ${run.status} | ${run.insertedCount} | ${run.skippedCount} | ${escapePipes(run.message)} |`
  )
  .join("\n")}`;
}

function renderNextSteps(status) {
  if (status.dataeye.latestDaily.health === "auth_expired") {
    return `- 最近 DataEye daily 调度显示登录态已失效。请运行 \`npm run dataeye:refresh-login\` 或重新提供 fresh HAR。
- 登录态恢复后运行 \`npm run dataeye:daily -- --source dataeye --login-env-file .env.local.dataeye\`。`;
  }

  if (status.dataeye.latestPreview.health === "auth_expired") {
    return `- 最近 DataEye live 预检显示登录态已失效。请重新抓包后运行 \`npm run dataeye:refresh-login\`。
- 预检通过后再执行 \`npm run collect:live -- --source dataeye --login-env-file .env.local.dataeye --confirmed-preview\`。`;
  }

  if (!status.dataeye.liveCount) {
    return `- 先运行 \`npm run dataeye:refresh-login\` 或 \`npm run collect:preview -- --source dataeye --login-env-file .env.local.dataeye\`。
- 预检通过后再执行 \`npm run collect:live -- --source dataeye --login-env-file .env.local.dataeye --confirmed-preview\`。`;
  }

  if (!status.dataeye.matchedCount) {
    return "- 进入 `/novels` 导入或维护小说映射，再回到榜单页核对匹配结果。";
  }

  return "- 当前本地 DataEye MVP 主链路已有可核对数据；若要采集新日期，请先刷新剧查查小程序登录态并执行 live 预检。";
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
