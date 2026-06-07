import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCollection } from "../lib/collection.js";
import { resetDbForTests } from "../lib/db.js";
import { listCollectionRuns, listRankingEntries } from "../lib/rankings.js";

const ENV_KEYS = [
  "DATAEYE_AUTHENTICATION",
  "DATAEYE_LOGIN_USER_ID",
  "DATAEYE_S",
  "DATAEYE_REFERER",
  "DATAEYE_USER_AGENT",
  "DATAEYE_COOKIE",
  "DATAEYE_AUTHORIZATION",
  "DATAEYE_SESSION",
  "DATAEYE_TOKEN"
];

const CLI_ENV_KEYS = [
  ...ENV_KEYS,
  "SQLITE_PATH"
];

test("runCollection writes live DataEye rows and skips duplicate titles", async () => {
  resetDbForTests(path.join(os.tmpdir(), `collection-live-${Date.now()}-${Math.random()}.sqlite`));
  const restoreEnv = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "弃子逆袭，从烂瓦房到商界大佬",
            playCount: "1.4亿",
            tags: "[\"种田\",\"逆袭\",\"乡村\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    const first = await runCollection({ date: "2026-06-05", source: "dataeye", mode: "live" });
    const second = await runCollection({ date: "2026-06-05", source: "dataeye", mode: "live" });

    assert.equal(first.failed, false);
    assert.equal(first.runs[0].insertedCount, 1);
    assert.equal(first.runs[0].skippedCount, 0);
    assert.equal(second.failed, false);
    assert.equal(second.runs[0].insertedCount, 0);
    assert.equal(second.runs[0].skippedCount, 1);

    const rows = listRankingEntries({ date: "2026-06-05", source: "dataeye" });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "弃子逆袭，从烂瓦房到商界大佬");

    const runs = listCollectionRuns(2);
    assert.equal(runs.length, 2);
    assert.equal(runs[0].status, "success");
    assert.equal(runs[1].status, "success");
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
});

test("runCollection stores expired DataEye login recovery action in failed runs", async () => {
  resetDbForTests(path.join(os.tmpdir(), `collection-expired-login-${Date.now()}-${Math.random()}.sqlite`));
  const restoreEnv = installEnv({
    DATAEYE_AUTHENTICATION: "expired-auth",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(JSON.stringify({ statusCode: 401, message: "登录态已失效，请重新登录" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  try {
    const result = await runCollection({ date: "2026-06-07", source: "dataeye", mode: "live" });

    assert.equal(result.failed, true);
    assert.equal(result.runs[0].status, "failed");
    assert.match(result.runs[0].message, /登录态已失效/);
    assert.match(result.runs[0].message, /下一步：请重新打开剧查查小程序并用 Charles\/Proxyman 导出新 HAR/);

    const runs = listCollectionRuns(1);
    assert.equal(runs[0].insertedCount, 0);
    assert.match(runs[0].message, /更新 \.env\.local\.dataeye/);
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
});

test("collect-live CLI requires explicit preview confirmation", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "collect-live-confirmation-"));
  const env = { ...process.env };
  for (const key of CLI_ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/collect-live.js"), "--date", "2026-06-05", "--source", "dataeye"],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-run.md"), "utf8");
  assert.match(markdown, /预检确认 \| 否/);
  assert.match(markdown, /--confirmed-preview/);
  assert.match(markdown, /真实采集落库前需要先完成预检/);

  const db = new Database(path.join(tempRoot, "data/ju-chacha.sqlite"));
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ranking_entries").get().count, 0);
    assert.equal(db.prepare("SELECT status FROM collection_runs").get().status, "failed");
  } finally {
    db.close();
  }
});

test("collect-live CLI rejects paused Hongguo live collection without writing a run", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "collect-live-hongguo-paused-"));
  const env = { ...process.env };
  for (const key of CLI_ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/collect-live.js"), "--date", "2026-06-05", "--source", "hongguo"],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-run.md"), "utf8");
  assert.match(markdown, /红果真实采集已暂停推进/);
  assert.match(markdown, /capture:pipeline -- --source hongguo/);
  assert.doesNotMatch(markdown, /DATAEYE_AUTHENTICATION/);
  assert.equal(fs.existsSync(path.join(tempRoot, "data/ju-chacha.sqlite")), false);
});

test("collect-live CLI reports missing login state after preview confirmation", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "collect-live-cli-"));
  const env = { ...process.env };
  for (const key of CLI_ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/collect-live.js"),
      "--date",
      "2026-06-05",
      "--source",
      "dataeye",
      "--confirmed-preview"
    ],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-run.md"), "utf8");
  assert.match(markdown, /登录态文件：默认 \.env\.local \/ 当前进程环境/);
  assert.match(markdown, /预检确认 \| 是/);
  assert.match(markdown, /真实采集落库未完成/);
  assert.match(markdown, /DATAEYE_AUTHENTICATION/);

  const db = new Database(path.join(tempRoot, "data/ju-chacha.sqlite"));
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ranking_entries").get().count, 0);
    assert.equal(db.prepare("SELECT status FROM collection_runs").get().status, "failed");
  } finally {
    db.close();
  }
});

test("collect-live CLI can read an explicit env file without inserting rows on incomplete login", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "collect-live-env-file-"));
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  const env = { ...process.env };
  for (const key of CLI_ENV_KEYS) delete env[key];

  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=auth-file-value\n");

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/collect-live.js"),
      "--date",
      "2026-06-05",
      "--source",
      "dataeye",
      "--login-env-file",
      envPath,
      "--confirmed-preview"
    ],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-run.md"), "utf8");
  assert.match(markdown, /登录态文件：.*\.env\.local\.dataeye.*存在/);
  assert.match(markdown, /预检确认 \| 是/);
  assert.match(markdown, /DATAEYE_AUTHENTICATION \| auth\.\.\.alue/);
  assert.match(markdown, /DATAEYE_LOGIN_USER_ID \| 未提供/);
  assert.match(markdown, /collect:preview -- --date 2026-06-05 --source dataeye --login-env-file .*\.env\.local\.dataeye/);
  assert.match(markdown, /collect:live -- --date 2026-06-05 --source dataeye --login-env-file .*\.env\.local\.dataeye --confirmed-preview/);

  const db = new Database(path.join(tempRoot, "data/ju-chacha.sqlite"));
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ranking_entries").get().count, 0);
    assert.equal(db.prepare("SELECT status FROM collection_runs").get().status, "failed");
  } finally {
    db.close();
  }
});

test("collect-live success report links directly to the live data view", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "scripts/collect-live.js"), "utf8");

  assert.match(source, /http:\/\/localhost:3000\/\?date=\$\{rankingDate\}&source=\$\{source\}&dataKind=live/);
});

function installEnv(values) {
  const previous = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, values);

  return () => {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  };
}
