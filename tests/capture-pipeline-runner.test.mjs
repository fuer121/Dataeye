import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { runCapturePipeline, toSafeCapturePipelinePayload } from "../lib/capture-pipeline-runner.js";

test("runCapturePipeline runs DataEye-only capture reports without requiring live collection", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-pipeline-api-"));
  fs.mkdirSync(path.join(tempRoot, "captures"), { recursive: true });

  const result = runCapturePipeline({
    rootDir: tempRoot,
    source: "dataeye",
    loginEnvFile: ".env.local.dataeye"
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.source, "dataeye");
  assert.equal(result.loginEnvFile, ".env.local.dataeye");
  assert.match(result.stdout, /Wrote docs\/capture-pipeline\.md/);
  assert.equal(fs.existsSync(path.join(tempRoot, "docs/capture-pipeline.md")), true);
  assert.equal(fs.existsSync(path.join(tempRoot, "docs/request-analysis.md")), true);
  assert.doesNotMatch(result.stdout, /collect:live/);
});

test("toSafeCapturePipelinePayload does not expose raw terminal output", () => {
  const payload = toSafeCapturePipelinePayload({
    status: 0,
    source: "dataeye",
    loginEnvFile: ".env.local.dataeye",
    stdout: "secret-authentication-value",
    stderr: "secret-token-value",
    durationMs: 12
  });

  assert.deepEqual(payload, {
    ok: true,
    status: 0,
    source: "dataeye",
    loginEnvFile: ".env.local.dataeye",
    reportPath: "docs/capture-pipeline.md",
    message: "DataEye 抓包流水线已完成，请查看 docs/capture-pipeline.md。",
    durationMs: 12
  });
});
