import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const ENV_KEYS = [
  "DATAEYE_AUTHENTICATION",
  "DATAEYE_LOGIN_USER_ID",
  "DATAEYE_S",
  "DATAEYE_REFERER",
  "DATAEYE_USER_AGENT",
  "DATAEYE_COOKIE",
  "DATAEYE_AUTHORIZATION",
  "DATAEYE_TOKEN",
  "SQLITE_PATH"
];

test("live collection preview reports missing login state without writing sqlite", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "live-preview-"));
  const env = { ...process.env };
  for (const key of ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/live-collection-preview.js"), "--date", "2026-06-05"],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /live-collection-preview\.md/);

  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-preview.md"), "utf8");
  assert.match(markdown, /登录态文件：默认 \.env\.local \/ 当前进程环境/);
  assert.match(markdown, /未写入 SQLite/);
  assert.match(markdown, /DATAEYE_AUTHENTICATION/);
  assert.match(markdown, /DATAEYE_LOGIN_USER_ID/);
  assert.equal(fs.existsSync(path.join(tempRoot, "data/ju-chacha.sqlite")), false);
});

test("live collection preview can read an explicit env file", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "live-preview-env-file-"));
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  const env = { ...process.env };
  for (const key of ENV_KEYS) delete env[key];

  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=auth-file-value\n");

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/live-collection-preview.js"),
      "--date",
      "2026-06-05",
      "--login-env-file",
      envPath
    ],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-preview.md"), "utf8");
  assert.match(markdown, /登录态文件：.*\.env\.local\.dataeye.*存在/);
  assert.match(markdown, /DATAEYE_AUTHENTICATION \| auth\.\.\.alue/);
  assert.match(markdown, /DATAEYE_LOGIN_USER_ID \| 未提供/);
  assert.match(markdown, /collect:preview -- --date 2026-06-05 --source dataeye --login-env-file .*\.env\.local\.dataeye/);
  assert.equal(fs.existsSync(path.join(tempRoot, "data/ju-chacha.sqlite")), false);
});

test("live collection preview reports a missing explicit env file", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "live-preview-missing-env-file-"));
  const missingPath = path.join(tempRoot, ".env.local.dataeye");
  const env = { ...process.env };
  for (const key of ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/live-collection-preview.js"),
      "--date",
      "2026-06-05",
      "--login-env-file",
      missingPath
    ],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-preview.md"), "utf8");
  assert.match(markdown, /登录态文件：.*\.env\.local\.dataeye.*不存在/);
  assert.match(markdown, /DATAEYE_AUTHENTICATION \| 未提供/);
});

test("live collection preview accepts DataEye rank type and period arguments", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "scripts/live-collection-preview.js"), "utf8");

  assert.match(source, /--rank-type/);
  assert.match(source, /--period/);
  assert.match(source, /rankType/);
  assert.match(source, /period/);
});

test("live collection preview reports paused Hongguo without DataEye login instructions", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "live-preview-hongguo-paused-"));
  const env = { ...process.env };
  for (const key of ENV_KEYS) delete env[key];

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/live-collection-preview.js"), "--date", "2026-06-05", "--source", "hongguo"],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/live-collection-preview.md"), "utf8");
  assert.match(markdown, /当前 dry-run 只支持 source=dataeye/);
  assert.match(markdown, /capture:pipeline -- --source hongguo/);
  assert.doesNotMatch(markdown, /DATAEYE_AUTHENTICATION/);
});
