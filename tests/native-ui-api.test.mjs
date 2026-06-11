import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("dashboard exposes source tabs for native and DataEye views", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const sourceTabs = source.match(/const sourceTabs = \[[\s\S]*?\];/)?.[0] || "";

  assert.match(source, /source-tabs/);
  assert.match(source, /站内原生短剧/);
  assert.match(sourceTabs, /\["dataeye", "剧查查"\]/);
  assert.doesNotMatch(sourceTabs, /DataEye \/ 剧查查/);
  assert.match(source, /dataeye: "剧查查"/);
  assert.match(source, /source === "native"/);
  assert.match(source, /source === "dataeye"/);
});

test("dashboard defaults to the native source tab", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/page.jsx"), "utf8");
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(page, /getAllowed\(params\.source, SOURCES, "native"\)/);
  assert.match(source, /initialSource = "native"/);
  assert.match(source, /initialSource === "dataeye" \? "dataeye" : "native"/);
});

test("native dashboard tab imports Excel without showing DataEye-only controls", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /async function importNativeRankings/);
  assert.match(source, /fetch\("\/api\/native\/import"/);
  assert.match(source, /导入站内原生短剧 Excel/);
  assert.match(source, /isDataEyeView/);
  assert.match(source, /isNativeView/);
  assert.match(source, /isDataEyeView &&/);
  assert.match(source, /原生短剧/);
  assert.match(source, /<th>\{isNativeView \? "消耗" : "热度值"\}<\/th>/);
  assert.match(source, /formatHeatValue\(item\.heatValue, isNativeView\)/);
  assert.match(source, /Math\.round\(number\)/);
});

test("native import route and source filters are wired", () => {
  const route = fs.readFileSync(path.join(process.cwd(), "app/api/native/import/route.js"), "utf8");
  const rankings = fs.readFileSync(path.join(process.cwd(), "lib/rankings.js"), "utf8");
  const page = fs.readFileSync(path.join(process.cwd(), "app/page.jsx"), "utf8");
  const runs = fs.readFileSync(path.join(process.cwd(), "app/api/runs/route.js"), "utf8");

  assert.match(route, /importNativeRankings/);
  assert.match(route, /NextResponse\.json/);
  assert.match(rankings, /"native"/);
  assert.match(page, /"native"/);
  assert.match(runs, /normalizeRunFilters/);
});
