import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("watch-captures forwards an explicit login env file to the pipeline", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-watch-"));
  const capturesDir = path.join(tempRoot, "captures");
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  fs.mkdirSync(capturesDir, { recursive: true });
  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=watch-auth-value\nDATAEYE_LOGIN_USER_ID=650985\n");

  fs.writeFileSync(
    path.join(capturesDir, "dataeye-watch.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "http://127.0.0.1:9/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
              headers: [{ name: "content-type", value: "application/json" }]
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
                        ranking: 1,
                        playletName: "弃子逆袭，从烂瓦房到商界大佬",
                        playCount: "1.4亿",
                        tags: "种田/逆袭/乡村"
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

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/watch-captures.js"), "--login-env-file", envPath],
    {
      cwd: tempRoot,
      encoding: "utf8",
      env: { ...process.env, CAPTURE_WATCH_ONCE: "1" }
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Login env file: .*\.env\.local\.dataeye.*存在/);
  assert.match(result.stdout, /Found 1 existing capture file/);

  const pipeline = fs.readFileSync(path.join(tempRoot, "docs/capture-pipeline.md"), "utf8");
  const preflight = fs.readFileSync(path.join(tempRoot, "docs/capture-preflight.md"), "utf8");
  const validation = fs.readFileSync(path.join(tempRoot, "docs/request-validation.md"), "utf8");

  assert.match(pipeline, /\.env\.local\.dataeye.*存在/);
  assert.match(preflight, /\.env\.local\.dataeye.*存在/);
  assert.match(validation, /\.env\.local\.dataeye.*存在/);
});

test("watch-captures forwards a source filter to the pipeline", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-watch-source-"));
  const capturesDir = path.join(tempRoot, "captures");
  const envPath = path.join(tempRoot, ".env.local.hongguo");
  fs.mkdirSync(capturesDir, { recursive: true });
  fs.writeFileSync(envPath, "HONGGUO_SESSION=watch-hongguo-session\n");

  writeHar(path.join(capturesDir, "dataeye-watch.har"), {
    url: "http://127.0.0.1:9/dataeye/ranking/list?day=2026-06-05",
    title: "DataEye 作品"
  });
  writeHar(path.join(capturesDir, "hongguo-watch.har"), {
    url: "http://127.0.0.1:9/hongguo/ranking/list?day=2026-06-05",
    title: "红果作品"
  });

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/watch-captures.js"),
      "--source",
      "hongguo",
      "--login-env-file",
      envPath
    ],
    {
      cwd: tempRoot,
      encoding: "utf8",
      env: { ...process.env, CAPTURE_WATCH_ONCE: "1" }
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Source filter: hongguo/);

  const pipeline = fs.readFileSync(path.join(tempRoot, "docs/capture-pipeline.md"), "utf8");
  const preview = fs.readFileSync(path.join(tempRoot, "docs/ranking-preview.md"), "utf8");
  const validation = fs.readFileSync(path.join(tempRoot, "docs/request-validation.md"), "utf8");

  assert.match(pipeline, /validate-request\.js .*--source hongguo/);
  assert.match(pipeline, /来源过滤[\s\S]*hongguo/);
  assert.match(preview, /红果作品/);
  assert.doesNotMatch(preview, /DataEye 作品/);
  assert.match(validation, /来源过滤：hongguo/);
});

test("watch-captures can refresh DataEye login and run daily with the refreshed capture date", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-watch-auto-"));
  const capturesDir = path.join(tempRoot, "captures");
  const binDir = path.join(tempRoot, "bin");
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  const refreshScript = path.join(binDir, "refresh-stub.js");
  const dailyScript = path.join(binDir, "daily-stub.js");
  fs.mkdirSync(capturesDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });
  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=watch-auth-value\nDATAEYE_LOGIN_USER_ID=650985\n");
  writeHar(path.join(capturesDir, "dataeye-watch.har"), {
    url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0",
    title: "全家一起搬，商圈大换血"
  });
  fs.writeFileSync(
    refreshScript,
    [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      "fs.writeFileSync(path.join(process.cwd(), 'refresh-args.json'), JSON.stringify(process.argv.slice(2)));",
      "console.log('Status: ready');",
      "console.log('Date: 2026-06-06');"
    ].join("\n")
  );
  fs.writeFileSync(
    dailyScript,
    [
      "import fs from 'node:fs';",
      "import path from 'node:path';",
      "fs.writeFileSync(path.join(process.cwd(), 'daily-args.json'), JSON.stringify(process.argv.slice(2)));",
      "console.log('Status: ready');"
    ].join("\n")
  );

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/watch-captures.js"),
      "--source",
      "dataeye",
      "--login-env-file",
      envPath,
      "--auto-refresh-login",
      "--auto-daily"
    ],
    {
      cwd: tempRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        CAPTURE_WATCH_ONCE: "1",
        CAPTURE_WATCH_REFRESH_SCRIPT: refreshScript,
        CAPTURE_WATCH_DAILY_SCRIPT: dailyScript
      }
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Auto DataEye login refresh: enabled/);
  assert.match(result.stdout, /Auto DataEye daily: enabled/);

  const refreshArgs = JSON.parse(fs.readFileSync(path.join(tempRoot, "refresh-args.json"), "utf8"));
  const dailyArgs = JSON.parse(fs.readFileSync(path.join(tempRoot, "daily-args.json"), "utf8"));
  assert.deepEqual(refreshArgs, ["--date", "2026-06-06"]);
  assert.deepEqual(dailyArgs, [
    "--date",
    "2026-06-06",
    "--source",
    "dataeye",
    "--login-env-file",
    envPath
  ]);
});

function writeHar(filePath, { url, title }) {
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url,
              headers: [{ name: "content-type", value: "application/json" }]
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
                        title,
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
}
