import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DATAEYE_RANK_TYPE_NAMES } from "./dataeye-rankings.js";

let connection;

export function getDbPath() {
  const configured = process.env.SQLITE_PATH || "./data/ju-chacha.sqlite";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

export function getDb() {
  if (!connection) {
    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    connection = new Database(dbPath);
    connection.pragma("journal_mode = WAL");
    connection.pragma("foreign_keys = ON");
    initSchema(connection);
  }

  return connection;
}

export function resetDbForTests(dbPath) {
  if (connection) {
    connection.close();
    connection = undefined;
  }
  process.env.SQLITE_PATH = dbPath;
}

export function initSchema(db = getDb()) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ranking_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL CHECK (source IN ('dataeye', 'hongguo')),
      data_kind TEXT NOT NULL DEFAULT 'live' CHECK (data_kind IN ('sample', 'capture', 'live')),
      rank_type INTEGER NOT NULL DEFAULT 0,
      rank_type_name TEXT NOT NULL DEFAULT '漫剧热播榜',
      rank_period TEXT NOT NULL DEFAULT 'day' CHECK (rank_period IN ('day', 'week', 'month')),
      period_value TEXT NOT NULL DEFAULT '',
      ranking_date TEXT NOT NULL,
      rank INTEGER NOT NULL,
      title TEXT NOT NULL,
      normalized_title TEXT NOT NULL,
      heat_value TEXT NOT NULL,
      drama_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      raw_payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (source, data_kind, rank_type, rank_period, period_value, normalized_title)
    );

    CREATE TABLE IF NOT EXISTS novel_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_name TEXT NOT NULL,
      drama_title TEXT NOT NULL,
      normalized_drama_title TEXT NOT NULL,
      relation_type TEXT NOT NULL DEFAULT 'exact',
      source_ref TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (normalized_drama_title, novel_name)
    );

    CREATE INDEX IF NOT EXISTS idx_novel_mappings_normalized
      ON novel_mappings (normalized_drama_title);

    CREATE TABLE IF NOT EXISTS collection_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      ranking_date TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'sample',
      rank_type INTEGER,
      rank_type_name TEXT,
      rank_period TEXT CHECK (rank_period IS NULL OR rank_period IN ('day', 'week', 'month')),
      period_value TEXT,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
      message TEXT NOT NULL,
      inserted_count INTEGER NOT NULL DEFAULT 0,
      skipped_count INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL
    );
  `);

  migrateRankingEntriesDimensions(db);
  migrateCollectionRunsDimensions(db);
  normalizeDataEyeRankTypeNames(db);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ranking_entries_date_source
      ON ranking_entries (ranking_date, source, data_kind, rank_type, rank_period, rank);
  `);
}

function migrateRankingEntriesDimensions(db) {
  const columns = db.prepare("PRAGMA table_info(ranking_entries)").all();
  const hasDataKind = columns.some((column) => column.name === "data_kind");
  const hasRequiredColumns = ["data_kind", "rank_type", "rank_type_name", "rank_period", "period_value"].every((name) =>
    columns.some((column) => column.name === name)
  );
  const hasExpectedUnique = hasUniqueIndexColumns(db, [
    "source",
    "data_kind",
    "rank_type",
    "rank_period",
    "period_value",
    "normalized_title"
  ]);

  if (hasRequiredColumns && hasExpectedUnique) return;

  db.exec("ALTER TABLE ranking_entries RENAME TO ranking_entries_old");
  db.exec(`
    CREATE TABLE ranking_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL CHECK (source IN ('dataeye', 'hongguo')),
      data_kind TEXT NOT NULL DEFAULT 'live' CHECK (data_kind IN ('sample', 'capture', 'live')),
      rank_type INTEGER NOT NULL DEFAULT 0,
      rank_type_name TEXT NOT NULL DEFAULT '漫剧热播榜',
      rank_period TEXT NOT NULL DEFAULT 'day' CHECK (rank_period IN ('day', 'week', 'month')),
      period_value TEXT NOT NULL DEFAULT '',
      ranking_date TEXT NOT NULL,
      rank INTEGER NOT NULL,
      title TEXT NOT NULL,
      normalized_title TEXT NOT NULL,
      heat_value TEXT NOT NULL,
      drama_type TEXT NOT NULL,
      source_ref TEXT NOT NULL,
      collected_at TEXT NOT NULL,
      raw_payload TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (source, data_kind, rank_type, rank_period, period_value, normalized_title)
    );
  `);

  const hasColumn = (name) => columns.some((column) => column.name === name);
  const dataKindSql = hasDataKind
    ? "data_kind"
    : `CASE
        WHEN source_ref LIKE '%:sample:%' THEN 'sample'
        WHEN source_ref LIKE '%:capture:%' THEN 'capture'
        ELSE 'live'
      END`;
  const rankTypeSql = hasColumn("rank_type") ? "rank_type" : "0";
  const rankTypeNameSql = hasColumn("rank_type_name") ? "rank_type_name" : "'漫剧热播榜'";
  const rankPeriodSql = hasColumn("rank_period") ? "rank_period" : "'day'";
  const periodValueSql = hasColumn("period_value") ? "period_value" : "ranking_date";
  const createdAtSql = hasColumn("created_at") ? "created_at" : "CURRENT_TIMESTAMP";

  db.exec(`
    INSERT OR IGNORE INTO ranking_entries (
      id, source, data_kind, rank_type, rank_type_name, rank_period, period_value,
      ranking_date, rank, title, normalized_title,
      heat_value, drama_type, source_ref, collected_at, raw_payload, created_at
    )
    SELECT
      id, source, ${dataKindSql}, ${rankTypeSql}, ${rankTypeNameSql}, ${rankPeriodSql}, ${periodValueSql},
      ranking_date, rank, title, normalized_title,
      heat_value, drama_type, source_ref, collected_at, raw_payload, ${createdAtSql}
    FROM ranking_entries_old;

    DROP TABLE ranking_entries_old;
  `);
}

function migrateCollectionRunsDimensions(db) {
  const columns = db.prepare("PRAGMA table_info(collection_runs)").all();
  const statements = [];
  if (!columns.some((column) => column.name === "rank_type")) {
    statements.push("ALTER TABLE collection_runs ADD COLUMN rank_type INTEGER");
  }
  if (!columns.some((column) => column.name === "rank_type_name")) {
    statements.push("ALTER TABLE collection_runs ADD COLUMN rank_type_name TEXT");
  }
  if (!columns.some((column) => column.name === "rank_period")) {
    statements.push("ALTER TABLE collection_runs ADD COLUMN rank_period TEXT");
  }
  if (!columns.some((column) => column.name === "period_value")) {
    statements.push("ALTER TABLE collection_runs ADD COLUMN period_value TEXT");
  }
  for (const statement of statements) db.exec(statement);
}

function normalizeDataEyeRankTypeNames(db) {
  const namedRankTypes = Object.entries(DATAEYE_RANK_TYPE_NAMES)
    .map(([rankType, rankTypeName]) => ({ rankType: Number(rankType), rankTypeName }))
    .filter((item) => Number.isInteger(item.rankType));

  const updateRankingEntries = db.prepare(`
    UPDATE ranking_entries
    SET rank_type_name = @rankTypeName
    WHERE source = 'dataeye' AND rank_type = @rankType AND rank_type_name != @rankTypeName
  `);
  const updateCollectionRuns = db.prepare(`
    UPDATE collection_runs
    SET rank_type_name = @rankTypeName
    WHERE source = 'dataeye' AND rank_type = @rankType AND rank_type_name != @rankTypeName
  `);

  const run = db.transaction(() => {
    for (const item of namedRankTypes) {
      updateRankingEntries.run(item);
      updateCollectionRuns.run(item);
    }
  });

  run();
}

function hasUniqueIndexColumns(db, expectedColumns) {
  const expected = expectedColumns.join(",");
  return db
    .prepare("PRAGMA index_list(ranking_entries)")
    .all()
    .filter((index) => index.unique)
    .some((index) => {
      const columns = db
        .prepare(`PRAGMA index_info(${JSON.stringify(index.name)})`)
        .all()
        .map((column) => column.name)
        .join(",");
      return columns === expected;
    });
}
