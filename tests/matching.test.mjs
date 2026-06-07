import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTitle } from "../lib/matching.js";

test("normalizeTitle removes spacing and common punctuation", () => {
  assert.equal(normalizeTitle("《玄门 小祖宗！》"), "玄门小祖宗");
});

test("normalizeTitle returns empty string for missing values", () => {
  assert.equal(normalizeTitle(null), "");
});
