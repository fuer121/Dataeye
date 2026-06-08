import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  assessRankingReadiness,
  listCaptureFiles,
  maskSensitiveValue,
  parseCaptureFiles,
  rel,
  ROOT_DIR,
  summarizeCaptureFreshness,
  writeMarkdown
} from "../scripts/capture-utils.js";
import { getDataEyeRequestRankingDate, isDataEyeMotionComicRequest } from "./dataeye-capture-target.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_DIR = path.join(MODULE_DIR, "../scripts");

export function refreshDataEyeLogin({ skipPreview = false, date = "", echoPreview = false, allowStaleCapture = false } = {}) {
  const files = listCaptureFiles();
  const { requests, errors } = parseCaptureFiles(files);
  const selected = selectDataEyeLoginSourceRequest(requests);

  let result;
  if (!selected) {
    result = {
      ok: false,
      status: "failed",
      message: "未找到 DataEye 小程序目标请求。",
      selected: null,
      rankingDate: date || "",
      localEnvPath: "",
      preview: null
    };
  } else {
    const rankingDate = date || getRequestDay(selected);
    const freshness = summarizeCaptureFreshness(selected);

    if (!skipPreview && !allowStaleCapture && freshness.status !== "fresh") {
      result = {
        ok: false,
        status: "stale_capture",
        message: "抓包材料不是 fresh，已跳过写入本地 DataEye 登录态。",
        selected,
        rankingDate,
        localEnvPath: "",
        preview: null
      };
    } else {
      const localEnvPath = writeLocalEnvFile(selected);
      const preview = skipPreview ? null : runPreview(rankingDate, { echoPreview });
      const previewReady = skipPreview || preview?.resultStatus === "ready";
      result = {
        ok: Boolean(rankingDate) && previewReady,
        status: !rankingDate ? "failed" : previewReady ? "ready" : "preview_failed",
        message: buildResultMessage({ rankingDate, previewReady, skipPreview }),
        selected,
        rankingDate,
        localEnvPath,
        preview
      };
    }
  }

  const reportPath = writeMarkdown("dataeye-login-refresh.md", renderDataEyeLoginRefreshReport({ files, errors, result, skipPreview }));

  return {
    ...result,
    files,
    errors,
    reportPath
  };
}

export function toSafeDataEyeLoginRefreshPayload(result) {
  return {
    ok: Boolean(result.ok),
    status: result.status,
    message: result.message,
    rankingDate: result.rankingDate || "",
    captureFileCount: result.files?.length || 0,
    selectedRequestId: result.selected?.id || "",
    selectedSourceFile: result.selected?.sourceFile ? rel(result.selected.sourceFile) : "",
    localEnvPath: result.localEnvPath ? rel(result.localEnvPath) : "",
    reportPath: result.reportPath ? rel(result.reportPath) : "",
    previewStatus: result.preview?.resultStatus || (result.preview ? "unknown" : "skipped"),
    previewExitCode: result.preview?.status ?? null,
    nextAction: getSafeNextAction(result)
  };
}

export function renderDataEyeLoginRefreshReport({ files, errors, result, skipPreview }) {
  const now = new Date().toISOString();

  if (!result.selected) {
    return `# DataEye 登录态刷新

生成时间：${now}

## 结论

未找到 DataEye 小程序目标请求。请先将 Charles/Proxyman 导出的剧查查小程序榜单 HAR、JSON 或 cURL 放入 \`captures/\`。

| 项 | 数量 |
| --- | ---: |
| 抓包文件 | ${files.length} |
| 解析错误 | ${errors.length} |

## 下一步

- 重新打开剧查查小程序，进入榜单页并触发目标请求。
- 用 Charles/Proxyman 导出新 HAR 到 \`captures/\`。
- 再运行 \`npm run dataeye:refresh-login\`。
`;
  }

  const envRows = buildEnvRows(result.selected);
  const freshness = summarizeCaptureFreshness(result.selected);
  const readiness = assessRankingReadiness(result.selected.responseBody);

  return `# DataEye 登录态刷新

生成时间：${now}

## 结论

${result.message}${skipPreview ? " 本次按参数跳过预检。" : " 已继续执行 live 预检，详情见 `docs/live-collection-preview.md`。"}

| 项 | 内容 |
| --- | --- |
| 目标请求 | \`${result.selected.id}\` |
| 来源文件 | \`${rel(result.selected.sourceFile)}\` |
| 请求日期 | ${result.rankingDate || "未识别"} |
| 捕获时间 | ${freshness.capturedAt || "未知"} |
| 距今 | ${freshness.ageLabel}（${freshness.note}） |
| 抓包字段映射就绪 | ${readiness.ready ? "是" : "否"} |
| 本地登录态文件 | ${result.localEnvPath ? `\`${rel(result.localEnvPath)}\`` : "未写入"} |
| 预检执行 | ${getPreviewExecutionLabel({ result, skipPreview })} |
| 预检结果 | ${skipPreview ? "skipped" : result.preview?.resultStatus || "unknown"} |

## Header 对照

敏感值只显示掩码，完整值仅写入本机 \`.env.local.dataeye\`。

| 环境变量 | Header | 抓包状态 |
| --- | --- | --- |
${envRows.map((row) => `| ${row.key} | ${row.header} | ${row.status} |`).join("\n")}

## 下一步

${renderNextStep({ result, skipPreview })}
`;
}

function runPreview(rankingDate, { echoPreview = false } = {}) {
  if (!rankingDate) {
    return {
      status: 1,
      resultStatus: "unknown",
      stdout: "",
      stderr: "目标请求缺少可识别的榜期日期，未执行预检。"
    };
  }

  const child = spawnSync(
    process.execPath,
    [
      path.join(SCRIPT_DIR, "live-collection-preview.js"),
      "--date",
      rankingDate,
      "--source",
      "dataeye",
      "--login-env-file",
      ".env.local.dataeye"
    ],
    {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  if (echoPreview) {
    process.stdout.write(child.stdout || "");
    process.stderr.write(child.stderr || "");
  }

  return {
    status: child.status ?? 1,
    resultStatus: parsePreviewStatus(child.stdout) || "unknown",
    stdout: child.stdout || "",
    stderr: child.stderr || ""
  };
}

function parsePreviewStatus(stdout = "") {
  const match = String(stdout).match(/^Status:\s*([^\s]+)/m);
  return match?.[1] || "";
}

function buildResultMessage({ rankingDate, previewReady, skipPreview }) {
  if (!rankingDate) return "目标请求缺少可识别的榜期日期。";
  if (skipPreview) return "已从抓包目标请求刷新本地 DataEye 登录态。";
  if (previewReady) return "已从抓包目标请求刷新本地 DataEye 登录态，且 live 预检通过。";
  return "已写入本地 DataEye 登录态，但 live 预检未通过。";
}

function renderNextStep({ result, skipPreview }) {
  if (!result.rankingDate) {
    return "- 重新导出带 `day`、`week` 或 `month` 榜期参数的剧查查小程序目标请求。";
  }

  if (result.status === "stale_capture") {
    return `- 重新打开剧查查小程序，进入榜单页并触发目标请求。
- 用 Charles/Proxyman 导出新 HAR 到 \`captures/\` 后，再运行 \`npm run dataeye:refresh-login\`。
- 如果你确认旧 HAR 仍有效，可用显式强制参数再试，但默认不会覆盖本地登录态。`;
  }

  if (!skipPreview && result.preview?.resultStatus !== "ready") {
    return `- live 预检未通过，不要执行 \`npm run collect:live\`。
- 重新打开剧查查小程序并用 Charles/Proxyman 导出新 HAR 后，再运行 \`npm run dataeye:refresh-login\`。
- 如果确认 HAR 新鲜但仍失败，先查看 \`docs/live-collection-preview.md\` 的错误和登录态字段状态。`;
  }

  return `只有第一条预检返回真实榜单数组并人工核对无误后，才执行第二条落库命令。

\`\`\`bash
npm run collect:preview -- --date ${result.rankingDate || "<YYYY-MM-DD>"} --source dataeye --login-env-file .env.local.dataeye
npm run collect:live -- --date ${result.rankingDate || "<YYYY-MM-DD>"} --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
\`\`\``;
}

function getSafeNextAction(result) {
  if (!result.selected) return "请先将剧查查小程序目标 HAR 放入 captures/ 后重试。";
  if (result.status === "ready") return "预检通过后，可人工核对榜单行并执行真实落库。";
  if (result.status === "stale_capture") return "抓包材料不是 fresh，请重新用 Charles/Proxyman 导出剧查查小程序 HAR。";
  if (result.status === "preview_failed") return "live 预检未通过，请重新抓包或检查 docs/live-collection-preview.md。";
  return result.message || "请查看 docs/dataeye-login-refresh.md。";
}

function getPreviewExecutionLabel({ result, skipPreview }) {
  if (skipPreview) return "跳过预检";
  if (!result.preview) return "未执行";
  return `已执行，退出码 ${result.preview.status ?? "-"}`;
}

function writeLocalEnvFile(request) {
  const outputPath = path.join(ROOT_DIR, ".env.local.dataeye");
  const lines = [
    "# Generated from local capture material by npm run dataeye:refresh-login",
    "# Contains sensitive mini-program login values. Keep this file local.",
    "",
    ...buildEnvRows(request).map((row) => `${row.key}=${escapeEnvValue(row.value || "")}`),
    ""
  ];
  fs.writeFileSync(outputPath, lines.join("\n"), { mode: 0o600 });
  return outputPath;
}

function buildEnvRows(request) {
  const headers = request.headers || {};
  return [
    envRow("DATAEYE_AUTHENTICATION", "authentication", headers.authentication),
    envRow("DATAEYE_LOGIN_USER_ID", "loginUserId", headers.loginuserid),
    envRow("DATAEYE_S", "S", headers.s),
    envRow("DATAEYE_REFERER", "referer", headers.referer),
    envRow("DATAEYE_USER_AGENT", "user-agent", headers["user-agent"]),
    envRow("DATAEYE_COOKIE", "cookie", headers.cookie),
    envRow("DATAEYE_AUTHORIZATION", "authorization", headers.authorization),
    envRow("DATAEYE_TOKEN", "token", headers.token)
  ];
}

function envRow(key, header, value) {
  const present = Boolean(value);
  return {
    key,
    header,
    value: present ? value : "",
    status: present ? maskSensitiveValue(value) : "未提供"
  };
}

function selectDataEyeLoginSourceRequest(requests = []) {
  return requests.filter(isDataEyeMotionComicLoginSource).sort(compareDataEyeLoginSourceRequests)[0];
}

function compareDataEyeLoginSourceRequests(a, b) {
  const loginHeaderDiff = Number(Boolean(b.headers?.loginuserid)) - Number(Boolean(a.headers?.loginuserid));
  if (loginHeaderDiff) return loginHeaderDiff;
  const capturedAtDiff = getCapturedAtValue(b) - getCapturedAtValue(a);
  if (capturedAtDiff) return capturedAtDiff;
  return (b.score || 0) - (a.score || 0);
}

function getCapturedAtValue(request = {}) {
  const timestamp = Date.parse(request.startedDateTime || request.capturedAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function isDataEyeMotionComicLoginSource(request) {
  try {
    const headers = request.headers || {};
    return isDataEyeMotionComicRequest(request) && Boolean(getDataEyeRequestRankingDate(request)) && Boolean(headers.authentication);
  } catch {
    return false;
  }
}

function getRequestDay(request) {
  return getDataEyeRequestRankingDate(request);
}

function escapeEnvValue(value) {
  const text = String(value ?? "");
  if (!text) return "";
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) return text;
  return JSON.stringify(text);
}
