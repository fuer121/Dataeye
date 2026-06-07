import assert from "node:assert/strict";
import test from "node:test";

import { assertCollectedEntries, normalizeCollectRequest } from "../lib/collectors/index.js";

test("normalizeCollectRequest rejects unknown sources before collection runs", () => {
  assert.throws(
    () => normalizeCollectRequest({ date: "2026-06-05", source: "bad", mode: "sample" }),
    /不支持的榜单来源/
  );
});

test("normalizeCollectRequest rejects unsupported modes", () => {
  assert.throws(
    () => normalizeCollectRequest({ date: "2026-06-05", source: "dataeye", mode: "dry-run" }),
    /不支持的采集模式/
  );
});

test("normalizeCollectRequest requires explicit source for live mode", () => {
  assert.throws(
    () => normalizeCollectRequest({ date: "2026-06-05", source: "all", mode: "live" }),
    /真实采集需要明确指定 source=dataeye/
  );
});

test("normalizeCollectRequest rejects paused Hongguo live collection", () => {
  assert.throws(
    () => normalizeCollectRequest({ date: "2026-06-05", source: "hongguo", mode: "live" }),
    /红果真实采集已暂停推进/
  );
});

test("normalizeCollectRequest expands sample all sources", () => {
  const request = normalizeCollectRequest({ date: "2026-06-05", source: "all", mode: "sample" });

  assert.equal(request.rankingDate, "2026-06-05");
  assert.equal(request.mode, "sample");
  assert.deepEqual(request.sources, ["dataeye", "hongguo"]);
});

test("normalizeCollectRequest keeps DataEye rank type and period selections", () => {
  const request = normalizeCollectRequest({
    date: "2026-06-06",
    source: "dataeye",
    mode: "live",
    rankType: "all",
    period: "all"
  });

  assert.equal(request.rankingDate, "2026-06-06");
  assert.equal(request.rankType, "all");
  assert.equal(request.period, "all");
});

test("assertCollectedEntries rejects empty live results", () => {
  assert.throws(
    () => assertCollectedEntries({ entries: [], mode: "live", source: "dataeye" }),
    /未返回任何榜单/
  );
});

test("assertCollectedEntries allows empty sample results", () => {
  assert.doesNotThrow(() => assertCollectedEntries({ entries: [], mode: "sample", source: "dataeye" }));
});
