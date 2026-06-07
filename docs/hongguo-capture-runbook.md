# 红果漫剧日榜抓包 Runbook

本文档用于定位并验证红果「漫剧日榜」真实接口。当前项目尚未验证红果榜单入口、请求参数和响应字段，因此本阶段只接收和分析抓包材料，不编写 live 采集器，不猜测接口路径。

## 目标范围

- 来源：红果
- 榜单：漫剧日榜
- 优先日期：与页面可见日期一致，建议先抓当天，再切换一次日期
- 暂不覆盖：非漫剧榜、周榜/月榜、自动登录、自动续期、风控绕过

## 抓包准备

1. 打开 Charles。
2. 运行本地预检：

```bash
npm run capture:preflight
```

如果 Charles 不是默认 `8888` 端口：

```bash
CHARLES_PORT=<端口> npm run capture:preflight
```

3. 按 `docs/capture-preflight.md` 中的本机 IP 和端口配置 iPhone Wi-Fi 代理。
4. 在 iPhone 安装并信任 Charles Root Certificate。
5. 首轮先抓完整 Session，用于定位红果请求域名。
6. 定位域名后，仅对目标域名开启 SSL Proxying。
7. 正式抓包前清空 Charles Session。

## 操作顺序

1. 打开红果相关小程序或 App 页面。
2. 进入漫剧榜单页。
3. 确认榜单周期为日榜。
4. 停留在目标日期。
5. 下拉刷新一次。
6. 向下滚动触发下一页请求，如果页面支持分页。
7. 切换到另一个日期。
8. 再切回目标日期。

这组动作应尽量覆盖：

- 榜单列表接口。
- 日期/榜期接口。
- 分页接口，如存在。

## 保存文件

把材料保存到项目根目录 `captures/`：

```text
captures/charles-hongguo-manhua-daily-<YYYYMMDD>.har
captures/hongguo-manhua-daily-list-<YYYYMMDD>.curl
captures/hongguo-manhua-daily-date.curl
captures/hongguo-manhua-daily-page2-<YYYYMMDD>.curl
```

如果 Charles 只能导出文本，保存为：

```text
captures/hongguo-manhua-daily-list-<YYYYMMDD>.txt
```

脚本读取 `.har`、`.json`、`.txt`、`.curl`。不要只提供 Charles 原生 `.chls` 文件。

## 必须保留的信息

不能脱敏：

- URL。
- HTTP Method。
- Header 名称。
- Content-Type。
- Query/Payload 字段名和值。
- 日期参数。
- 分页参数。
- 榜单类型参数。
- timestamp / sign 字段名和值。
- 响应 JSON 字段名。
- 至少一条榜单数据行。

可以脱敏：

- Cookie。
- Authorization。
- Token。
- Session。
- openid / unionid。
- 手机号。
- 设备唯一 ID。

如果 HAR 中敏感值已脱敏，后续验证用本地 `.env.local` 或显式登录态文件补充：

```bash
HONGGUO_SESSION=
HONGGUO_COOKIE=
HONGGUO_AUTHORIZATION=
HONGGUO_TOKEN=
```

## 分析与验证

放入抓包材料后运行：

```bash
npm run capture:pipeline
npm run capture:pipeline -- --source hongguo
```

如果希望导出 HAR/cURL 后自动分析，可以先开一个终端运行：

```bash
npm run capture:watch -- --source hongguo
```

如需使用本地登录态文件：

```bash
npm run capture:pipeline -- --source hongguo --login-env-file .env.local.hongguo
npm run capture:watch -- --source hongguo --login-env-file .env.local.hongguo
```

重点查看：

```text
docs/capture-material-audit.md
docs/request-analysis.md
docs/request-validation.md
docs/ranking-preview.md
docs/api-spec.md
```

只有同时满足以下条件，才进入红果 live 采集器开发：

- HTTP 状态码为 2xx。
- 业务响应不是登录失效、未授权、风控失败或空响应。
- 响应包含榜单数组。
- 榜单条目能映射 `rank`、`title`、`heatValue`、`dramaType`。
- `docs/ranking-preview.md` 中的排名、作品名、热度值和类型与红果页面一致。
- 同日期重复验证结果稳定。
- 登录失效时能返回明确失败，不写模拟数据冒充真实数据。

未满足以上条件时，只继续补抓包材料、分析请求或更新本地登录态；不得实现或启用红果 live 采集器。
