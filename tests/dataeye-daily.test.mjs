import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runDataEyeDailyCollection } from "../lib/dataeye-daily.js";
import { resetDbForTests } from "../lib/db.js";
import { listRankingEntries } from "../lib/rankings.js";

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

test("DataEye daily collection only writes live rows after preview returns rows", { concurrency: false }, async () => {
  resetDbForTests(path.join(os.tmpdir(), `dataeye-daily-success-${Date.now()}-${Math.random()}.sqlite`));
  const restoreEnv = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  let requestCount = 0;

  global.fetch = async () => {
    requestCount += 1;
    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "全家一起搬，商圈大换血",
            playCount: "1.9亿",
            tags: "[\"都市日常\",\"现代\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const result = await runDataEyeDailyCollection({ rankingDate: "2026-06-06", rankType: "0", period: "day" });

    assert.equal(result.ok, true);
    assert.equal(result.status, "success");
    assert.equal(result.preview.rows.length, 1);
    assert.equal(result.live.runs[0].status, "success");
    assert.equal(result.live.runs[0].insertedCount, 1);
    assert.equal(requestCount, 2);

    const rows = listRankingEntries({ date: "2026-06-06", source: "dataeye", dataKind: "live" });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "全家一起搬，商圈大换血");
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
});

test("DataEye daily collection does not write live rows when preview auth expires", { concurrency: false }, async () => {
  resetDbForTests(path.join(os.tmpdir(), `dataeye-daily-expired-${Date.now()}-${Math.random()}.sqlite`));
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
    const result = await runDataEyeDailyCollection({ rankingDate: "2026-06-07" });

    assert.equal(result.ok, false);
    assert.equal(result.status, "auth_expired");
    assert.equal(result.live, null);
    assert.match(result.preview.error, /登录态已失效/);
    assert.match(result.nextAction, /导出新 HAR/);
    assert.equal(listRankingEntries({ date: "2026-06-07", source: "dataeye", dataKind: "live" }).length, 0);
  } finally {
    global.fetch = originalFetch;
    restoreEnv();
  }
});

test("dataeye daily CLI rejects non-DataEye sources and writes no rows", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-daily-source-"));
  const env = { ...process.env };
  for (const key of CLI_ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/dataeye-daily.js"), "--date", "2026-06-06", "--source", "hongguo"],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);
  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-daily-run.md"), "utf8");
  assert.match(report, /只支持 source=dataeye/);
  assert.match(report, /红果真实采集仍保持暂停/);
  assert.equal(fs.existsSync(path.join(tempRoot, "data/ju-chacha.sqlite")), false);
});

test("dataeye daily CLI records auth-expired preflight without inserting rows", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-daily-cli-expired-"));
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  const env = { ...process.env };
  for (const key of CLI_ENV_KEYS) delete env[key];
  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=expired\nDATAEYE_LOGIN_USER_ID=650985\n");

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/dataeye-daily.js"),
      "--date",
      "2026-06-06",
      "--login-env-file",
      envPath
    ],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: auth_expired|Status: failed/);
  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-daily-run.md"), "utf8");
  assert.match(report, /登录态文件：.*\.env\.local\.dataeye.*存在/);
  assert.match(report, /真实采集未落库/);

  const dbPath = path.join(tempRoot, "data/ju-chacha.sqlite");
  if (fs.existsSync(dbPath)) {
    const db = new Database(dbPath);
    try {
      assert.equal(db.prepare("SELECT COUNT(*) AS count FROM ranking_entries").get().count, 0);
    } finally {
      db.close();
    }
  }
});

test("dataeye daily CLI defaults to all rank types and all periods", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "scripts/dataeye-daily.js"), "utf8");
  const lib = fs.readFileSync(path.join(process.cwd(), "lib/dataeye-daily.js"), "utf8");

  assert.match(source, /const rankType = args\.rankType \|\| "all";/);
  assert.match(source, /const period = args\.period \|\| "all";/);
  assert.match(lib, /rankType = "all"/);
  assert.match(lib, /period = "all"/);
});

function installEnv(values) {
  const previous = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) process.env[key] = value;

  return () => {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  };
}
