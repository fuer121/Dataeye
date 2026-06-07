import path from "node:path";

import { nowIso } from "./date.js";
import { assertSource, insertCollectionRun, upsertRankingEntries } from "./rankings.js";
import {
  assessRankingReadiness,
  detectRequestSource,
  extractRankingArrays,
  getRequestDate,
  listCaptureFiles,
  parseCaptureFiles,
  rel,
  sortRankingCandidates,
  summarizeCaptureFreshness,
  writeMarkdown
} from "../scripts/capture-utils.js";

export function importCaptureRanking({ date = "", source = "", writeReport = true } = {}) {
  const startedAt = nowIso();
  const requestedSource = normalizeImportSource(source);
  const files = listCaptureFiles();
  const { requests, errors } = parseCaptureFiles(files);
  const candidates = getImportCandidates({ requests, date, source: requestedSource });

  let result;
  try {
    result = importCandidate({ candidate: candidates[0], date, requestedSource });
  } catch (error) {
    result = {
      ok: false,
      request: candidates[0]?.request || null,
      rankingDate: date || "",
      source: requestedSource || detectSource(candidates[0]?.request),
      requestedSource,
      rows: [],
      insertedCount: 0,
      skippedCount: 0,
      captureFreshness: summarizeCaptureFreshness(candidates[0]?.request),
      message: error.message
    };
  }

  recordRun({ result, startedAt, date, requestedSource });
  const finishedAt = nowIso();
  const report = renderCaptureImportReport({ files, errors, candidates, result, startedAt, finishedAt });
  const outputPath = writeReport ? writeMarkdown("capture-import.md", report) : "";

  return {
    ...result,
    files,
    errors,
    candidateCount: candidates.length,
    startedAt,
    finishedAt,
    reportPath: outputPath
  };
}

export function getImportCandidates({ requests, date = "", source = "" }) {
  return requests
    .map((request) => ({ request, readiness: assessRankingReadiness(request.responseBody) }))
    .filter(({ request, readiness }) => request.isLikelyRanking && readiness.ready)
    .filter(({ request }) => matchesDate(request, date))
    .filter(({ request }) => !source || detectSource(request) === source)
    .sort(compareCandidates);
}

export function renderCaptureImportReport({ files, errors, candidates, result, startedAt, finishedAt }) {
  const rows = result.rows.slice(0, 30);
  const freshness = result.captureFreshness || summarizeCaptureFreshness(result.request);
  return `# 抓包榜单导入报告

生成时间：${finishedAt}

## 结论

${result.ok ? "抓包响应中的榜单数据已导入 SQLite，并标记为 capture 数据性质。该导入不代表 live HTTP 采集已验证通过。" : "抓包榜单导入失败，未写入榜单明细。"}

| 项 | 内容 |
| --- | --- |
| 状态 | ${result.ok ? "success" : "failed"} |
| 来源 | ${result.source || "-"} |
| 指定来源 | ${result.requestedSource || "-"} |
| 日期 | ${result.rankingDate || "-"} |
| 新增 | ${result.insertedCount || 0} |
| 跳过重复 | ${result.skippedCount || 0} |
| 捕获时间 | ${freshness.capturedAt || "-"} |
| 抓包距今 | ${freshness.ageLabel || "-"}（${freshness.note || "-"}） |
| 消息 | ${escapePipes(result.message)} |
| 开始时间 | ${startedAt} |
| 完成时间 | ${finishedAt} |

## 输入

| 项 | 数量 |
| --- | ---: |
| 抓包文件 | ${files.length} |
| 解析错误 | ${errors.length} |
| 可导入候选 | ${candidates.length} |

${files.length ? files.map((file) => `- \`${rel(file)}\``).join("\n") : "当前没有抓包文件。"}

## 目标请求

${result.request ? renderRequest(result.request) : "无。"}

## 导入预览

${renderRows(rows)}

## 说明

- capture 只表示数据来自本地抓包响应。
- capture 不等于 live；只有 \`npm run capture:validate\` 或 \`npm run collect:preview\` 用有效登录态复现成功后，才能执行 live 采集落库。
- CLI live 落库还必须显式传入 \`--confirmed-preview\`；API live 落库必须传入 \`confirmedPreview=true\`。
- 去重仍遵循同一天、同来源、同作品归一化名称。
`;
}

function importCandidate({ candidate, date, requestedSource }) {
  if (!candidate) {
    const sourceHint = requestedSource ? `（source=${requestedSource}）` : "";
    throw new Error(`未找到可导入的抓包榜单响应${sourceHint}。请先运行 npm run capture:pipeline 确认存在可映射候选。`);
  }

  const { request, readiness } = candidate;
  const source = detectSource(request);
  if (!source) {
    throw new Error(`无法从请求 URL 识别榜单来源：${request.url}`);
  }

  const rankingDate = date || getRequestDate(request);
  if (!rankingDate) {
    throw new Error(`无法从请求 URL 识别榜单日期：${request.url}`);
  }

  const rows = normalizeRows({ request, readiness, source, rankingDate });
  const dbResult = upsertRankingEntries(rows);

  return {
    ok: true,
    request,
    rankingDate,
    source,
    requestedSource: requestedSource || source,
    rows,
    insertedCount: dbResult.insertedCount,
    skippedCount: dbResult.skippedCount,
    captureFreshness: summarizeCaptureFreshness(request),
    message: `抓包榜单导入完成：新增 ${dbResult.insertedCount} 条，跳过重复 ${dbResult.skippedCount} 条。`
  };
}

function normalizeRows({ request, readiness, source, rankingDate }) {
  const items = extractRankingArrays(request.responseBody)[0] || [];
  return items.map((item) => ({
    source,
    dataKind: "capture",
    rankingDate,
    rank: Number(getValueByPath(item, readiness.fields.rank.key)),
    title: String(getValueByPath(item, readiness.fields.title.key) || "").trim(),
    heatValue: String(getValueByPath(item, readiness.fields.heatValue.key) || "").trim(),
    dramaType: formatValue(getValueByPath(item, readiness.fields.dramaType.key)) || "未知",
    sourceRef: buildCaptureSourceRef(request),
    collectedAt: nowIso(),
    rawPayload: item
  }));
}

function buildCaptureSourceRef(request) {
  return `${detectSource(request)}:capture:${path.basename(request.sourceFile)}#${request.index}:${request.url}`;
}

function recordRun({ result, startedAt, date, requestedSource }) {
  const source = result.source || requestedSource || "dataeye";
  const rankingDate = result.rankingDate || date || nowIso().slice(0, 10);
  insertCollectionRun({
    source,
    rankingDate,
    mode: "capture",
    status: result.ok ? "success" : "failed",
    message: result.message,
    insertedCount: result.insertedCount || 0,
    skippedCount: result.skippedCount || 0,
    startedAt,
    finishedAt: nowIso()
  });
}

function normalizeImportSource(source) {
  const normalized = String(source || "").trim();
  if (!normalized || normalized === "all") return "";
  assertSource(normalized);
  return normalized;
}

function compareCandidates(a, b) {
  const sorted = sortRankingCandidates([a.request, b.request]);
  return sorted.indexOf(a.request) - sorted.indexOf(b.request);
}

function renderRequest(request) {
  const freshness = summarizeCaptureFreshness(request);
  return `| 项 | 内容 |
| --- | --- |
| 请求 ID | \`${request.id}\` |
| URL | ${request.url} |
| 方法 | ${request.method} |
| 捕获时间 | ${freshness.capturedAt || "未知"} |
| 距今 | ${freshness.ageLabel}（${freshness.note}） |
| 抓包响应状态 | ${request.responseStatus ?? "未提供"} |`;
}

function renderRows(rows) {
  if (!rows.length) return "未导入榜单行。";
  return `| 排名 | 短剧/漫剧名称 | 热度值 | 类型 |
| ---: | --- | --- | --- |
${rows.map((row) => `| ${row.rank} | ${escapePipes(row.title)} | ${escapePipes(row.heatValue)} | ${escapePipes(row.dramaType)} |`).join("\n")}`;
}

function detectSource(request) {
  return detectRequestSource(request);
}

function matchesDate(request, date) {
  if (!date) return true;
  return getRequestDate(request) === date;
}

function getValueByPath(value, keyPath) {
  return String(keyPath)
    .split(".")
    .reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), value);
}

function formatValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("/");
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join("/");
    } catch {
      return trimmed;
    }
  }
  return value == null ? "" : String(value);
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
