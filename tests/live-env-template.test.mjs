import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("extract-live-env-template writes masked DataEye env hints from target HAR", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "live-env-template-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "target.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
              headers: [
                { name: "authentication", value: "abcdefghijklmnopqrstuvwxyz1234567890" },
                { name: "loginUserId", value: "650985" },
                { name: "S", value: "test-signature-value-1234" },
                { name: "referer", value: "https://servicewechat.com/test/page-frame.html" },
                { name: "user-agent", value: "MicroMessenger" }
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
                      playletName: "弃子逆袭，从烂瓦房到商界大佬",
                      playCount: "1.4亿",
                      tags: "[\"种田\"]"
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

  const result = spawnSync("node", [path.join(root, "scripts/extract-live-env-template.js")], {
    cwd: tempRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-env-template.md"), "utf8");

  assert.match(markdown, /DATAEYE_AUTHENTICATION/);
  assert.match(markdown, /DATAEYE_LOGIN_USER_ID/);
  assert.match(markdown, /DATAEYE_REFERER/);
  assert.match(markdown, /motionComic/);
  assert.match(markdown, /abcd\.\.\.7890/);
  assert.match(markdown, /collect:live -- --date 2026-06-05 --source dataeye --login-env-file \.env\.local\.dataeye --confirmed-preview/);
  assert.doesNotMatch(markdown, /abcdefghijklmnopqrstuvwxyz1234567890/);
});

test("extract-live-env-template can write an explicit local env draft", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "live-env-local-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  fs.writeFileSync(
    path.join(capturesDir, "target.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
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
                      playletName: "弃子逆袭，从烂瓦房到商界大佬",
                      playCount: "1.4亿",
                      tags: "[\"种田\"]"
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
    [path.join(root, "scripts/extract-live-env-template.js"), "--write-local"],
    {
      cwd: tempRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\.env\.local\.dataeye/);

  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-env-template.md"), "utf8");
  const localEnv = fs.readFileSync(path.join(tempRoot, ".env.local.dataeye"), "utf8");

  assert.doesNotMatch(markdown, /abcdefghijklmnopqrstuvwxyz1234567890/);
  assert.match(localEnv, /DATAEYE_AUTHENTICATION=abcdefghijklmnopqrstuvwxyz1234567890/);
  assert.match(localEnv, /DATAEYE_LOGIN_USER_ID=650985/);
  assert.equal(localEnv.includes('DATAEYE_USER_AGENT="MicroMessenger/8.0.74 iPhone"'), true);
});
