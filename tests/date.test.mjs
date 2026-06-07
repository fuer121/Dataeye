import assert from "node:assert/strict";
import test from "node:test";

import { isValidDateString } from "../lib/date.js";

test("isValidDateString accepts real YYYY-MM-DD dates", () => {
  assert.equal(isValidDateString("2026-06-05"), true);
});

test("isValidDateString rejects malformed and impossible dates", () => {
  assert.equal(isValidDateString("20260605"), false);
  assert.equal(isValidDateString("2026-6-5"), false);
  assert.equal(isValidDateString("2026-02-30"), false);
  assert.equal(isValidDateString("not-a-date"), false);
});
