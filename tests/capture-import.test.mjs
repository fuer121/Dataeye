import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("import-capture-ranking imports mappable HAR rows as capture data", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-import-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "dataeye-capture.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
              headers: [{ name: "content-type", value: "application/json" }]
            },
            startedDateTime: "2026-06-06T17:45:30.609+08:00",
            response: {
              status: 200,
              headers: [{ name: "content-type", value: "application/json" }],
              content: {
                mimeType: "application/json",
                text: JSON.stringify({
                  statusCode: 200,
                  content: [
                    {
                      ranking: 1,
                      playletName: "弃子逆袭，从烂瓦房到商界大佬",
                      playCount: "1.4亿",
                      tags: "[\"种田\",\"逆袭\",\"乡村\"]"
                    }
                  ]
                })
              }
            }
          }
        ]
      }
    })
  );

  const dbPath = path.join(tempRoot, "data/test.sqlite");
  const result = spawnSync(
    "node",
    [path.join(root, "scripts/import-capture-ranking.js"), "--date", "2026-06-05", "--source", "dataeye"],
    {
      cwd: tempRoot,
      env: { ...process.env, SQLITE_PATH: dbPath },
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Inserted: 1/);

  const markdown = fs.readFileSync(path.join(tempRoot, "docs/capture-import.md"), "utf8");
  assert.match(markdown, /抓包响应中的榜单数据已导入 SQLite/);
  assert.match(markdown, /capture 不等于 live/);
  assert.match(markdown, /--confirmed-preview/);
  assert.match(markdown, /confirmedPreview=true/);
  assert.match(markdown, /捕获时间 \| 2026-06-06T09:45:30.609Z/);
  assert.match(markdown, /抓包距今/);

  const db = new Database(dbPath);
  try {
    const row = db.prepare("SELECT source, ranking_date, title, source_ref FROM ranking_entries").get();
    assert.equal(row.source, "dataeye");
    assert.equal(row.ranking_date, "2026-06-05");
    assert.equal(row.title, "弃子逆袭，从烂瓦房到商界大佬");
    assert.match(row.source_ref, /dataeye:capture:dataeye-capture\.har#0/);

    const run = db.prepare("SELECT mode, status, inserted_count FROM collection_runs").get();
    assert.equal(run.mode, "capture");
    assert.equal(run.status, "success");
    assert.equal(run.inserted_count, 1);
  } finally {
    db.close();
  }
});

test("import-capture-ranking respects source filters", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-import-source-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "dataeye-capture.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
              headers: [{ name: "content-type", value: "application/json" }]
            },
            startedDateTime: "2026-06-06T17:45:30.609+08:00",
            response: {
              status: 200,
              headers: [{ name: "content-type", value: "application/json" }],
              content: {
                mimeType: "application/json",
                text: JSON.stringify({
                  statusCode: 200,
                  content: [
                    {
                      ranking: 1,
                      playletName: "弃子逆袭，从烂瓦房到商界大佬",
                      playCount: "1.4亿",
                      tags: "[\"种田\",\"逆袭\",\"乡村\"]"
                    }
                  ]
                })
              }
            }
          }
        ]
      }
    })
  );

  const dbPath = path.join(tempRoot, "data/test.sqlite");
  const result = spawnSync(
    "node",
    [path.join(root, "scripts/import-capture-ranking.js"), "--date", "2026-06-05", "--source", "hongguo"],
    {
      cwd: tempRoot,
      env: { ...process.env, SQLITE_PATH: dbPath },
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);

  const markdown = fs.readFileSync(path.join(tempRoot, "docs/capture-import.md"), "utf8");
  assert.match(markdown, /source=hongguo/);

  const db = new Database(dbPath);
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ranking_entries").get().count, 0);
    const run = db.prepare("SELECT source, mode, status FROM collection_runs").get();
    assert.equal(run.source, "hongguo");
    assert.equal(run.mode, "capture");
    assert.equal(run.status, "failed");
  } finally {
    db.close();
  }
});

test("import-capture-ranking can infer date from request payload", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-import-payload-date-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "hongguo-capture.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "POST",
              url: "https://api.example.com/hongguo/ranking/list",
              headers: [{ name: "content-type", value: "application/json" }],
              postData: {
                mimeType: "application/json",
                text: JSON.stringify({ rankingDate: "2026-06-05", page: 1 })
              }
            },
            startedDateTime: "2026-06-06T17:45:30.609+08:00",
            response: {
              status: 200,
              headers: [{ name: "content-type", value: "application/json" }],
              content: {
                mimeType: "application/json",
                text: JSON.stringify({
                  data: {
                    list: [
                      {
                        rank: 1,
                        title: "红果作品",
                        heatValue: "9999w",
                        dramaType: "都市/逆袭"
                      }
                    ]
                  }
                })
              }
            }
          }
        ]
      }
    })
  );

  const dbPath = path.join(tempRoot, "data/test.sqlite");
  const result = spawnSync(
    "node",
    [path.join(root, "scripts/import-capture-ranking.js"), "--date", "2026-06-05", "--source", "hongguo"],
    {
      cwd: tempRoot,
      env: { ...process.env, SQLITE_PATH: dbPath },
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Inserted: 1/);

  const db = new Database(dbPath);
  try {
    const row = db.prepare("SELECT source, data_kind, ranking_date, title FROM ranking_entries").get();
    assert.equal(row.source, "hongguo");
    assert.equal(row.data_kind, "capture");
    assert.equal(row.ranking_date, "2026-06-05");
    assert.equal(row.title, "红果作品");
  } finally {
    db.close();
  }
});
