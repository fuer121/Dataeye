import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test(".env.example documents required DataEye and Feishu configuration", () => {
  const envExample = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8");

  for (const key of [
    "DATAEYE_AUTHENTICATION",
    "DATAEYE_LOGIN_USER_ID",
    "DATAEYE_S",
    "DATAEYE_REFERER",
    "DATAEYE_USER_AGENT",
    "DATAEYE_DAILY_DATE_OFFSET_DAYS",
    "FEISHU_APP_ID",
    "FEISHU_APP_SECRET",
    "FEISHU_TENANT_ACCESS_TOKEN",
    "FEISHU_SPREADSHEET_TOKEN",
    "FEISHU_SHEET_ID",
    "FEISHU_RANGE"
  ]) {
    assert.match(envExample, new RegExp(`^${key}=`, "m"), `${key} missing from .env.example`);
  }
});

test("README keeps fenced code blocks balanced and mentions verified DataEye live date", () => {
  const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
  const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));
  const fences = readme.match(/^```/gm) || [];

  assert.equal(fences.length % 2, 0, "README fenced code blocks should be balanced");
  assert.match(readme, /2026-06-06.*source=dataeye.*dataKind=live/s);
  assert.match(readme, /2026-06-06.*DATAEYE_AUTH_EXPIRED/s);
  assert.match(readme, /npm run dataeye:refresh-login/);
  assert.match(readme, /npm run dataeye:daily/);
  assert.match(readme, /npm run dataeye:renewal-probe/);
  assert.match(readme, /docs\/dataeye-daily-run\.md/);
  assert.match(readme, /docs\/dataeye-renewal-probe\.md/);
  assert.match(readme, /launchd/);
  assert.match(readme, /Xcode 不作为主自动化链路/);
  assert.match(readme, /预检失败时.*不要执行.*collect:live/s);
  assert.match(readme, /npm run mvp:status/);
  assert.match(readme, /\/api\/status/);
  assert.match(readme, /本地 MVP 状态卡/);
  assert.match(readme, /最新抓包材料/);
  assert.match(readme, /上传抓包/);
  assert.match(readme, /上传成功后会自动生成 DataEye 抓包报告/);
  assert.match(readme, /上传 API 也会返回 pipeline 摘要/);
  assert.match(readme, /生成 DataEye 抓包报告/);
  assert.match(readme, /只生成抓包分析、验证、预览和接口规格报告/);
  assert.match(readme, /\.har.*\.json.*\.txt.*\.curl/s);
  assert.match(readme, /最新 DataEye 抓包为 fresh 时/);
  assert.match(readme, /刷新登录态并预检.*不会自动落库/s);
  assert.match(readme, /默认只接受 fresh 抓包材料/);
  assert.match(readme, /--allow-stale-capture/);
  assert.match(readme, /不会把完整登录态值展示到页面或 API 响应中/);
  assert.match(readme, /手动新增、编辑、删除单条映射/);
  assert.match(readme, /DATAEYE_AUTHENTICATION/);
  assert.match(readme, /FEISHU_SPREADSHEET_TOKEN/);
  assert.equal(packageJson.scripts["dataeye:refresh-login"], "node scripts/refresh-dataeye-login.js");
  assert.equal(packageJson.scripts["dataeye:daily"], "node scripts/dataeye-daily.js");
  assert.equal(packageJson.scripts["dataeye:renewal-probe"], "node scripts/dataeye-renewal-probe.js");
  assert.equal(packageJson.scripts["mvp:status"], "node scripts/check-mvp-status.js");
});

test("real source analysis matches the current verified DataEye live state", () => {
  const analysis = fs.readFileSync(path.join(process.cwd(), "docs/real-source-analysis.md"), "utf8");

  assert.match(analysis, /2026-06-06.*DataEye.*live.*已通过/s);
  assert.match(analysis, /2026-06-06.*DATAEYE_AUTH_EXPIRED/s);
  assert.match(analysis, /collect:preview -- --date 2026-06-06 --source dataeye --login-env-file \.env\.local\.dataeye/);
  assert.doesNotMatch(analysis, /当前 live 复现 \| 未通过/);
  assert.doesNotMatch(analysis, /当前不能宣称 live HTTP 真实采集已接入/);
});

test("request validation report does not expose raw nested user identifiers", () => {
  const validation = fs.readFileSync(path.join(process.cwd(), "docs/request-validation.md"), "utf8");

  assert.doesNotMatch(validation, /MS4wLjABAAA[A-Za-z0-9_-]{16,}/);
  assert.doesNotMatch(validation, /\\?"userId\\?"\s*:\s*\\?"[0-9]{8,}/);
  assert.doesNotMatch(validation, /\\?"account\\?"\s*:\s*\\?"[0-9]{8,}/);
  assert.ok(
    /"userId\\?":\\"?[0-9]{4}\.\.\.[0-9]{4}/.test(validation) || /登录态已失效/.test(validation),
    "validation report should either mask nested user identifiers or show the current auth-expired response"
  );
});
