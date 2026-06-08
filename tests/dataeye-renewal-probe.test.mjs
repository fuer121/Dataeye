import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { inspectDataEyeRenewalReadiness, renderDataEyeRenewalProbeReport } from "../lib/dataeye-renewal-probe.js";

test("renewal probe marks a fresh Mac WeChat DataEye capture as ready for login refresh", () => {
  const result = inspectDataEyeRenewalReadiness({
    charles: { port: 8888, open: true, cliAvailable: true },
    wechat: { running: true, processCount: 2 },
    targetRequest: {
      id: "fresh.har#0",
      sourceFile: "captures/fresh.har",
      url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-07&rankType=0",
      capturedAt: "2026-06-07T07:30:00.000Z"
    },
    now: new Date("2026-06-07T08:00:00.000Z")
  });

  assert.equal(result.status, "ready");
  assert.equal(result.canRefreshLogin, true);
  assert.match(result.nextAction, /dataeye:refresh-login/);
});

test("renewal probe accepts a fresh week request as the DataEye target", () => {
  const result = inspectDataEyeRenewalReadiness({
    charles: { port: 8888, open: true, cliAvailable: true },
    wechat: { running: true, processCount: 2 },
    targetRequest: {
      id: "fresh-week.har#0",
      sourceFile: "captures/fresh-week.har",
      url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&week=2026-06-01%20~%202026-06-07&rankType=1",
      capturedAt: "2026-06-07T07:30:00.000Z"
    },
    now: new Date("2026-06-07T08:00:00.000Z")
  });

  assert.equal(result.status, "ready");
  assert.equal(result.canRefreshLogin, true);
});

test("renewal probe asks for Mac WeChat capture when no target request exists", () => {
  const result = inspectDataEyeRenewalReadiness({
    charles: { port: 8888, open: true, cliAvailable: true },
    wechat: { running: true, processCount: 3 },
    targetRequest: null,
    now: new Date("2026-06-07T08:00:00.000Z")
  });

  assert.equal(result.status, "monitoring_required");
  assert.equal(result.canRefreshLogin, false);
  assert.match(result.nextAction, /Mac WeChat/);
  assert.match(result.nextAction, /motionComic/);
});

test("renewal probe blocks automation when Charles is unavailable", () => {
  const result = inspectDataEyeRenewalReadiness({
    charles: { port: 8888, open: false, cliAvailable: false },
    wechat: { running: true, processCount: 1 },
    targetRequest: null,
    now: new Date("2026-06-07T08:00:00.000Z")
  });

  assert.equal(result.status, "blocked");
  assert.equal(result.canRefreshLogin, false);
  assert.match(result.nextAction, /Charles/);
});

test("renewal probe report documents that Xcode is not the main automation path", () => {
  const report = renderDataEyeRenewalProbeReport({
    result: inspectDataEyeRenewalReadiness({
      charles: { port: 8888, open: true, cliAvailable: true },
      wechat: { running: true, processCount: 1 },
      targetRequest: null,
      now: new Date("2026-06-07T08:00:00.000Z")
    })
  });

  assert.match(report, /Xcode 不作为主自动化链路/);
  assert.match(report, /不做绕过风控/);
  assert.match(report, /不会自动执行 GUI 点击/);
});

test("renewal probe CLI writes a local report", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "dataeye-renewal-probe-"));

  const result = spawnSync("node", [path.join(root, "scripts/dataeye-renewal-probe.js")], {
    cwd: tempRoot,
    env: { ...process.env, CHARLES_PORT: "1" },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Wrote docs\/dataeye-renewal-probe\.md/);
  const report = fs.readFileSync(path.join(tempRoot, "docs/dataeye-renewal-probe.md"), "utf8");
  assert.match(report, /DataEye 登录态续期探针/);
  assert.match(report, /Charles/);
  assert.match(report, /Mac WeChat/);
});
