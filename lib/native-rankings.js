import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { isValidDateString, nowIso } from "./date.js";
import { insertCollectionRun, upsertRankingEntries } from "./rankings.js";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const PERIODS = ["day", "week", "month"];
const PERIOD_FILES = {
  day: "day.xlsx",
  week: "week.xlsx",
  month: "month.xlsx"
};
const DEFAULT_BASE_DIR = path.join(process.cwd(), "原生短剧数据");

export function normalizeNativeExportDate(value, now = new Date()) {
  const text = String(value || "").trim();
  if (isValidDateString(text)) return text;

  const currentYear = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric"
  }).format(now);

  if (/^\d{4}$/.test(text)) {
    return normalizeNativeExportDate(`${currentYear}${text}`);
  }

  if (/^\d{8}$/.test(text)) {
    const date = `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
    if (isValidDateString(date)) return date;
  }

  throw new Error(`无效的原生短剧导出日期：${value}`);
}

export function resolveNativeRankingDate(exportDate) {
  const normalized = normalizeNativeExportDate(exportDate);
  const date = new Date(`${normalized}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export function resolveNativeExportDateFromRankingDate(rankingDate) {
  if (!isValidDateString(rankingDate)) {
    throw new Error(`无效的原生短剧数据日期：${rankingDate}`);
  }
  const date = new Date(`${rankingDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function importNativeRankings({ exportDate, rankingDate, baseDir = DEFAULT_BASE_DIR } = {}) {
  const normalizedExportDate = exportDate
    ? normalizeNativeExportDate(exportDate)
    : resolveNativeExportDateFromRankingDate(rankingDate);
  const normalizedRankingDate = resolveNativeRankingDate(normalizedExportDate);
  const exportDir = findNativeExportDir(baseDir, normalizedExportDate);
  const startedAt = nowIso();
  const files = PERIODS.map((period) => ({
    period,
    filePath: path.join(exportDir, PERIOD_FILES[period])
  }));
  const missing = files.filter((item) => !fs.existsSync(item.filePath));

  if (missing.length) {
    throw new Error(`缺少原生短剧 Excel 文件：${missing.map((item) => PERIOD_FILES[item.period]).join("、")}`);
  }

  const periods = files.map((item) => {
    const rows = readNativeWorkbookRows(item.filePath, {
      exportDate: normalizedExportDate,
      rankingDate: normalizedRankingDate,
      period: item.period
    });
    return {
      period: item.period,
      filePath: item.filePath,
      rowCount: rows.length,
      rows
    };
  });

  const rows = periods.flatMap((item) => item.rows);
  const result = upsertRankingEntries(rows);
  const finishedAt = nowIso();
  insertCollectionRun({
    source: "native",
    rankingDate: normalizedRankingDate,
    mode: "live",
    rankType: null,
    rankTypeName: null,
    rankPeriod: null,
    periodValue: null,
    status: "success",
    message: `原生短剧 Excel 导入完成：新增 ${result.insertedCount} 条，跳过重复 ${result.skippedCount} 条。`,
    insertedCount: result.insertedCount,
    skippedCount: result.skippedCount,
    startedAt,
    finishedAt
  });

  return {
    source: "native",
    exportDate: normalizedExportDate,
    rankingDate: normalizedRankingDate,
    insertedCount: result.insertedCount,
    skippedCount: result.skippedCount,
    periods: periods.map((item) => ({
      period: item.period,
      filePath: item.filePath,
      rowCount: item.rowCount
    }))
  };
}

function findNativeExportDir(baseDir, exportDate) {
  const compact = exportDate.replaceAll("-", "");
  const mmdd = compact.slice(4);
  const candidates = [exportDate, compact, mmdd].map((name) => path.join(baseDir, name));
  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  return existing || candidates[0];
}

function readNativeWorkbookRows(filePath, { exportDate, rankingDate, period }) {
  const workbook = XLSX.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const values = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const [header = [], ...body] = values;
  const titleIndex = findHeaderIndex(header, "短剧名称");
  const heatIndex = findHeaderIndex(header, "消耗");
  const rows = [];

  if (titleIndex === -1 || heatIndex === -1) {
    throw new Error(`原生短剧 Excel 缺少必要列：${path.basename(filePath)}`);
  }

  for (const row of body) {
    const title = cleanCell(row[titleIndex]);
    if (!title || title === "(null)") continue;
    rows.push({
      source: "native",
      dataKind: "live",
      rankType: 0,
      rankTypeName: "站内原生短剧",
      rankPeriod: period,
      periodValue: rankingDate,
      rankingDate,
      rank: rows.length + 1,
      title,
      heatValue: cleanCell(row[heatIndex]),
      dramaType: "未知",
      sourceRef: `native:excel:${exportDate}:${period}`,
      collectedAt: nowIso(),
      rawPayload: {
        exportDate,
        period,
        fileName: path.basename(filePath),
        row
      }
    });
  }

  return rows;
}

function findHeaderIndex(header, label) {
  return header.findIndex((value) => cleanCell(value) === label);
}

function cleanCell(value) {
  return String(value ?? "").trim();
}
