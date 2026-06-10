import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("dashboard collection actions stay focused on DataEye while Hongguo is paused", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const liveSource = "dataeye";/);
  assert.match(source, /const captureSource = "dataeye";/);
  assert.match(source, /isDataEyeView/);
  assert.doesNotMatch(source, /source === "hongguo" \? "hongguo" : "dataeye"/);
  assert.doesNotMatch(source, /collect\("sample", "all"\)/);
  assert.match(source, /红果（暂停推进）/);
});

test("unmatched rows link to novel maintenance with a safe return target", () => {
  const dashboard = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const novels = fs.readFileSync(path.join(process.cwd(), "components/NovelsClient.jsx"), "utf8");

  assert.match(dashboard, /new URLSearchParams\(\{ date, source, match: "all", dataKind, rankType, rankPeriod \}\)/);
  assert.match(dashboard, /params\.set\("periodValue", periodValue\)/);
  assert.match(dashboard, /returnTo=\$\{encodeURIComponent\(returnToRankings\)\}/);
  assert.match(novels, /getSafeReturnTo\(searchParams\.get\("returnTo"\)\)/);
  assert.match(novels, /text\.startsWith\("\/\/"\)/);
  assert.match(novels, /返回榜单核对匹配/);
});

test("novel management page supports editing and deleting mappings", () => {
  const novels = fs.readFileSync(path.join(process.cwd(), "components/NovelsClient.jsx"), "utf8");

  assert.match(novels, /method: editingId \? "PATCH" : "POST"/);
  assert.match(novels, /function editMapping\(item\)/);
  assert.match(novels, /function deleteMapping\(item\)/);
  assert.match(novels, /method: "DELETE"/);
  assert.match(novels, /更新映射/);
  assert.match(novels, /删除/);
  assert.match(novels, /取消编辑/);
});

test("novel table action buttons have stable styling", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  assert.match(css, /\.table-actions/);
  assert.match(css, /\.table-action/);
  assert.match(css, /\.table-action\.danger/);
});

test("dashboard does not style failed collection runs as success", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const hasFailedRun = runs\.some\(\(run\) => run\.status === "failed"\);/);
  assert.match(source, /type: response\.ok && !hasFailedRun \? "success" : "warning"/);
});

test("dashboard does not render summary statistic cards", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /aria-label="统计"/);
  assert.doesNotMatch(source, /className="stats-row"/);
  assert.doesNotMatch(source, />当前记录</);
  assert.doesNotMatch(source, />匹配率</);
});

test("dashboard renders named rank types outside the toolbar", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const rankings = fs.readFileSync(path.join(process.cwd(), "lib/dataeye-rankings.js"), "utf8");

  assert.match(source, /className="rank-type-module"/);
  assert.match(source, /DATAEYE_VISIBLE_RANK_TYPE_OPTIONS/);
  assert.match(source, /namedRankTypeOptions/);
  assert.match(source, /namedDataEyeRankTypes/);
  assert.match(rankings, /0: "漫剧热播榜"/);
  assert.match(rankings, /1: "动态漫榜"/);
  assert.match(rankings, /2: "真人AI榜"/);
  assert.match(rankings, /3: "沙雕漫榜"/);
  assert.doesNotMatch(source, /<span>榜单类型<\/span>/);
  assert.doesNotMatch(source, /rankType === "all" \? "全部榜单"/);
  assert.doesNotMatch(source, /Array\.from\(\{ length: 21 \}/);
  assert.doesNotMatch(source, /未命名榜单 rankType=\$\{value\}/);
});

test("dashboard hides unnamed DataEye rank types from the visible table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const visibleItems = useMemo\(\(\) => items\.filter\(shouldDisplayRankingItem\), \[items\]\);/);
  assert.match(source, /item\?\.source !== "dataeye"/);
  assert.match(source, /namedDataEyeRankTypes\.has\(Number\(item\?\.rankType\)\)/);
  assert.match(source, /visibleItems\.map/);
  assert.doesNotMatch(source, /\{items\.map/);
});

test("dashboard hides source reference column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  assert.doesNotMatch(source, />来源标识</);
  assert.doesNotMatch(source, /className="source-ref-cell"/);
  assert.doesNotMatch(css, /\.source-ref-cell/);
});

test("dashboard hides rank type column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /aria-label="榜单类型"/);
  assert.doesNotMatch(source, /<th>榜单类型<\/th>/);
  assert.doesNotMatch(source, /item\.rankTypeName \|\| rankTypeLabels\[item\.rankType\]/);
  assert.match(source, /colSpan="9"/);
});

test("dashboard uses table title area for period switching", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  assert.match(source, /className="period-switch"/);
  assert.match(source, /aria-label="切换榜单周期"/);
  assert.match(source, /rankPeriodOptions\.map/);
  assert.doesNotMatch(source, /全部周期/);
  assert.doesNotMatch(source, /<h2>\{date\} 榜单<\/h2>/);
  assert.doesNotMatch(source, /<label>\s*周期\s*<select value=\{rankPeriod\}/);
  assert.match(css, /\.period-switch/);
});

test("dashboard hides period column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /aria-label="切换榜单周期"/);
  assert.doesNotMatch(source, /<th>周期<\/th>/);
  assert.doesNotMatch(source, /rankPeriodLabels\[item\.rankPeriod\] \|\| item\.rankPeriod/);
  assert.match(source, /colSpan="9"/);
});

test("dashboard hides source column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /<th>来源<\/th>/);
  assert.doesNotMatch(source, /\{sourceLabels\[item\.source\]\}/);
  assert.match(source, /colSpan="9"/);
});

test("dashboard hides date column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /<th>日期<\/th>/);
  assert.doesNotMatch(source, /<td>\{item\.rankingDate\}<\/td>/);
  assert.match(source, /colSpan="9"/);
});

test("dashboard places data kind before collected time", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const novelHeaderIndex = source.indexOf("<th>对应小说名称</th>");
  const dataKindHeaderIndex = source.indexOf("<th>数据性质</th>");
  const collectedHeaderIndex = source.indexOf("<th>采集时间</th>");
  const dataKindCellIndex = source.indexOf('className={`badge data-kind ${item.dataKind}`}');
  const collectedCellIndex = source.indexOf("new Date(item.collectedAt)");

  assert.ok(novelHeaderIndex < dataKindHeaderIndex);
  assert.ok(dataKindHeaderIndex < collectedHeaderIndex);
  assert.ok(dataKindCellIndex < collectedCellIndex);
});

test("dashboard uses local MVP status only for recovery guidance", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const page = fs.readFileSync(path.join(process.cwd(), "app/page.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/status/route.js"), "utf8");

  assert.match(page, /getMvpStatus\(\)/);
  assert.match(source, /initialMvpStatus/);
  assert.match(source, /fetch\("\/api\/status"\)/);
  assert.doesNotMatch(source, /aria-label="MVP 状态"/);
  assert.doesNotMatch(source, /DataEye 类型\/周期/);
  assert.doesNotMatch(source, /红果 live/);
  assert.match(source, /mvpStatus\?\.dataeye\?\.latestCapture/);
  assert.match(source, /mvpStatus\?\.dataeye\?\.latestPreview/);
  assert.match(api, /NextResponse\.json\(getMvpStatus\(\)\)/);
});

test("dashboard shows DataEye preview recovery guidance when auth expires", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /latestPreview\?\.health === "auth_expired"/);
  assert.match(source, /npm run dataeye:refresh-login/);
  assert.match(source, /latestPreview\?\.action/);
  assert.match(source, /重新抓包并刷新 DataEye 登录态/);
});

test("dashboard exposes login refresh when the latest DataEye capture is fresh", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const canRefreshDataEyeLogin = latestCapture\?\.freshness\?\.status === "fresh";/);
  assert.match(source, /hasExpiredDataEyePreview \|\| canRefreshDataEyeLogin/);
  assert.match(source, /已检测到 fresh DataEye 抓包，可以刷新登录态并预检。/);
});

test("dashboard can trigger local DataEye login refresh when auth expires", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/dataeye/refresh-login/route.js"), "utf8");

  assert.match(source, /async function refreshDataEyeLogin\(\)/);
  assert.match(source, /latestCapture\?\.freshness\?\.status !== "fresh"/);
  assert.match(source, /当前 DataEye 抓包不是 fresh/);
  assert.match(source, /fetch\("\/api\/dataeye\/refresh-login"/);
  assert.match(source, /刷新登录态并预检/);
  assert.match(api, /refreshDataEyeLogin/);
  assert.match(api, /allowStaleCapture: false/);
  assert.match(api, /NextResponse\.json/);
  assert.doesNotMatch(api, /DATAEYE_AUTHENTICATION.*process\.env/s);
});

test("dashboard can upload capture files into the local captures folder", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/captures/upload/route.js"), "utf8");

  assert.match(source, /async function uploadCaptureFile\(event\)/);
  assert.match(source, /fetch\("\/api\/captures\/upload"/);
  assert.match(source, /type="file"/);
  assert.match(source, /accept="\.har,\.json,\.txt,\.curl"/);
  assert.match(source, /上传抓包/);
  assert.match(source, /uploadCaptureFile[\s\S]*requestCapturePipeline\(\)/);
  assert.match(source, /payload\.pipeline/);
  assert.match(source, /已生成 DataEye 抓包报告/);
  assert.match(api, /saveCaptureUpload/);
  assert.match(api, /pipeline: result\.pipeline/);
  assert.match(api, /formData\(\)/);
});

test("dashboard can run the DataEye capture pipeline without starting live collection", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/capture/pipeline/route.js"), "utf8");

  assert.match(source, /async function requestCapturePipeline\(\)/);
  assert.match(source, /async function runCapturePipeline\(\)/);
  assert.match(source, /fetch\("\/api\/capture\/pipeline"/);
  assert.match(source, /生成 DataEye 抓包报告/);
  assert.doesNotMatch(source, /async function runCapturePipeline\(\)[\s\S]{0,800}collect\("live"/);
  assert.match(api, /source: "dataeye"/);
  assert.match(api, /loginEnvFile: "\.env\.local\.dataeye"/);
  assert.doesNotMatch(api, /hongguo/);
});

test("dashboard fetches collection runs for the active ranking scope", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const runsQuery = useMemo/);
  assert.match(source, /mode: dataKind === "all" \? "all" : dataKind/);
  assert.match(source, /fetch\(`\/api\/runs\?\$\{runsQuery\}`\)/);
  assert.doesNotMatch(source, /fetch\("\/api\/runs"\)/);
});

test("dashboard syncs active filters into the browser URL", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const pathname = usePathname\(\);/);
  assert.match(source, /const router = useRouter\(\);/);
  assert.match(source, /router\.replace\(`\$\{pathname\}\?\$\{query\}`, \{ scroll: false \}\);/);
});

test("dashboard shows a visible live collection gate before confirmed preview", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /预检通过后可落库/);
  assert.match(source, /已预检，可采集真实榜单/);
  assert.match(source, /canCollectLive \? "已预检，可采集真实榜单" : "预检通过后可落库"/);
  assert.match(source, /const canCollectFullLive = confirmedLivePreviewKey === fullLivePreviewKey;/);
  assert.match(source, /全量预检通过后可一键落库/);
  assert.match(source, /已预检，可一键采集全部榜单与周期/);
});

test("dashboard exposes fixed full-scope DataEye preview and live actions", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const fullDataEyeScope = \{/);
  assert.match(source, /rankType: "all"/);
  assert.match(source, /period: "all"/);
  assert.match(source, /一键全量预检 DataEye/);
  assert.match(source, /一键全量真实采集 DataEye/);
  assert.match(source, /onClick=\{\(\) => previewLiveCollection\(fullDataEyeScope\)\}/);
  assert.match(source, /onClick=\{\(\) => collect\("live", liveSource, fullDataEyeScope\)\}/);
  assert.match(source, /预检当前筛选/);
  assert.match(source, /采集当前筛选/);
});

test("dashboard focuses the live data view after successful live collection", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /if \(mode === "live" && response\.ok && !hasFailedRun\)/);
  assert.match(source, /setSource\(collectSource\);/);
  assert.match(source, /setDataKind\("live"\);/);
  assert.match(source, /setMatch\("all"\);/);
});

test("dashboard surfaces live preview recovery actions", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /formatCollectError\(payload, "真实采集预检失败"\)/);
  assert.match(source, /payload\?\.action/);
  assert.match(source, /下一步：\$\{payload\.action\}/);
});
