import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("refresh-dataeye-login reports missing target capture material", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-refresh-empty-"));
  fs.mkdirSync(path.join(tempRoot, "captures"), { recursive: true });

  const result = spawnSync("node", [path.join(root, "scripts/refresh-dataeye-login.js")], {
    cwd: tempRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-login-refresh.md"), "utf8");
  assert.match(report, /未找到 DataEye 小程序目标请求/);
  assert.match(report, /captures\//);
});

test("refresh-dataeye-login writes local DataEye env from target HAR without leaking secrets", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-refresh-target-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "fresh.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-07&rankType=0",
              headers: [
                { name: "authentication", value: "abcdefghijklmnopqrstuvwxyz1234567890" },
                { name: "loginUserId", value: "650985" },
                { name: "S", value: "test-signature-value-1234" },
                { name: "referer", value: "https://servicewechat.com/test/page-frame.html" },
                { name: "user-agent", value: "MicroMessenger/8.0.74 iPhone" }
              ]
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

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/refresh-dataeye-login.js"), "--skip-preview"],
    {
      cwd: tempRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Status: ready/);

  const localEnv = fs.readFileSync(path.join(tempRoot, ".env.local.dataeye"), "utf8");
  assert.match(localEnv, /DATAEYE_AUTHENTICATION=abcdefghijklmnopqrstuvwxyz1234567890/);
  assert.match(localEnv, /DATAEYE_LOGIN_USER_ID=650985/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-login-refresh.md"), "utf8");
  assert.match(report, /2026-06-07/);
  assert.match(report, /跳过预检/);
  assert.match(report, /collect:preview -- --date 2026-06-07 --source dataeye --login-env-file \.env\.local\.dataeye/);
  assert.match(report, /abcd\.\.\.7890/);
  assert.doesNotMatch(report, /abcdefghijklmnopqrstuvwxyz1234567890/);
});

test("refresh-dataeye-login prefers the newest target request when old and new captures coexist", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-refresh-newest-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  writeDataEyeHar(path.join(capturesDir, "aaa-old-charles.har"), {
    startedDateTime: "2026-06-07T02:55:21.392Z",
    authentication: "old-charles-authentication-value",
    title: "旧抓包作品"
  });
  writeDataEyeHar(path.join(capturesDir, "zzz-new-proxyman.har"), {
    startedDateTime: "2026-06-07T09:41:06.886Z",
    authentication: "new-proxyman-authentication-value",
    title: "新抓包作品"
  });

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/refresh-dataeye-login.js"), "--skip-preview", "--allow-stale-capture"],
    {
      cwd: tempRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Status: ready/);

  const localEnv = fs.readFileSync(path.join(tempRoot, ".env.local.dataeye"), "utf8");
  assert.match(localEnv, /DATAEYE_AUTHENTICATION=new-proxyman-authentication-value/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-login-refresh.md"), "utf8");
  assert.match(report, /zzz-new-proxyman\.har#0/);
  assert.doesNotMatch(report, /aaa-old-charles\.har#0/);
});

test("refresh-dataeye-login can use a newer non-target motionComic request as the login source", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-refresh-login-source-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  writeDataEyeHar(path.join(capturesDir, "aaa-old-target.har"), {
    startedDateTime: "2026-06-07T02:55:21.392Z",
    authentication: "old-target-authentication-value",
    title: "旧目标抓包作品",
    rankType: "0",
    pageSize: "30"
  });
  writeDataEyeHar(path.join(capturesDir, "zzz-new-tab.har"), {
    startedDateTime: "2026-06-07T12:07:34.895Z",
    authentication: "new-tab-authentication-value",
    title: "新 Tab 抓包作品",
    rankType: "1",
    pageSize: "3"
  });

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/refresh-dataeye-login.js"), "--skip-preview", "--allow-stale-capture"],
    {
      cwd: tempRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const localEnv = fs.readFileSync(path.join(tempRoot, ".env.local.dataeye"), "utf8");
  assert.match(localEnv, /DATAEYE_AUTHENTICATION=new-tab-authentication-value/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-login-refresh.md"), "utf8");
  assert.match(report, /zzz-new-tab\.har#0/);
  assert.match(report, /请求日期 \| 2026-06-06/);
});

test("refresh-dataeye-login fails when refreshed DataEye login state cannot pass preview", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-refresh-preview-failed-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "missing-login-user.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-07&rankType=0",
              headers: [
                { name: "authentication", value: "abcdefghijklmnopqrstuvwxyz1234567890" },
                { name: "S", value: "test-signature-value-1234" }
              ]
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

  const env = { ...process.env };
  for (const key of ["DATAEYE_AUTHENTICATION", "DATAEYE_LOGIN_USER_ID", "DATAEYE_S", "DATAEYE_REFERER", "DATAEYE_USER_AGENT"]) {
    delete env[key];
  }

  const result = spawnSync("node", [path.join(root, "scripts/refresh-dataeye-login.js")], {
    cwd: tempRoot,
    env,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: preview_failed/);
  assert.match(result.stdout, /Source: dataeye/);

  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-login-refresh.md"), "utf8");
  assert.match(report, /live 预检未通过/);
  assert.match(report, /预检结果 \| failed/);
  assert.match(report, /不要执行 `npm run collect:live`/);
});

test("refresh-dataeye-login does not overwrite local env from stale capture by default", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-refresh-stale-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });
  fs.writeFileSync(path.join(tempRoot, ".env.local.dataeye"), "DATAEYE_AUTHENTICATION=keep-existing\n");

  fs.writeFileSync(
    path.join(capturesDir, "stale.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-07&rankType=0",
              headers: [
                { name: "authentication", value: "stale-authentication-value" },
                { name: "loginUserId", value: "650985" }
              ]
            },
            startedDateTime: "2020-01-01T00:00:00.000Z",
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

  const result = spawnSync("node", [path.join(root, "scripts/refresh-dataeye-login.js")], {
    cwd: tempRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: stale_capture/);

  const localEnv = fs.readFileSync(path.join(tempRoot, ".env.local.dataeye"), "utf8");
  assert.equal(localEnv, "DATAEYE_AUTHENTICATION=keep-existing\n");

  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-login-refresh.md"), "utf8");
  assert.match(report, /抓包材料不是 fresh/);
  assert.match(report, /本地登录态文件 \| 未写入/);
  assert.match(report, /重新打开剧查查小程序/);
});

function writeDataEyeHar(filePath, { startedDateTime, authentication, title, rankType = "0", pageSize = "30" }) {
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      log: {
        entries: [
          {
            startedDateTime,
            request: {
              method: "GET",
              url: `https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=${pageSize}&day=2026-06-06&rankType=${rankType}`,
              headers: [
                { name: "authentication", value: authentication },
                { name: "loginUserId", value: "650985" },
                { name: "S", value: "test-signature-value-1234" },
                { name: "referer", value: "https://servicewechat.com/test/page-frame.html" },
                { name: "user-agent", value: "MicroMessenger/8.0.74 iPhone" }
              ]
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
                      playletName: title,
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
}
