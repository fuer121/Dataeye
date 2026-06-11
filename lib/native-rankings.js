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

export function importNativeRankings({ exportDate, rankingDate, baseDir } = {}) {
  const baseDirs = resolveNativeBaseDirs(baseDir);
  let normalizedExportDate = exportDate
    ? normalizeNativeExportDate(exportDate)
    : rankingDate
      ? resolveNativeExportDateFromRankingDate(rankingDate)
      : "";
  let exportDir = normalizedExportDate ? findNativeExportDir(baseDirs, normalizedExportDate) : "";

  if (!exportDir && !exportDate) {
    const latest = findLatestNativeExportDir(baseDirs);
    if (latest) {
      normalizedExportDate = latest.exportDate;
      exportDir = latest.exportDir;
    }
  }

  if (!normalizedExportDate) {
    throw new Error("缺少原生短剧导出日期或数据日期。");
  }

  const normalizedRankingDate = resolveNativeRankingDate(normalizedExportDate);
  const resolvedExportDir = exportDir || getNativeExportDirCandidates(baseDirs, normalizedExportDate)[0];
  const startedAt = nowIso();
  const files = PERIODS.map((period) => ({
    period,
    filePath: path.join(resolvedExportDir, PERIOD_FILES[period])
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

function resolveNativeBaseDirs(baseDir) {
  if (baseDir) return [resolveLocalPath(baseDir)];
  return [
    path.join(process.cwd(), "原生短剧数据"),
    path.join(process.cwd(), "captures", "原生短剧数据")
  ];
}

function resolveLocalPath(value) {
  const text = String(value || "").trim();
  return path.isAbsolute(text) ? text : path.join(process.cwd(), text);
}

function findNativeExportDir(baseDirs, exportDate) {
  return getNativeExportDirCandidates(baseDirs, exportDate).find((candidate) => fs.existsSync(candidate)) || "";
}

function getNativeExportDirCandidates(baseDirs, exportDate) {
  const compact = exportDate.replaceAll("-", "");
  const mmdd = compact.slice(4);
  return baseDirs.flatMap((baseDir) => [exportDate, compact, mmdd].map((name) => path.join(baseDir, name)));
}

function findLatestNativeExportDir(baseDirs) {
  const candidates = [];

  for (const baseDir of baseDirs) {
    if (!fs.existsSync(baseDir)) continue;
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const exportDate = normalizeNativeExportDate(entry.name);
        const exportDir = path.join(baseDir, entry.name);
        if (hasAllPeriodFiles(exportDir)) candidates.push({ exportDate, exportDir });
      } catch {
        // Ignore non-date folders inside local capture directories.
      }
    }
  }

  return candidates.sort((a, b) => b.exportDate.localeCompare(a.exportDate))[0] || null;
}

function hasAllPeriodFiles(exportDir) {
  return PERIODS.every((period) => fs.existsSync(path.join(exportDir, PERIOD_FILES[period])));
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
      heatValue: formatNativeConsumption(row[heatIndex]),
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

function formatNativeConsumption(value) {
  const text = cleanCell(value);
  const number = Number(text.replaceAll(",", ""));
  return Number.isFinite(number) ? String(Math.round(number)) : text;
}
