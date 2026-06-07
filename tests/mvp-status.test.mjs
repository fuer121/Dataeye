import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resetDbForTests } from "../lib/db.js";
import { upsertNovelMappings } from "../lib/novels.js";
import { insertCollectionRun, upsertRankingEntries } from "../lib/rankings.js";

test("check-mvp-status reports local MVP readiness without network calls", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mvp-status-"));
  const dbPath = path.join(tempRoot, "status.sqlite");
  resetDbForTests(dbPath);

  upsertNovelMappings([
    {
      novelName: "商圈换血原著",
      dramaTitle: "全家一起搬，商圈大换血",
      relationType: "manual",
      sourceRef: "test"
    }
  ]);
  upsertRankingEntries([
    {
      source: "dataeye",
      dataKind: "live",
      rankingDate: "2026-06-06",
      rank: 1,
      title: "全家一起搬，商圈大换血",
      heatValue: "1.9亿",
      dramaType: "都市日常/现代/逆袭/剧情",
      sourceRef: "test"
    }
  ]);
  insertCollectionRun({
    source: "dataeye",
    rankingDate: "2026-06-06",
    mode: "live",
    status: "success",
    message: "采集完成：新增 1 条，跳过重复 0 条。",
    insertedCount: 1,
    skippedCount: 0,
    startedAt: "2026-06-07T00:00:00.000Z",
    finishedAt: "2026-06-07T00:00:01.000Z"
  });

  fs.writeFileSync(path.join(tempRoot, ".env.local.dataeye"), "DATAEYE_AUTHENTICATION=auth\nDATAEYE_LOGIN_USER_ID=650985\n");

  const result = spawnSync("node", [path.join(root, "scripts/check-mvp-status.js")], {
    cwd: tempRoot,
    env: { ...process.env, SQLITE_PATH: dbPath },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Status: ready/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/mvp-status.md"), "utf8");
  assert.match(report, /DataEye live 数据 \| ready/);
  assert.match(report, /2026-06-06/);
  assert.match(report, /全家一起搬，商圈大换血/);
  assert.match(report, /商圈换血原著/);
  assert.match(report, /小说映射 \| ready/);
  assert.match(report, /红果 live \| paused/);
  assert.match(report, /本脚本不发起网络请求/);
});

test("check-mvp-status highlights expired DataEye preview login state", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mvp-status-preview-"));
  const dbPath = path.join(tempRoot, "status.sqlite");
  resetDbForTests(dbPath);

  upsertNovelMappings([
    {
      novelName: "商圈换血原著",
      dramaTitle: "全家一起搬，商圈大换血",
      relationType: "manual",
      sourceRef: "test"
    }
  ]);
  upsertRankingEntries([
    {
      source: "dataeye",
      dataKind: "live",
      rankingDate: "2026-06-06",
      rank: 1,
      title: "全家一起搬，商圈大换血",
      heatValue: "1.9亿",
      dramaType: "都市日常/现代/逆袭/剧情",
      sourceRef: "test"
    }
  ]);
  fs.writeFileSync(path.join(tempRoot, ".env.local.dataeye"), "DATAEYE_AUTHENTICATION=auth\nDATAEYE_LOGIN_USER_ID=650985\n");
  fs.mkdirSync(path.join(tempRoot, "docs"), { recursive: true });
  fs.writeFileSync(
    path.join(tempRoot, "docs/live-collection-preview.md"),
    `# 真实采集预检

生成时间：2026-06-07T04:59:23.422Z

| 项 | 内容 |
| --- | --- |
| 来源 | dataeye |
| 日期 | 2026-06-07 |
| 状态 | failed |
| 榜单条数 | 0 |
| 错误 | DataEye / 剧查查接口业务状态异常：statusCode=401，message=登录态已失效，请重新登录 |
| 下一步 | 请重新打开剧查查小程序并用 Charles 导出新 HAR，然后更新 .env.local.dataeye 后重新预检。 |
`
  );

  const result = spawnSync("node", [path.join(root, "scripts/check-mvp-status.js")], {
    cwd: tempRoot,
    env: { ...process.env, SQLITE_PATH: dbPath },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Status: attention/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/mvp-status.md"), "utf8");
  assert.match(report, /最近 DataEye 预检 \| auth_expired/);
  assert.match(report, /2026-06-07/);
  assert.match(report, /登录态已失效/);
  assert.match(report, /npm run dataeye:refresh-login/);
});

test("check-mvp-status reports latest DataEye capture material freshness", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mvp-status-capture-"));
  const dbPath = path.join(tempRoot, "status.sqlite");
  resetDbForTests(dbPath);
  fs.mkdirSync(path.join(tempRoot, "captures"), { recursive: true });

  fs.writeFileSync(
    path.join(tempRoot, "captures/dataeye-latest.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            startedDateTime: "2026-06-07T02:55:21.392Z",
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0",
              headers: []
            },
            response: {
              status: 200,
              content: {
                mimeType: "application/json",
                text: JSON.stringify({
                  statusCode: 200,
                  content: [
                    {
                      ranking: 1,
                      playletName: "全家一起搬，商圈大换血",
                      playCount: "1.9亿",
                      tags: "[\"都市日常\"]"
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

  const result = spawnSync("node", [path.join(root, "scripts/check-mvp-status.js")], {
    cwd: tempRoot,
    env: { ...process.env, SQLITE_PATH: dbPath },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const report = fs.readFileSync(path.join(tempRoot, "docs/mvp-status.md"), "utf8");
  assert.match(report, /最新 DataEye 抓包 \| ready/);
  assert.match(report, /2026-06-06/);
  assert.match(report, /dataeye-latest\.har#0/);
  assert.match(report, /抓包新鲜度/);
});

test("check-mvp-status reports latest DataEye daily scheduler result", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mvp-status-daily-"));
  const dbPath = path.join(tempRoot, "status.sqlite");
  resetDbForTests(dbPath);
  fs.mkdirSync(path.join(tempRoot, "docs"), { recursive: true });
  fs.writeFileSync(
    path.join(tempRoot, "docs/dataeye-daily-run.md"),
    `# DataEye 每日采集

生成时间：2026-06-07T08:00:00.000Z

| 项 | 内容 |
| --- | --- |
| 来源 | dataeye |
| 日期 | 2026-06-07 |
| 状态 | auth_expired |
| 预检条数 | 0 |
| live 是否执行 | 否 |
| 下一步 | 请重新打开剧查查小程序并用 Charles 导出新 HAR，然后更新 .env.local.dataeye 后重新预检。 |

## 预检结果

| 项 | 内容 |
| --- | --- |
| 状态 | failed |
| 错误 | DataEye / 剧查查接口业务状态异常：statusCode=401，message=登录态已失效，请重新登录 |
`
  );

  const result = spawnSync("node", [path.join(root, "scripts/check-mvp-status.js")], {
    cwd: tempRoot,
    env: { ...process.env, SQLITE_PATH: dbPath },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const report = fs.readFileSync(path.join(tempRoot, "docs/mvp-status.md"), "utf8");
  assert.match(report, /最近 DataEye 调度 \| auth_expired/);
  assert.match(report, /2026-06-07/);
  assert.match(report, /DataEye daily/);
  assert.match(report, /dataeye:daily/);
});
