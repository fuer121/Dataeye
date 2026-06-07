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
  "DATAEYE_TOKEN"
];

test("capture-preflight reads DataEye login state from runtime env", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-preflight-"));
  const env = { ...process.env };
  for (const key of ENV_KEYS) delete env[key];
  env.DATAEYE_AUTHENTICATION = "auth-runtime-value";
  env.DATAEYE_LOGIN_USER_ID = "650985";
  env.DATAEYE_S = "signature-runtime-value";

  const result = spawnSync("node", [path.join(root, "scripts/capture-preflight.js")], {
    cwd: tempRoot,
    env,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/capture-preflight.md"), "utf8");
  assert.match(markdown, /DATAEYE_AUTHENTICATION \| auth\.\.\.alue/);
  assert.match(markdown, /DATAEYE_LOGIN_USER_ID \| \<set\>/);
  assert.match(markdown, /DATAEYE_S \| sign\.\.\.alue/);
});

test("capture-preflight reads an explicit login env file", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-preflight-env-file-"));
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  const env = { ...process.env };
  for (const key of ENV_KEYS) delete env[key];

  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=auth-file-value\nDATAEYE_LOGIN_USER_ID=650985\n");

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/capture-preflight.js"), "--login-env-file", envPath],
    {
      cwd: tempRoot,
      env,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/capture-preflight.md"), "utf8");
  assert.match(markdown, /登录态文件：.*\.env\.local\.dataeye.*存在/);
  assert.match(markdown, /DATAEYE_AUTHENTICATION \| auth\.\.\.alue/);
  assert.match(markdown, /DATAEYE_LOGIN_USER_ID \| \<set\>/);
});
