import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("dashboard collection actions stay focused on DataEye while Hongguo is paused", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const sourceTabs = \[/);
  assert.match(source, /\["dataeye", "剧查查"\]/);
  assert.match(source, /isDataEyeView/);
  assert.doesNotMatch(source, /source === "hongguo" \? "hongguo" : "dataeye"/);
  assert.doesNotMatch(source, /\["hongguo",/);
  assert.doesNotMatch(source, /collect\("sample", "all"\)/);
  assert.match(source, /红果（暂停推进）/);
});

test("dashboard hides DataEye capture import action while keeping the API available", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/capture/import/route.js"), "utf8");

  assert.doesNotMatch(source, /async function importCaptureRanking\(\)/);
  assert.doesNotMatch(source, /const captureSource = "dataeye";/);
  assert.doesNotMatch(source, /导入\{sourceLabels\[captureSource\]\}抓包榜单/);
  assert.doesNotMatch(source, /fetch\("\/api\/capture\/import"/);
  assert.match(api, /importCaptureRanking/);
  assert.match(api, /NextResponse\.json/);
});

test("dashboard hides DataEye sample collection actions from the page", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /采集 DataEye 模拟榜单/);
  assert.doesNotMatch(source, /collect\("sample", liveSource\)/);
  assert.doesNotMatch(source, /RefreshCw/);
  assert.doesNotMatch(source, /采集当前筛选/);
});

test("dashboard hides DataEye current-filter preview action while keeping the API available", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/collect/preview/route.js"), "utf8");

  assert.doesNotMatch(source, /async function previewLiveCollection/);
  assert.doesNotMatch(source, /fetch\("\/api\/collect\/preview"/);
  assert.doesNotMatch(source, /预检当前筛选/);
  assert.doesNotMatch(source, /onClick=\{previewLiveCollection\}/);
  assert.match(api, /collectRanking/);
  assert.match(api, /collectorErrorPayload/);
  assert.match(api, /NextResponse\.json/);
});

test("dashboard hides page header action entrances from the rankings page", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /className="header-actions"/);
  assert.doesNotMatch(source, /上传抓包/);
  assert.doesNotMatch(source, /生成 DataEye 抓包报告/);
  assert.doesNotMatch(source, /导入模拟小说库/);
  assert.doesNotMatch(source, /async function importNovels\(\)/);
  assert.doesNotMatch(source, /async function uploadCaptureFile\(event\)/);
  assert.doesNotMatch(source, /async function runCapturePipeline\(\)/);
});

test("dashboard uses segmented controls for match status filtering", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /className="segmented-control"/);
  assert.match(source, /role="radiogroup" aria-label="匹配状态"/);
  assert.match(source, /role="radio"/);
  assert.match(source, /onClick=\{\(\) => setMatch\(value\)\}/);
  assert.doesNotMatch(source, /<select value=\{match\}/);
});

test("dashboard hides data kind filter and table column while keeping query support", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /<select value=\{dataKind\}/);
  assert.doesNotMatch(source, /onChange=\{\(event\) => setDataKind\(event\.target\.value\)\}/);
  assert.doesNotMatch(source, /<th>数据性质<\/th>/);
  assert.doesNotMatch(source, /className=\{`badge data-kind \$\{item\.dataKind\}`\}/);
  assert.match(source, /const \[dataKind, setDataKind\] = useState\(initialDataKind\);/);
  assert.match(source, /const params = new URLSearchParams\(\{ source, match, dataKind, rankType, rankPeriod, watchStatus, listingStatus \}\);/);
});

test("novel maintenance page keeps a safe return target", () => {
  const dashboard = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const novels = fs.readFileSync(path.join(process.cwd(), "components/NovelsClient.jsx"), "utf8");

  assert.doesNotMatch(dashboard, /returnToRankings/);
  assert.doesNotMatch(dashboard, /去维护映射/);
  assert.match(novels, /getSafeReturnTo\(searchParams\.get\("returnTo"\)\)/);
  assert.match(novels, /text\.startsWith\("\/\/"\)/);
  assert.match(novels, /返回榜单核对匹配/);
});

test("novel management page maintains mappings from the single library page", () => {
  const novels = fs.readFileSync(path.join(process.cwd(), "components/NovelsClient.jsx"), "utf8");

  assert.match(novels, /async function saveManualMapping\(event\)/);
  assert.match(novels, /aria-label="维护小说映射"/);
  assert.match(novels, /保存映射/);
  assert.match(novels, /返回榜单核对匹配/);
});

test("novel management page is a single book library view with local file import", () => {
  const novels = fs.readFileSync(path.join(process.cwd(), "components/NovelsClient.jsx"), "utf8");

  assert.doesNotMatch(novels, /tab=library/);
  assert.doesNotMatch(novels, /tab=mappings/);
  assert.match(novels, /小说库/);
  assert.doesNotMatch(novels, /短剧和小说映射关系/);
  assert.match(novels, /导入 Excel\/CSV/);
  assert.match(novels, /导入映射 Excel/);
  assert.match(novels, /fetch\("\/api\/novels\/import\/mappings"/);
  assert.match(novels, /accept="\.xlsx,\.xls,\.csv,\.json/);
  assert.match(novels, />平台ID</);
  assert.match(novels, />书库ID</);
  assert.match(novels, />小说名称</);
  assert.match(novels, />短剧\/漫剧名</);
  assert.match(novels, />映射匹配</);
  assert.doesNotMatch(novels, />作者</);
  assert.doesNotMatch(novels, />分类</);
  assert.doesNotMatch(novels, />阅读偏好</);
  assert.doesNotMatch(novels, />操作</);
  assert.ok(novels.indexOf(">小说名称</") < novels.indexOf(">短剧/漫剧名</"));
  assert.ok(novels.indexOf(">短剧/漫剧名</") < novels.indexOf(">映射匹配</"));
  assert.match(novels, /novel\.mappingMatched \? "是" : "否"/);
  assert.match(novels, /name="match"/);
  assert.match(novels, /className="segmented-control"/);
  assert.match(novels, /\["matched", "是"\]/);
  assert.match(novels, /\["unmatched", "否"\]/);
  assert.match(novels, /role="radio"/);
  assert.match(novels, /placeholder="输入小说名称或短剧名称"/);
  assert.doesNotMatch(novels, /关系类型/);
  assert.doesNotMatch(novels, /manualRelationType/);
  assert.match(novels, /searchParams\.get\("dramaTitle"\)/);
  assert.match(novels, /searchParams\.get\("returnTo"\)/);
});

test("novel mapping form appears before the search toolbar", () => {
  const novels = fs.readFileSync(path.join(process.cwd(), "components/NovelsClient.jsx"), "utf8");

  assert.ok(novels.indexOf('aria-label="维护小说映射"') < novels.indexOf('aria-label="小说库搜索"'));
});

test("novel table action buttons have stable styling", () => {
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  assert.match(css, /\.table-actions/);
  assert.match(css, /\.table-action/);
  assert.match(css, /\.table-action\.danger/);
});

test("dashboard renders collection run status from the stored run result", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const runStatusLabels = \{/);
  assert.match(source, /failed: "失败"/);
  assert.match(source, /<span className=\{`dot \$\{run\.status\}`\} \/>/);
  assert.match(source, /<span className=\{`badge run-status \$\{run\.status\}`\}>\{runStatusLabels\[run\.status\] \|\| run\.status\}<\/span>/);
  assert.doesNotMatch(source, /hasFailedRun/);
  assert.doesNotMatch(source, /type: response\.ok && !hasFailedRun \? "success" : "warning"/);
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
  assert.match(rankings, /name: "红果漫剧榜"/);
  assert.match(rankings, /name: "热力榜"/);
  assert.match(rankings, /name: "抖音热播"/);
  assert.match(rankings, /name: "红果榜"/);
  assert.doesNotMatch(source, /<span>榜单类型<\/span>/);
  assert.doesNotMatch(source, /rankType === "all" \? "全部榜单"/);
  assert.doesNotMatch(source, /Array\.from\(\{ length: 21 \}/);
  assert.doesNotMatch(source, /未命名榜单 rankType=\$\{value\}/);
});

test("dashboard accepts current DataEye rank type query params", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/page.jsx"), "utf8");
  const rankings = fs.readFileSync(path.join(process.cwd(), "lib/dataeye-rankings.js"), "utf8");

  assert.match(page, /DATAEYE_ACTIVE_RANK_TYPES/);
  assert.match(page, /DATAEYE_ACTIVE_RANK_TYPES\.map\(\(rankType\) => String\(rankType\)\)/);
  assert.match(rankings, /rankType: 119/);
  assert.match(rankings, /rankType: 101/);
  assert.match(rankings, /rankType: 103/);
  assert.match(rankings, /rankType: 106/);
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
  assert.match(source, /colSpan="10"/);
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

test("dashboard hides period switching for single-period DataEye rank types", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const rankings = fs.readFileSync(path.join(process.cwd(), "lib/dataeye-rankings.js"), "utf8");

  assert.match(rankings, /rankType: 119[\s\S]*name: "红果漫剧榜"[\s\S]*periods: \["day"\]/);
  assert.match(source, /DATAEYE_RANKING_DEFINITIONS/);
  assert.match(source, /singlePeriodDataEyeRankPeriods/);
  assert.match(source, /const shouldShowPeriodSwitch = !isDataEyeView \|\| !singlePeriodDataEyeRankPeriods\.has\(String\(rankType\)\);/);
  assert.match(source, /const singlePeriod = singlePeriodDataEyeRankPeriods\.get\(String\(rankType\)\);/);
  assert.match(source, /setRankPeriod\(singlePeriod\);/);
  assert.match(source, /\{shouldShowPeriodSwitch \? \(/);
});

test("dashboard hides period column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /aria-label="切换榜单周期"/);
  assert.doesNotMatch(source, /<th>周期<\/th>/);
  assert.doesNotMatch(source, /rankPeriodLabels\[item\.rankPeriod\] \|\| item\.rankPeriod/);
  assert.match(source, /colSpan="10"/);
});

test("dashboard hides source column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /<th>来源<\/th>/);
  assert.doesNotMatch(source, /\{sourceLabels\[item\.source\]\}/);
  assert.match(source, /colSpan="10"/);
});

test("dashboard hides date column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /<th>日期<\/th>/);
  assert.doesNotMatch(source, /<td>\{item\.rankingDate\}<\/td>/);
  assert.match(source, /colSpan="10"/);
});

test("dashboard hides drama type column from the table", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /<th>类型<\/th>/);
  assert.doesNotMatch(source, /<td>\{item\.dramaType\}<\/td>/);
  assert.match(source, /colSpan="10"/);
});

test("dashboard shows matched novel name before platform id", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const matchHeaderIndex = source.indexOf("<th>是否匹配小说</th>");
  const novelHeaderIndex = source.indexOf("<th>匹配小说名称</th>");
  const platformHeaderIndex = source.indexOf("<th>平台 id</th>");
  const listingHeaderIndex = source.indexOf("<th>上榜情况/排名变化</th>");
  const watchHeaderIndex = source.indexOf("<th>监控状态</th>");
  const collectedHeaderIndex = source.indexOf("<th>采集时间</th>");
  const matchCellIndex = source.indexOf('className={`badge ${item.matchStatus}`}');
  const novelCellIndex = source.indexOf("item.matchedNovelNames");
  const platformCellIndex = source.indexOf("item.matchedNovelPlatformIds");
  const listingCellIndex = source.indexOf("formatListingSummary(item)");
  const watchCellIndex = source.indexOf('className="watch-status-select"');
  const collectedCellIndex = source.indexOf("new Date(item.collectedAt)");

  assert.doesNotMatch(source, /<th>对应小说名称<\/th>/);
  assert.ok(matchHeaderIndex < platformHeaderIndex);
  assert.ok(matchHeaderIndex < novelHeaderIndex);
  assert.ok(novelHeaderIndex < platformHeaderIndex);
  assert.ok(platformHeaderIndex < listingHeaderIndex);
  assert.ok(listingHeaderIndex < watchHeaderIndex);
  assert.ok(watchHeaderIndex < collectedHeaderIndex);
  assert.ok(matchCellIndex < platformCellIndex);
  assert.ok(matchCellIndex < novelCellIndex);
  assert.ok(novelCellIndex < platformCellIndex);
  assert.ok(platformCellIndex < listingCellIndex);
  assert.ok(listingCellIndex < watchCellIndex);
  assert.ok(watchCellIndex < collectedCellIndex);
  assert.match(source, /item\.matchStatus === "matched" && item\.matchedNovelNames !== "未匹配"/);
});

test("dashboard adds monitoring status and listing signal controls", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const rankingsApi = fs.readFileSync(path.join(process.cwd(), "app/api/rankings/route.js"), "utf8");
  const watchApi = fs.readFileSync(path.join(process.cwd(), "app/api/watch-states/route.js"), "utf8");
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  assert.match(source, /const watchStatusLabels = \{/);
  assert.match(source, /pending: "待关注"/);
  assert.match(source, /const listingStatusLabels = \{/);
  assert.match(source, /rank_up: "排名上升"/);
  assert.match(source, /aria-label="榜单监控摘要"/);
  assert.doesNotMatch(source, />当前榜期总数</);
  assert.doesNotMatch(source, /monitorSummary\.total/);
  assert.match(source, />已匹配</);
  assert.match(source, />待关注</);
  assert.match(source, />新上榜</);
  assert.match(source, /setWatchStatus\(event\.target\.value\)/);
  assert.match(source, /setListingStatus\(event\.target\.value\)/);
  assert.match(source, /fetch\("\/api\/watch-states"/);
  assert.match(source, /formatListingSummary\(item\)/);
  assert.match(source, /className="rank-change rank-change-up"/);
  assert.match(source, /className="rank-change rank-change-down"/);
  assert.match(source, /className="rank-change rank-change-flat"/);
  assert.match(source, /连续 \$\{item\.consecutiveListedDays\} 天上榜/);
  assert.match(source, /累计 \$\{item\.totalListedDays\} 天上榜/);
  assert.match(source, /item\.previousRank !== null && item\.previousRank !== undefined/);
  assert.match(source, /排名↑\{rankChange\}/);
  assert.match(source, /排名↓\{Math\.abs\(rankChange\)\}/);
  assert.match(source, />排名持平</);
  assert.match(source, /watch-status-select/);
  assert.match(rankingsApi, /watchStatus: searchParams\.get\("watchStatus"\) \|\| "all"/);
  assert.match(rankingsApi, /listingStatus: searchParams\.get\("listingStatus"\) \|\| "all"/);
  assert.match(watchApi, /export async function PATCH/);
  assert.match(watchApi, /upsertWatchState/);
  assert.match(css, /\.monitor-summary/);
  assert.match(css, /\.rank-change-up/);
  assert.match(css, /\.rank-change-down/);
  assert.match(css, /\.rank-change-flat/);
  assert.match(css, /\.watch-status-select/);
});

test("dashboard ranking table adapts to the panel width", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  assert.match(source, /<table className="rankings-table">/);
  assert.match(css, /\.main \{\s*min-width: 0;\s*width: 100%;/s);
  assert.doesNotMatch(css, /width: min\(1280px, 100%\);/);
  assert.match(css, /\.rankings-table \{\s*min-width: 0;\s*table-layout: fixed;/s);
  assert.match(css, /\.rankings-table th,\s*\.rankings-table td \{/);
  assert.match(css, /overflow-wrap: anywhere;/);
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

test("capture upload API stays available while the dashboard hides the header upload action", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/captures/upload/route.js"), "utf8");

  assert.doesNotMatch(source, /async function uploadCaptureFile\(event\)/);
  assert.doesNotMatch(source, /fetch\("\/api\/captures\/upload"/);
  assert.doesNotMatch(source, /type="file"/);
  assert.doesNotMatch(source, /accept="\.har,\.json,\.txt,\.curl"/);
  assert.doesNotMatch(source, /上传抓包/);
  assert.match(api, /saveCaptureUpload/);
  assert.match(api, /pipeline: result\.pipeline/);
  assert.match(api, /formData\(\)/);
});

test("capture pipeline API stays available while the dashboard hides the header report action", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/capture/pipeline/route.js"), "utf8");

  assert.doesNotMatch(source, /async function requestCapturePipeline\(\)/);
  assert.doesNotMatch(source, /async function runCapturePipeline\(\)/);
  assert.doesNotMatch(source, /fetch\("\/api\/capture\/pipeline"/);
  assert.doesNotMatch(source, /生成 DataEye 抓包报告/);
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

test("native dashboard uses period value as the primary list filter", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const page = fs.readFileSync(path.join(process.cwd(), "app/page.jsx"), "utf8");

  assert.match(source, /const filterPeriodValue = isNativeView \? periodValue \|\| date : periodValue;/);
  assert.match(source, /if \(isNativeView\) \{/);
  assert.match(source, /params\.set\("periodValue", filterPeriodValue\);/);
  assert.match(source, /\{isNativeView \? "榜期" : "日期"\}/);
  assert.match(source, /onChange=\{\(event\) => updatePrimaryDateFilter\(event\.target\.value\)\}/);
  assert.match(page, /getLatestPeriodValue/);
  assert.match(page, /initialSource === "native"/);
}
);

test("dashboard hides the DataEye period value text filter from the toolbar", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /placeholder="全部榜期"/);
  assert.doesNotMatch(source, /onChange=\{\(event\) => setPeriodValue\(event\.target\.value\)\}/);
  assert.match(source, /\{isNativeView \? "榜期" : "日期"\}/);
  assert.match(source, /params\.set\("periodValue", filterPeriodValue\);/);
  assert.match(source, /<th>榜期<\/th>/);
});

test("dashboard syncs active filters into the browser URL", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.match(source, /const pathname = usePathname\(\);/);
  assert.match(source, /const router = useRouter\(\);/);
  assert.match(source, /router\.replace\(`\$\{pathname\}\?\$\{query\}`, \{ scroll: false \}\);/);
});

test("dashboard switches source tabs to the latest available ranking scope", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/rankings/latest/route.js"), "utf8");

  assert.match(source, /async function loadLatestRankingScope/);
  assert.match(source, /fetch\(`\/api\/rankings\/latest\?\$\{params\}`\)/);
  assert.match(source, /latestScope = await loadLatestRankingScope\(nextSource/);
  assert.match(source, /setDate\(latestScope\.date\)/);
  assert.match(source, /setPeriodValue\(latestScope\.periodValue \|\| latestScope\.date\)/);
  assert.match(api, /getLatestRankingDate/);
  assert.match(api, /getLatestPeriodValue/);
});

test("dashboard defaults to the full monitoring table on first entry", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/page.jsx"), "utf8");

  assert.match(page, /const initialMatch = getAllowed\(params\.match, MATCH_STATUSES, "all"\);/);
  assert.match(page, /const initialWatchStatus = getAllowed\(params\.watchStatus, WATCH_STATUSES, "all"\);/);
  assert.match(page, /const initialListingStatus = getAllowed\(params\.listingStatus, LISTING_STATUSES, "all"\);/);
  assert.match(page, /watchStatus: initialWatchStatus/);
  assert.match(page, /listingStatus: initialListingStatus/);
  assert.doesNotMatch(page, /getDefaultMatchStatus/);
  assert.doesNotMatch(page, /match: "matched"/);
});

test("dashboard hides DataEye current-filter live action while keeping the API available", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");
  const css = fs.readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/collect/route.js"), "utf8");

  assert.doesNotMatch(source, /采集当前筛选/);
  assert.doesNotMatch(source, /fetch\("\/api\/collect"/);
  assert.doesNotMatch(source, /live-gate-status/);
  assert.doesNotMatch(css, /\.live-gate-status/);
  assert.doesNotMatch(source, /canCollectLive/);
  assert.doesNotMatch(source, /预检通过后可落库/);
  assert.match(api, /runCollection/);
  assert.match(api, /confirmedPreview/);
  assert.doesNotMatch(source, /const canCollectFullLive = confirmedLivePreviewKey === fullLivePreviewKey;/);
  assert.doesNotMatch(source, /全量预检通过后可一键落库/);
  assert.doesNotMatch(source, /已预检，可一键采集全部榜单与周期/);
});

test("dashboard hides fixed full-scope DataEye preview and live actions", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/DashboardClient.jsx"), "utf8");

  assert.doesNotMatch(source, /const fullDataEyeScope = \{/);
  assert.doesNotMatch(source, /collection-action-panel/);
  assert.doesNotMatch(source, /aria-label="DataEye 全量采集"/);
  assert.doesNotMatch(source, /一键全量预检 DataEye/);
  assert.doesNotMatch(source, /一键全量真实采集 DataEye/);
  assert.doesNotMatch(source, /previewLiveCollection\(fullDataEyeScope\)/);
  assert.doesNotMatch(source, /collect\("live", liveSource, fullDataEyeScope\)/);
  assert.doesNotMatch(source, /采集当前筛选/);
});

test("dashboard surfaces live preview recovery actions", () => {
  const api = fs.readFileSync(path.join(process.cwd(), "app/api/collect/preview/route.js"), "utf8");

  assert.match(api, /collectorErrorPayload\(error\)/);
  assert.match(api, /status: 502/);
});
