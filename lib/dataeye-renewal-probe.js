import { summarizeCaptureFreshness } from "../scripts/capture-utils.js";

export function inspectDataEyeRenewalReadiness({ charles = {}, wechat = {}, targetRequest = null, now = new Date() } = {}) {
  const freshness = targetRequest ? summarizeCaptureFreshness(targetRequest, now) : null;
  const charlesReady = Boolean(charles.open || charles.cliAvailable);
  const wechatReady = Boolean(wechat.running);

  if (!charlesReady) {
    return buildResult({
      status: "blocked",
      canRefreshLogin: false,
      charles,
      wechat,
      targetRequest,
      freshness,
      nextAction: "请先打开 Charles，确认本机代理端口可连接，或确认 Charles CLI/headless 能写出可转换的 session。"
    });
  }

  if (!wechatReady) {
    return buildResult({
      status: "blocked",
      canRefreshLogin: false,
      charles,
      wechat,
      targetRequest,
      freshness,
      nextAction: "请先打开 Mac WeChat，并确认剧查查小程序可在当前账号中访问。"
    });
  }

  if (!targetRequest) {
    return buildResult({
      status: "monitoring_required",
      canRefreshLogin: false,
      charles,
      wechat,
      targetRequest,
      freshness,
      nextAction:
        "请在 Mac WeChat 中打开剧查查小程序榜单页，触发 playlet-applet.dataeye.com/playlet/motionComic 请求后，将 fresh HAR 放入 captures/。"
    });
  }

  if (freshness.status !== "fresh") {
    return buildResult({
      status: "needs_fresh_capture",
      canRefreshLogin: false,
      charles,
      wechat,
      targetRequest,
      freshness,
      nextAction: "已发现 DataEye 目标请求，但抓包不是 fresh。请重新触发 Mac WeChat 小程序请求并导出新 HAR。"
    });
  }

  return buildResult({
    status: "ready",
    canRefreshLogin: true,
    charles,
    wechat,
    targetRequest,
    freshness,
    nextAction: "可运行 npm run dataeye:refresh-login 刷新 .env.local.dataeye，并继续执行 DataEye live 预检。"
  });
}

export function renderDataEyeRenewalProbeReport({ result }) {
  return `# DataEye 登录态续期探针

生成时间：${new Date().toISOString()}

## 结论

${renderConclusion(result)}

| 项 | 内容 |
| --- | --- |
| 状态 | ${result.status} |
| 可刷新登录态 | ${result.canRefreshLogin ? "是" : "否"} |
| 下一步 | ${escapePipes(result.nextAction)} |

## Charles

| 项 | 内容 |
| --- | --- |
| 端口 | ${result.charles?.port || "未知"} |
| 端口可连接 | ${result.charles?.open ? "是" : "否"} |
| CLI 可用 | ${result.charles?.cliAvailable ? "是" : "否"} |
| 错误 | ${escapePipes(result.charles?.error || "无")} |

## Mac WeChat

| 项 | 内容 |
| --- | --- |
| 进程存在 | ${result.wechat?.running ? "是" : "否"} |
| 相关进程数 | ${result.wechat?.processCount ?? 0} |

## DataEye 目标请求

| 项 | 内容 |
| --- | --- |
| 请求 ID | ${result.targetRequest?.id || "无"} |
| 来源文件 | ${result.targetRequest?.sourceFile || "无"} |
| URL | ${escapePipes(result.targetRequest?.url || "无")} |
| 抓包新鲜度 | ${result.freshness ? `${result.freshness.ageLabel}（${result.freshness.note}）` : "无"} |

## 边界

- Xcode 不作为主自动化链路，只用于排查设备、模拟器或证书环境。
- 不做绕过风控、逆向登录、自动破解签名或 token 生成。
- 本探针不会自动执行 GUI 点击，也不会自动导出 Charles HAR。
- 只有检测到 fresh 的 DataEye motionComic 请求后，才建议运行 \`npm run dataeye:refresh-login\`。
`;
}

function buildResult({ status, canRefreshLogin, charles, wechat, targetRequest, freshness, nextAction }) {
  return {
    status,
    canRefreshLogin,
    charles,
    wechat,
    targetRequest,
    freshness,
    nextAction
  };
}

function renderConclusion(result) {
  if (result.status === "ready") return "已发现 fresh DataEye 目标请求，可进入本地登录态刷新和预检。";
  if (result.status === "monitoring_required") return "Mac WeChat 和 Charles 具备探针条件，但尚未发现 DataEye 目标请求。";
  if (result.status === "needs_fresh_capture") return "已发现 DataEye 目标请求，但抓包偏旧，不建议覆盖本地登录态。";
  return "当前环境不满足自动续期探针条件。";
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
