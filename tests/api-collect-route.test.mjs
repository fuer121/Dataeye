import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("live collect route validates source before reading source-specific env files", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/collect/route.js"), "utf8");
  const normalizeIndex = source.indexOf("normalizeCollectRequest(body)");
  const applyEnvIndex = source.indexOf("applyLocalEnvForSource(collectRequest.sources[0])");

  assert.notEqual(normalizeIndex, -1);
  assert.notEqual(applyEnvIndex, -1);
  assert.ok(normalizeIndex < applyEnvIndex);
  assert.doesNotMatch(source, /applyLocalEnvForSource\(body\.source\)/);
});

test("live preview route returns structured collector recovery hints", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/collect/preview/route.js"), "utf8");

  assert.match(source, /collectorErrorPayload\(error\)/);
  assert.doesNotMatch(source, /NextResponse\.json\(\{ error: error\.message \}, \{ status: 502 \}\)/);
});
