import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { initSchema, resetDbForTests } from "../lib/db.js";
import { importSampleNovelMappings } from "../lib/novels.js";
import {
  getLatestRankingDate,
  insertCollectionRun,
  listCollectionRuns,
  listRankingEntries,
  normalizeRankingFilters,
  normalizeRunFilters,
  upsertRankingEntries
} from "../lib/rankings.js";

function useTempDb(name) {
  resetDbForTests(path.join(os.tmpdir(), `${name}-${Date.now()}-${Math.random()}.sqlite`));
}

test("ranking upsert skips duplicate source/date/title rows", () => {
  useTempDb("ranking-dedupe");
  const rows = [
    {
      source: "dataeye",
      rankingDate: "2026-06-05",
      rank: 1,
      title: "玄门小祖宗",
      heatValue: "99万",
      dramaType: "玄学爽文",
      sourceRef: "test"
    }
  ];

  assert.deepEqual(upsertRankingEntries(rows), { insertedCount: 1, skippedCount: 0 });
  assert.deepEqual(upsertRankingEntries(rows), { insertedCount: 0, skippedCount: 1 });
});

test("ranking upsert keeps capture and live rows separate", () => {
  useTempDb("ranking-data-kind-dedupe");
  const base = {
    source: "dataeye",
    rankingDate: "2026-06-05",
    rank: 1,
    title: "弃子逆袭，从烂瓦房到商界大佬",
    heatValue: "1.4亿",
    dramaType: "种田/逆袭/乡村"
  };

  assert.deepEqual(upsertRankingEntries([{ ...base, dataKind: "capture", sourceRef: "dataeye:capture:test.har#0" }]), {
    insertedCount: 1,
    skippedCount: 0
  });
  assert.deepEqual(
    upsertRankingEntries([
      {
        ...base,
        dataKind: "live",
        sourceRef: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0"
      }
    ]),
    { insertedCount: 1, skippedCount: 0 }
  );

  assert.equal(listRankingEntries({ date: "2026-06-05", source: "dataeye", dataKind: "capture" }).length, 1);
  assert.equal(listRankingEntries({ date: "2026-06-05", source: "dataeye", dataKind: "live" }).length, 1);
});

test("ranking upsert keeps DataEye rank type and period rows separate", () => {
  useTempDb("ranking-rank-type-period-dedupe");
  const base = {
    source: "dataeye",
    dataKind: "live",
    rankingDate: "2026-06-06",
    rank: 1,
    title: "同名作品",
    heatValue: "1.0亿",
    dramaType: "测试",
    sourceRef: "https://playlet-applet.dataeye.com/playlet/motionComic"
  };

  assert.deepEqual(
    upsertRankingEntries([
      {
        ...base,
        rankType: 0,
        rankTypeName: "漫剧热播榜",
        rankPeriod: "day",
        periodValue: "2026-06-06"
      },
      {
        ...base,
        rankType: 1,
        rankTypeName: "动态漫榜",
        rankPeriod: "day",
        periodValue: "2026-06-06"
      },
      {
        ...base,
        rankType: 0,
        rankTypeName: "漫剧热播榜",
        rankPeriod: "week",
        periodValue: "2026-06-01 ~ 2026-06-07"
      }
    ]),
    { insertedCount: 3, skippedCount: 0 }
  );
  assert.deepEqual(
    upsertRankingEntries([
      {
        ...base,
        rankType: 0,
        rankTypeName: "漫剧热播榜",
        rankPeriod: "day",
        periodValue: "2026-06-06"
      }
    ]),
    { insertedCount: 0, skippedCount: 1 }
  );

  const rows = listRankingEntries({ date: "2026-06-06", source: "dataeye", dataKind: "live" });
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => `${row.rankType}:${row.rankPeriod}:${row.periodValue}`).sort(),
    ["0:day:2026-06-06", "0:week:2026-06-01 ~ 2026-06-07", "1:day:2026-06-06"]
  );
  assert.equal(listRankingEntries({ date: "2026-06-06", source: "dataeye", rankType: "0" }).length, 2);
  assert.equal(listRankingEntries({ date: "2026-06-06", source: "dataeye", rankPeriod: "week" }).length, 1);
});

test("ranking query uses canonical DataEye rank type names when stored labels were wrong", () => {
  useTempDb("ranking-dataeye-rank-type-name-normalize");
  upsertRankingEntries([
    {
      source: "dataeye",
      dataKind: "live",
      rankingDate: "2026-06-07",
      rankType: 2,
      rankTypeName: "沙雕漫榜",
      rankPeriod: "day",
      periodValue: "2026-06-07",
      rank: 1,
      title: "测试作品 A",
      heatValue: "1.0亿",
      dramaType: "测试",
      sourceRef: "test"
    },
    {
      source: "dataeye",
      dataKind: "live",
      rankingDate: "2026-06-07",
      rankType: 3,
      rankTypeName: "真人AI榜",
      rankPeriod: "day",
      periodValue: "2026-06-07",
      rank: 1,
      title: "测试作品 B",
      heatValue: "1.0亿",
      dramaType: "测试",
      sourceRef: "test"
    }
  ]);

  const rows = listRankingEntries({ date: "2026-06-07", source: "dataeye", dataKind: "live" });
  const byRankType = new Map(rows.map((row) => [row.rankType, row.rankTypeName]));

  assert.equal(byRankType.get(2), "真人AI榜");
  assert.equal(byRankType.get(3), "沙雕漫榜");
});

test("schema migration preserves capture data kind and allows later live rows", () => {
  const db = new Database(path.join(os.tmpdir(), `ranking-migration-${Date.now()}-${Math.random()}.sqlite`));
  db.exec(`
    CREATE TABLE ranking_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL CHECK (source IN ('dataeye', 'hongguo')),
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
      UNIQUE (source, ranking_date, normalized_title)
    );
    INSERT INTO ranking_entries (
      source, ranking_date, rank, title, normalized_title, heat_value,
      drama_type, source_ref, collected_at, raw_payload
    )
    VALUES (
      'dataeye', '2026-06-05', 1, '弃子逆袭，从烂瓦房到商界大佬',
      '弃子逆袭从烂瓦房到商界大佬', '1.4亿', '种田/逆袭/乡村',
      'dataeye:capture:test.har#0', '2026-06-06T00:00:00.000Z', '{}'
    );
  `);

  try {
    initSchema(db);
    const migrated = db
      .prepare(
        "SELECT data_kind AS dataKind, rank_type AS rankType, rank_type_name AS rankTypeName, rank_period AS rankPeriod, period_value AS periodValue FROM ranking_entries"
      )
      .get();
    assert.equal(migrated.dataKind, "capture");
    assert.equal(migrated.rankType, 0);
    assert.equal(migrated.rankTypeName, "漫剧热播榜");
    assert.equal(migrated.rankPeriod, "day");
    assert.equal(migrated.periodValue, "2026-06-05");

    const result = db
      .prepare(`
        INSERT OR IGNORE INTO ranking_entries (
          source, data_kind, rank_type, rank_type_name, rank_period, period_value,
          ranking_date, rank, title, normalized_title, heat_value,
          drama_type, source_ref, collected_at, raw_payload
        )
        VALUES (
          'dataeye', 'live', 1, '动态漫榜', 'day', '2026-06-05',
          '2026-06-05', 1, '弃子逆袭，从烂瓦房到商界大佬',
          '弃子逆袭从烂瓦房到商界大佬', '1.4亿', '种田/逆袭/乡村',
          'https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=1',
          '2026-06-06T00:00:00.000Z', '{}'
        )
      `)
      .run();
    assert.equal(result.changes, 1);
  } finally {
    db.close();
  }
});

test("ranking query marks exact novel matches and unmatched rows", () => {
  useTempDb("ranking-match");
  importSampleNovelMappings();
  upsertRankingEntries([
    {
      source: "hongguo",
      rankingDate: "2026-06-05",
      rank: 1,
      title: "玄门小祖宗",
      heatValue: "98万",
      dramaType: "玄学爽文",
      sourceRef: "test"
    },
    {
      source: "hongguo",
      rankingDate: "2026-06-05",
      rank: 2,
      title: "不存在的作品",
      heatValue: "10万",
      dramaType: "未知",
      sourceRef: "test"
    }
  ]);

  const rows = listRankingEntries({ date: "2026-06-05", source: "hongguo" });
  assert.equal(rows[0].matchStatus, "matched");
  assert.equal(rows[0].matchedNovelNames, "玄门小祖宗下山了");
  assert.equal(rows[1].matchStatus, "unmatched");
  assert.equal(rows[1].matchedNovelNames, "未匹配");
});

test("ranking query labels sample capture and live rows", () => {
  useTempDb("ranking-data-kind");
  upsertRankingEntries([
    {
      source: "dataeye",
      rankingDate: "2026-06-05",
      rank: 1,
      title: "模拟作品",
      heatValue: "10万",
      dramaType: "测试",
      sourceRef: "dataeye:sample:2026-06-05"
    },
    {
      source: "dataeye",
      rankingDate: "2026-06-05",
      rank: 2,
      title: "抓包作品",
      heatValue: "15万",
      dramaType: "测试",
      sourceRef: "dataeye:capture:dataeye.har#0"
    },
    {
      source: "dataeye",
      rankingDate: "2026-06-05",
      rank: 3,
      title: "真实候选作品",
      heatValue: "20万",
      dramaType: "测试",
      sourceRef: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0"
    }
  ]);

  const rows = listRankingEntries({ date: "2026-06-05", source: "dataeye" });
  assert.equal(rows[0].dataKind, "sample");
  assert.equal(rows[1].dataKind, "capture");
  assert.equal(rows[2].dataKind, "live");
  assert.equal(listRankingEntries({ date: "2026-06-05", source: "dataeye", dataKind: "sample" }).length, 1);
  assert.equal(listRankingEntries({ date: "2026-06-05", source: "dataeye", dataKind: "capture" }).length, 1);
  assert.equal(listRankingEntries({ date: "2026-06-05", source: "dataeye", dataKind: "live" }).length, 1);
});

test("normalizeRankingFilters validates source match and date", () => {
  assert.deepEqual(
    normalizeRankingFilters({
      date: "2026-06-05",
      source: "dataeye",
      match: "matched",
      dataKind: "capture",
      rankType: "1",
      rankPeriod: "week",
      periodValue: "2026-06-01 ~ 2026-06-07"
    }),
    {
      date: "2026-06-05",
      source: "dataeye",
      match: "matched",
      dataKind: "capture",
      rankType: "1",
      rankPeriod: "week",
      periodValue: "2026-06-01 ~ 2026-06-07"
    }
  );

  assert.throws(() => normalizeRankingFilters({ source: "bad" }), /不支持的榜单来源/);
  assert.throws(() => normalizeRankingFilters({ match: "bad" }), /不支持的匹配状态/);
  assert.throws(() => normalizeRankingFilters({ dataKind: "bad" }), /不支持的数据性质/);
  assert.throws(() => normalizeRankingFilters({ rankType: "bad" }), /不支持的榜单类型/);
  assert.throws(() => normalizeRankingFilters({ rankPeriod: "bad" }), /不支持的榜单周期/);
  assert.throws(() => normalizeRankingFilters({ date: "2026-02-30" }), /date 必须是有效/);
});

test("getLatestRankingDate returns newest stored ranking date", () => {
  useTempDb("ranking-latest-date");
  upsertRankingEntries([
    {
      source: "dataeye",
      rankingDate: "2026-06-04",
      rank: 1,
      title: "旧榜单",
      heatValue: "10万",
      dramaType: "测试",
      sourceRef: "test"
    },
    {
      source: "hongguo",
      rankingDate: "2026-06-06",
      rank: 1,
      title: "新榜单",
      heatValue: "20万",
      dramaType: "测试",
      sourceRef: "test"
    }
  ]);

  assert.equal(getLatestRankingDate(), "2026-06-06");
});

test("collection runs can be filtered by date source and mode", () => {
  useTempDb("collection-runs-filter");
  const base = {
    status: "success",
    message: "ok",
    insertedCount: 1,
    skippedCount: 0,
    startedAt: "2026-06-06T00:00:00.000Z",
    finishedAt: "2026-06-06T00:00:01.000Z"
  };

  insertCollectionRun({ ...base, source: "dataeye", rankingDate: "2026-06-06", mode: "live" });
  insertCollectionRun({ ...base, source: "dataeye", rankingDate: "2026-06-06", mode: "capture" });
  insertCollectionRun({ ...base, source: "hongguo", rankingDate: "2026-06-06", mode: "sample" });
  insertCollectionRun({ ...base, source: "dataeye", rankingDate: "2026-06-05", mode: "live" });

  const rows = listCollectionRuns({ date: "2026-06-06", source: "dataeye", mode: "live" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].source, "dataeye");
  assert.equal(rows[0].rankingDate, "2026-06-06");
  assert.equal(rows[0].mode, "live");

  assert.equal(listCollectionRuns({ date: "2026-06-06", source: "all", mode: "all" }).length, 3);
  assert.equal(listCollectionRuns(2).length, 2);
});

test("normalizeRunFilters validates source mode date and caps limit", () => {
  assert.deepEqual(normalizeRunFilters({ date: "2026-06-06", source: "dataeye", mode: "live", limit: 200 }), {
    date: "2026-06-06",
    source: "dataeye",
    mode: "live",
    limit: 100
  });

  assert.throws(() => normalizeRunFilters({ source: "bad" }), /不支持的榜单来源/);
  assert.throws(() => normalizeRunFilters({ mode: "bad" }), /不支持的采集模式/);
  assert.throws(() => normalizeRunFilters({ date: "2026-02-30" }), /date 必须是有效/);
});
