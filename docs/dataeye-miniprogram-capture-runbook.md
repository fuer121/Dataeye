# 剧查查小程序漫剧热播榜抓包 Runbook

本文档用于定位并验证「剧查查小程序 > 榜单 > 漫剧热播榜 > 日榜」真实接口。真机只用于一次性抓包确认接口，后续定时采集应使用 Node.js HTTP 复现请求，不依赖真机无人值守运行。

## 目标范围

- 小程序：剧查查
- 页面：榜单
- Tab：漫剧热播榜
- 榜单周期：日榜
- 优先日期：2026-06-05
- 暂不覆盖：动态漫榜、沙雕漫榜、其他榜单 Tab、自动登录或登录态续期

## Charles 准备

1. 打开 Charles。
2. 运行预检：

```bash
npm run capture:preflight
```

如果 Charles 使用的不是默认 `8888` 端口：

```bash
CHARLES_PORT=<端口> npm run capture:preflight
```

3. 按 `docs/capture-preflight.md` 中的本机 IP 和端口配置 iPhone Wi-Fi 代理。
4. 在 iPhone 安装并信任 Charles Root Certificate。
5. 先抓完整 Session，定位小程序请求域名。
6. 定位域名后，为该域名开启 SSL Proxying。
7. 开始正式抓包前，清空 Charles Session。

Xcode 只用于排查设备连接、证书或网络代理问题，不作为主抓包链路。

## 小程序操作顺序

1. 打开微信。
2. 进入剧查查小程序。
3. 进入「榜单」。
4. 选择「漫剧热播榜」。
5. 确认周期为「日榜」。
6. 选择或停留在 2026-06-05。
7. 下拉刷新一次。
8. 向下滚动触发下一页请求，如果页面支持分页。
9. 切换到另一个日期。
10. 再切回 2026-06-05。

这组动作应产生榜单列表接口、日期/榜期接口，以及可能的分页接口。

## 保存文件

把材料保存到项目根目录的 `captures/`：

```text
captures/charles-dataeye-miniprogram-manhua-hot-20260605.har
captures/dataeye-miniprogram-manhua-hot-list-20260605.curl
captures/dataeye-miniprogram-manhua-hot-date.curl
captures/dataeye-miniprogram-manhua-hot-page2-20260605.curl
```

如果 Charles 只能导出文本，保存为：

```text
captures/dataeye-miniprogram-manhua-hot-list-20260605.txt
```

不要只提供 Charles 原生 `.chls` 文件。脚本读取 `.har`、`.json`、`.txt`、`.curl`。

导出前可按以下清单检查：

```text
docs/charles-export-checklist.md
```

## 必须保留的信息

不能脱敏：

- URL
- HTTP Method
- Header 名称
- Content-Type
- Query/Payload 字段名和值
- 日期参数
- 分页参数
- 榜单类型参数
- timestamp / sign 字段名和值
- 响应 JSON 字段名
- 至少一条榜单数据行

可以脱敏：

- Cookie
- Authorization
- Token
- Session
- openid / unionid
- 手机号
- 设备唯一 ID

如果 HAR 里的登录态已脱敏，或需要用更新后的登录态复现请求，请在本地 `.env.local` 提供真实值：

```bash
DATAEYE_AUTHENTICATION=
DATAEYE_LOGIN_USER_ID=
DATAEYE_S=
DATAEYE_REFERER=
DATAEYE_USER_AGENT=
DATAEYE_COOKIE=
DATAEYE_AUTHORIZATION=
DATAEYE_TOKEN=
```

剧查查小程序当前已定位接口必填 `DATAEYE_AUTHENTICATION` 和 `DATAEYE_LOGIN_USER_ID`；`DATAEYE_S`、`DATAEYE_REFERER`、`DATAEYE_USER_AGENT` 按 Charles 原请求补充。Cookie、Authorization、Token 只在目标请求实际出现时需要。

## 分析与验证

如果希望导出后自动分析，可以先开一个终端运行：

```bash
npm run capture:watch
npm run capture:watch -- --source dataeye
```

如果已经生成并核对 `.env.local.dataeye`，监听模式也可以复用这份登录态文件：

```bash
npm run capture:watch -- --login-env-file .env.local.dataeye
npm run capture:watch -- --source dataeye --login-env-file .env.local.dataeye
```

如果目标是本机刷新 DataEye 登录态，并在 fresh HAR 导出后自动执行预检与 daily gate，可以先开监听：

```bash
npm run capture:watch -- --source dataeye --login-env-file .env.local.dataeye --auto-refresh-login --auto-daily
```

这条命令只在检测到 `captures/` 中有可解析的 DataEye `motionComic?rankType=0` 抓包后工作：

- 先运行抓包分析流水线。
- 再用 fresh 目标请求刷新 `.env.local.dataeye`。
- 刷新预检为 `ready` 后，按抓包 URL 中的 `day` 执行 `dataeye:daily`。
- 如果抓包偏旧、预检失败或登录态失效，不会执行 live 落库。

放入抓包材料后优先运行完整流水线：

```bash
npm run capture:pipeline
npm run capture:pipeline -- --source dataeye
```

输出：

```text
docs/capture-pipeline.md
```

流水线会同时生成榜单行预览：

```text
docs/capture-material-audit.md
docs/ranking-preview.md
```

需要单步排查时，再运行：

```bash
npm run capture:audit
npm run capture:analyze
npm run capture:validate
npm run capture:preview
npm run capture:import -- --date 2026-06-05 --source dataeye
npm run capture:spec
```

`capture:import` 只导入抓包响应中已经存在的榜单数组，数据性质为 `capture` / `抓包导入`。它不发起 live HTTP 请求，不代表登录态已复现成功；后续 live 落库仍必须先通过 `capture:validate` 或 `collect:preview`。

确认 `docs/request-analysis.md` 中存在疑似榜单接口，并人工核对：

- 页面来源是剧查查小程序榜单页。
- 请求与「漫剧热播榜 + 日榜 + 2026-06-05」匹配。
- 响应包含榜单数组。
- 首条数据能看到排名、名称、热度值、类型。

补齐 `.env.local` 后重新运行：

```bash
npm run capture:pipeline
```

当前 `lib/collectors/live.js` 已有仅限剧查查小程序「漫剧热播榜 + 日榜」的 DataEye 采集器。只有 `docs/request-validation.md` 或 `collect:preview` 明确显示 HTTP 2xx、业务响应包含榜单数组、字段映射就绪，才允许执行 live 落库或继续扩展采集器。CLI 落库还必须显式传入 `--confirmed-preview`；API 落库必须传入 `confirmedPreview=true`。

如只需要重新生成候选 API 规格草稿：

```bash
npm run capture:spec
```

输出：

```text
docs/api-spec.md
```

## 启用或扩展采集器的门槛

必须同时满足：

- HTTP 状态码为 2xx。
- 业务状态不是登录失效、未授权、风控失败或空响应。
- `docs/capture-material-audit.md` 没有材料完整度问题。
- 响应包含榜单数组。
- 榜单条目可映射 `rank`、`title`、`heatValue`、`dramaType`。
- `docs/ranking-preview.md` 中的排名、作品名、热度值和类型与小程序页面一致。
- 同一天重复验证结果稳定。
- 登录失效时能返回明确失败，而不是写入模拟数据。

不满足以上条件时，只继续补抓包材料、分析请求或更新 `.env.local` 登录态；不得执行真实采集落库，也不得扩展到新的榜单来源。
