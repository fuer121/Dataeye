import { getDb } from "./db.js";
import { getMatchStatus, normalizeTitle } from "./matching.js";
import { isValidDateString, nowIso } from "./date.js";
import { getDataEyeRankTypeName, normalizeSingleDataEyeRankPeriod } from "./dataeye-rankings.js";

export const SOURCES = ["dataeye", "hongguo"];

export function assertSource(source) {
  if (!SOURCES.includes(source)) {
    throw new Error(`不支持的榜单来源：${source}`);
  }
}

export function normalizeRankingFilters(filters = {}) {
  const normalized = {
    date: filters.date || "",
    source: filters.source || "all",
    match: filters.match || "all",
    dataKind: filters.dataKind || "all",
    rankType: filters.rankType ?? "all",
    rankPeriod: filters.rankPeriod || "all",
    periodValue: filters.periodValue || ""
  };

  if (normalized.date && !isValidDateString(normalized.date)) {
    throw new Error("date 必须是有效的 YYYY-MM-DD 日期。");
  }

  if (normalized.source !== "all") {
    assertSource(normalized.source);
  }

  if (!["all", "matched", "unmatched"].includes(normalized.match)) {
    throw new Error(`不支持的匹配状态：${normalized.match}`);
  }

  if (!["all", "sample", "capture", "live"].includes(normalized.dataKind)) {
    throw new Error(`不支持的数据性质：${normalized.dataKind}`);
  }

  if (normalized.rankType !== "all") {
    const rankType = Number(normalized.rankType);
    if (!Number.isInteger(rankType) || rankType < 0) {
      throw new Error(`不支持的榜单类型：${normalized.rankType}`);
    }
    normalized.rankType = String(rankType);
  }

  if (!["all", "day", "week", "month"].includes(normalized.rankPeriod)) {
    throw new Error(`不支持的榜单周期：${normalized.rankPeriod}`);
  }

  return normalized;
}

export function upsertRankingEntries(entries) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO ranking_entries (
      source, data_kind, rank_type, rank_type_name, rank_period, period_value,
      ranking_date, rank, title, normalized_title, heat_value,
      drama_type, source_ref, collected_at, raw_payload
    )
    VALUES (
      @source, @dataKind, @rankType, @rankTypeName, @rankPeriod, @periodValue,
      @rankingDate, @rank, @title, @normalizedTitle, @heatValue,
      @dramaType, @sourceRef, @collectedAt, @rawPayload
    )
  `);

  const run = db.transaction((rows) => {
    let insertedCount = 0;
    for (const row of rows) {
      assertSource(row.source);
      const result = insert.run({
        source: row.source,
        dataKind: getDataKind(row.dataKind || row.sourceRef),
        rankType: getRankType(row.rankType),
        rankTypeName: getRankTypeName(row),
        rankPeriod: normalizeSingleDataEyeRankPeriod(row.rankPeriod || "day"),
        periodValue: row.periodValue || row.rankingDate,
        rankingDate: row.rankingDate,
        rank: row.rank,
        title: row.title,
        normalizedTitle: normalizeTitle(row.title),
        heatValue: String(row.heatValue ?? ""),
        dramaType: row.dramaType || "未知",
        sourceRef: row.sourceRef || row.source,
        collectedAt: row.collectedAt || nowIso(),
        rawPayload: JSON.stringify(row.rawPayload || row)
      });
      insertedCount += result.changes;
    }

    return {
      insertedCount,
      skippedCount: rows.length - insertedCount
    };
  });

  return run(entries);
}

export function listRankingEntries(filters = {}) {
  const db = getDb();
  const normalizedFilters = normalizeRankingFilters(filters);
  const where = [];
  const params = {};

  if (normalizedFilters.date) {
    where.push("r.ranking_date = @date");
    params.date = normalizedFilters.date;
  }

  if (normalizedFilters.source !== "all") {
    where.push("r.source = @source");
    params.source = normalizedFilters.source;
  }

  if (normalizedFilters.dataKind === "sample") {
    where.push("r.data_kind = 'sample'");
  }

  if (normalizedFilters.dataKind === "capture") {
    where.push("r.data_kind = 'capture'");
  }

  if (normalizedFilters.dataKind === "live") {
    where.push("r.data_kind = 'live'");
  }

  if (normalizedFilters.rankType !== "all") {
    where.push("r.rank_type = @rankType");
    params.rankType = Number(normalizedFilters.rankType);
  }

  if (normalizedFilters.rankPeriod !== "all") {
    where.push("r.rank_period = @rankPeriod");
    params.rankPeriod = normalizedFilters.rankPeriod;
  }

  if (normalizedFilters.periodValue) {
    where.push("r.period_value = @periodValue");
    params.periodValue = normalizedFilters.periodValue;
  }

  if (normalizedFilters.match === "matched") {
    where.push("m.matched_novel_names IS NOT NULL");
  }

  if (normalizedFilters.match === "unmatched") {
    where.push("m.matched_novel_names IS NULL");
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = db
    .prepare(`
      WITH matches AS (
        SELECT
          normalized_drama_title,
          GROUP_CONCAT(novel_name, '、') AS matched_novel_names
        FROM novel_mappings
        GROUP BY normalized_drama_title
      )
      SELECT
        r.id,
        r.source,
        r.data_kind AS dataKind,
        r.rank_type AS rankType,
        r.rank_type_name AS rankTypeName,
        r.rank_period AS rankPeriod,
        r.period_value AS periodValue,
        r.ranking_date AS rankingDate,
        r.rank,
        r.title,
        r.heat_value AS heatValue,
        r.drama_type AS dramaType,
        r.source_ref AS sourceRef,
        r.collected_at AS collectedAt,
        m.matched_novel_names AS matchedNovelNames
      FROM ranking_entries r
      LEFT JOIN matches m ON m.normalized_drama_title = r.normalized_title
      ${whereSql}
      ORDER BY r.ranking_date DESC, r.source ASC, r.rank_type ASC, r.rank_period ASC, r.rank ASC
    `)
    .all(params);

  return rows.map((row) => ({
    ...row,
    dataKind: getDataKind(row.dataKind || row.sourceRef),
    matchStatus: getMatchStatus(row.matchedNovelNames),
    matchedNovelNames: row.matchedNovelNames || "未匹配"
  }));
}

function getDataKind(sourceRef) {
  const ref = String(sourceRef || "");
  if (["sample", "capture", "live"].includes(ref)) return ref;
  if (ref.includes(":sample:")) return "sample";
  if (ref.includes(":capture:")) return "capture";
  return "live";
}

function getRankType(value) {
  const number = Number(value ?? 0);
  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function getRankTypeName(row) {
  if (row.rankTypeName) return row.rankTypeName;
  if (row.source === "dataeye") return getDataEyeRankTypeName(getRankType(row.rankType));
  return "默认榜单";
}

export function getLatestRankingDate() {
  const db = getDb();
  const row = db
    .prepare(`
      SELECT ranking_date AS rankingDate
      FROM ranking_entries
      ORDER BY ranking_date DESC
      LIMIT 1
    `)
    .get();

  return row?.rankingDate || "";
}

export function insertCollectionRun(run) {
  const db = getDb();
  return db
    .prepare(`
      INSERT INTO collection_runs (
        source, ranking_date, mode, rank_type, rank_type_name, rank_period, period_value, status, message,
        inserted_count, skipped_count, started_at, finished_at
      )
      VALUES (
        @source, @rankingDate, @mode, @rankType, @rankTypeName, @rankPeriod, @periodValue, @status, @message,
        @insertedCount, @skippedCount, @startedAt, @finishedAt
      )
    `)
    .run({
      ...run,
      rankType: run.rankType ?? null,
      rankTypeName: run.rankTypeName ?? null,
      rankPeriod: run.rankPeriod ?? null,
      periodValue: run.periodValue ?? null
    });
}

export function listCollectionRuns(input = 8) {
  const db = getDb();
  const options = typeof input === "number" ? { limit: input } : input || {};
  const filters = normalizeRunFilters(options);
  const where = [];
  const params = { limit: filters.limit };

  if (filters.date) {
    where.push("ranking_date = @date");
    params.date = filters.date;
  }

  if (filters.source !== "all") {
    where.push("source = @source");
    params.source = filters.source;
  }

  if (filters.mode !== "all") {
    where.push("mode = @mode");
    params.mode = filters.mode;
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  return db
    .prepare(`
      SELECT
        id,
        source,
        ranking_date AS rankingDate,
        mode,
        rank_type AS rankType,
        rank_type_name AS rankTypeName,
        rank_period AS rankPeriod,
        period_value AS periodValue,
        status,
        message,
        inserted_count AS insertedCount,
        skipped_count AS skippedCount,
        started_at AS startedAt,
        finished_at AS finishedAt
      FROM collection_runs
      ${whereSql}
      ORDER BY id DESC
      LIMIT @limit
    `)
    .all(params);
}

export function normalizeRunFilters(filters = {}) {
  const limit = Number(filters.limit ?? 8);
  const normalized = {
    date: filters.date || "",
    source: filters.source || "all",
    mode: filters.mode || "all",
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 8
  };

  if (normalized.date && !isValidDateString(normalized.date)) {
    throw new Error("date 必须是有效的 YYYY-MM-DD 日期。");
  }

  if (normalized.source !== "all") {
    assertSource(normalized.source);
  }

  if (!["all", "sample", "capture", "live"].includes(normalized.mode)) {
    throw new Error(`不支持的采集模式：${normalized.mode}`);
  }

  return normalized;
}
