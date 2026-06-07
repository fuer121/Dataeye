import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { applyLocalEnvForSource } from "../lib/runtime-env.js";

const ENV_KEYS = ["DATAEYE_AUTHENTICATION", "DATAEYE_LOGIN_USER_ID", "DATAEYE_S"];

test("applyLocalEnvForSource reads .env.local and source-specific env without overriding process env", () => {
  const originalCwd = process.cwd();
  const previous = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    delete process.env[key];
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-env-"));
  fs.writeFileSync(path.join(tempRoot, ".env.local"), "DATAEYE_AUTHENTICATION=base-auth\nDATAEYE_S=base-s\n");
  fs.writeFileSync(path.join(tempRoot, ".env.local.dataeye"), "DATAEYE_LOGIN_USER_ID=650985\nDATAEYE_S=dataeye-s\n");

  try {
    process.chdir(tempRoot);
    process.env.DATAEYE_AUTHENTICATION = "runtime-auth";
    applyLocalEnvForSource("dataeye");

    assert.equal(process.env.DATAEYE_AUTHENTICATION, "runtime-auth");
    assert.equal(process.env.DATAEYE_LOGIN_USER_ID, "650985");
    assert.equal(process.env.DATAEYE_S, "dataeye-s");
  } finally {
    process.chdir(originalCwd);
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
