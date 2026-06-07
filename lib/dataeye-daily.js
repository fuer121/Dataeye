import { collectDataEyeRanking } from "./collectors/live.js";
import { formatShanghaiDate, isValidDateString } from "./date.js";
import { runCollection } from "./collection.js";

export async function runDataEyeDailyCollection({
  rankingDate = formatShanghaiDate(new Date()),
  rankType = "0",
  period = "day"
} = {}) {
  if (!isValidDateString(rankingDate)) {
    return buildFailedResult({
      rankingDate,
      status: "failed",
      error: "date 必须是有效的 YYYY-MM-DD 日期。",
      nextAction: "请传入有效日期后重试。"
    });
  }

  const startedAt = new Date().toISOString();
  const preview = await previewDataEye({ rankingDate, rankType, period });

  if (!preview.ok) {
    return {
      ok: false,
      source: "dataeye",
      rankingDate,
      rankType,
      period,
      status: classifyPreviewFailure(preview),
      startedAt,
      finishedAt: new Date().toISOString(),
      preview,
      live: null,
      nextAction: preview.action || "请先修复 DataEye 预检问题，再重新执行 daily 调度。"
    };
  }

  const live = await runCollection({ date: rankingDate, source: "dataeye", mode: "live", rankType, period });
  return {
    ok: !live.failed,
    source: "dataeye",
    rankingDate,
    rankType,
    period,
    status: live.failed ? "live_failed" : "success",
    startedAt,
    finishedAt: new Date().toISOString(),
    preview,
    live,
    nextAction: live.failed
      ? "live 落库失败。请查看采集日志，确认登录态、接口结构和字段映射。"
      : `打开 http://localhost:3000/?date=${rankingDate}&source=dataeye&dataKind=live 核对页面。`
  };
}

export function renderDataEyeDailyReport({ result, envFileStatus }) {
  const liveRows = result.live?.runs?.length
    ? result.live.runs
        .map(
          (run) =>
            `| ${run.source} | ${run.rankingDate} | ${run.mode} | ${run.status} | ${run.insertedCount} | ${run.skippedCount} | ${escapePipes(run.message)} |`
        )
        .join("\n")
    : "| - | - | - | skipped | 0 | 0 | 真实采集未落库。 |";

  return `# DataEye 每日采集

生成时间：${new Date().toISOString()}

## 结论

${result.ok ? "DataEye 每日采集完成。" : "DataEye 每日采集未完成；未通过预检时不会执行 live 落库。"}

| 项 | 内容 |
| --- | --- |
| 来源 | dataeye |
| 日期 | ${result.rankingDate || ""} |
| 榜单类型 | ${result.rankType || "0"} |
| 周期 | ${result.period || "day"} |
| 状态 | ${result.status} |
| 预检条数 | ${result.preview?.rows?.length || 0} |
| live 是否执行 | ${result.live ? "是" : "否"} |
| 下一步 | ${escapePipes(result.nextAction || "")} |

## 登录态文件

登录态文件：${envFileStatus?.label || "默认 .env.local / 当前进程环境"}

## 预检结果

| 项 | 内容 |
| --- | --- |
| 状态 | ${result.preview?.ok ? "ready" : "failed"} |
| 错误 | ${escapePipes(result.preview?.error || "无")} |
| 下一步 | ${escapePipes(result.preview?.action || "无")} |

## live 结果

| 来源 | 日期 | 模式 | 状态 | 新增 | 跳过重复 | 消息 |
| --- | --- | --- | --- | ---: | ---: | --- |
${liveRows}

## 说明

- daily 调度固定 source=dataeye。
- preview 未返回真实榜单数组时，不执行 live 落库。
- 红果真实采集仍保持暂停，不参与 daily 调度。
`;
}

async function previewDataEye({ rankingDate, rankType, period }) {
  try {
    const rows = await collectDataEyeRanking({ rankingDate, rankType, period });
    return {
      ok: rows.length > 0,
      rows,
      error: rows.length > 0 ? "" : "DataEye 预检未返回榜单行。",
      action: rows.length > 0 ? "" : "请重新抓包或检查接口响应结构。"
    };
  } catch (error) {
    return {
      ok: false,
      rows: [],
      error: error.message || "DataEye 预检失败。",
      code: error.code || "",
      action: error.action || ""
    };
  }
}

function classifyPreviewFailure(preview) {
  const text = `${preview.code || ""} ${preview.error || ""}`;
  if (/DATAEYE_AUTH_EXPIRED|statusCode=401|登录态已失效|重新登录|未登录/.test(text)) return "auth_expired";
  return "preview_failed";
}

function buildFailedResult({ rankingDate, status, error, nextAction }) {
  return {
    ok: false,
    source: "dataeye",
    rankingDate,
    status,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    preview: {
      ok: false,
      rows: [],
      error,
      action: nextAction
    },
    live: null,
    nextAction
  };
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
