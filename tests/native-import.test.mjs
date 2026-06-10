import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import Database from "better-sqlite3";
import * as XLSX from "xlsx";

import { resetDbForTests } from "../lib/db.js";
import { upsertNovelMappings } from "../lib/novels.js";
import { listRankingEntries } from "../lib/rankings.js";
import {
  importNativeRankings,
  normalizeNativeExportDate,
  resolveNativeRankingDate
} from "../lib/native-rankings.js";

function useTempWorkspace(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
  resetDbForTests(path.join(root, "data/ju-chacha.sqlite"));
  return root;
}

function writeNativeWorkbook(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  XLSX.writeFile(workbook, filePath);
}

function writeNativeFiles(root, exportFolder = "0610") {
  const dir = path.join(root, "原生短剧数据", exportFolder);
  writeNativeWorkbook(path.join(dir, "day.xlsx"), [
    ["短剧名称", "消耗"],
    ["(null)", 92901.22],
    ["老公为白月光点天灯后，后悔了", 11488.11],
    ["隐龙傲世", 10071.38]
  ]);
  writeNativeWorkbook(path.join(dir, "week.xlsx"), [
    ["短剧名称", "消耗"],
    ["婚礼当天立规矩，这婚我不结了", 68859.91]
  ]);
  writeNativeWorkbook(path.join(dir, "month.xlsx"), [
    ["短剧名称", "消耗"],
    ["亲妈重生第三天", 93160.69]
  ]);
  return dir;
}

test("native export dates support MMDD and resolve to T-1 ranking date", () => {
  assert.equal(normalizeNativeExportDate("0610"), "2026-06-10");
  assert.equal(normalizeNativeExportDate("20260610"), "2026-06-10");
  assert.equal(normalizeNativeExportDate("2026-06-10"), "2026-06-10");
  assert.equal(resolveNativeRankingDate("0610"), "2026-06-09");
});

test("importNativeRankings imports day week month rows and skips null title rows", () => {
  const root = useTempWorkspace("native-import");
  writeNativeFiles(root);

  const result = importNativeRankings({ exportDate: "0610", baseDir: path.join(root, "原生短剧数据") });

  assert.equal(result.source, "native");
  assert.equal(result.exportDate, "2026-06-10");
  assert.equal(result.rankingDate, "2026-06-09");
  assert.equal(result.insertedCount, 4);
  assert.equal(result.skippedCount, 0);
  assert.deepEqual(
    result.periods.map((period) => `${period.period}:${period.rowCount}`),
    ["day:2", "week:1", "month:1"]
  );

  const dayRows = listRankingEntries({ date: "2026-06-09", source: "native", rankPeriod: "day" });
  assert.equal(dayRows.length, 2);
  assert.equal(dayRows[0].rank, 1);
  assert.equal(dayRows[0].title, "老公为白月光点天灯后，后悔了");
  assert.equal(dayRows[0].heatValue, "11488.11");
  assert.equal(dayRows[0].dramaType, "未知");
  assert.equal(dayRows[0].dataKind, "live");
  assert.equal(dayRows[0].periodValue, "2026-06-09");
  assert.match(dayRows[0].sourceRef, /native:excel:2026-06-10:day/);
});

test("importNativeRankings skips duplicates on repeat import", () => {
  const root = useTempWorkspace("native-import-duplicate");
  writeNativeFiles(root);

  importNativeRankings({ exportDate: "2026-06-10", baseDir: path.join(root, "原生短剧数据") });
  const second = importNativeRankings({ exportDate: "2026-06-10", baseDir: path.join(root, "原生短剧数据") });

  assert.equal(second.insertedCount, 0);
  assert.equal(second.skippedCount, 4);
  assert.equal(listRankingEntries({ date: "2026-06-09", source: "native" }).length, 4);
});

test("importNativeRankings fails before writing when a required period file is missing", () => {
  const root = useTempWorkspace("native-import-missing");
  const dir = path.join(root, "原生短剧数据", "0610");
  writeNativeWorkbook(path.join(dir, "day.xlsx"), [["短剧名称", "消耗"], ["短剧A", 1]]);
  writeNativeWorkbook(path.join(dir, "week.xlsx"), [["短剧名称", "消耗"], ["短剧B", 2]]);

  assert.throws(
    () => importNativeRankings({ exportDate: "0610", baseDir: path.join(root, "原生短剧数据") }),
    /缺少原生短剧 Excel 文件.*month\.xlsx/
  );
  assert.equal(listRankingEntries({ date: "2026-06-09", source: "native" }).length, 0);
});

test("native source participates in exact novel matching", () => {
  const root = useTempWorkspace("native-import-match");
  writeNativeFiles(root);
  upsertNovelMappings([
    {
      novelName: "白月光点灯原著",
      dramaTitle: "老公为白月光点天灯后，后悔了",
      relationType: "exact",
      sourceRef: "test"
    }
  ]);

  importNativeRankings({ exportDate: "0610", baseDir: path.join(root, "原生短剧数据") });

  const rows = listRankingEntries({ date: "2026-06-09", source: "native", match: "matched" });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].matchedNovelNames, "白月光点灯原著");
});

test("native import CLI writes rows and collection run summary", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "native-import-cli-"));
  writeNativeFiles(root);
  const sqlitePath = path.join(root, "data/ju-chacha.sqlite");
  const result = spawnSync(
    "node",
    [path.join(process.cwd(), "scripts/import-native-rankings.js"), "--export-date", "0610", "--base-dir", path.join(root, "原生短剧数据")],
    {
      cwd: root,
      env: { ...process.env, SQLITE_PATH: sqlitePath },
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Status: success/);
  assert.match(result.stdout, /Ranking date: 2026-06-09/);

  const db = new Database(sqlitePath);
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ranking_entries WHERE source = 'native'").get().count, 4);
    const run = db.prepare("SELECT source, mode, status, inserted_count FROM collection_runs").get();
    assert.equal(run.source, "native");
    assert.equal(run.mode, "live");
    assert.equal(run.status, "success");
    assert.equal(run.inserted_count, 4);
  } finally {
    db.close();
  }
});
