# 短剧/漫剧榜单采集 MVP

这是一个本地后台网站 MVP，用于每日采集、存储、匹配和展示短剧/漫剧榜单数据。当前版本先跑通本地数据链路：SQLite 存储、模拟榜单采集、小说库映射导入、精确匹配和页面筛选。

## 技术栈

- Next.js App Router
- SQLite
- better-sqlite3
- React

## 启动

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

SQLite 默认写入：

```text
./data/ju-chacha.sqlite
```

可以通过环境变量改数据库位置：

```bash
SQLITE_PATH=./data/local.sqlite npm run dev
```

## 页面

- `/`：榜单数据页，默认展示本地已有的最新榜单日期，支持日期、来源、匹配状态、数据性质、榜单类型、周期和榜期筛选，展示来源标识、数据性质、榜单类型、周期和榜期，也支持手动触发采集。数据性质包括模拟、抓包导入和真实 live。登录态过期或最新 DataEye 抓包为 fresh 时，页面会显示 `刷新登录态并预检` 操作入口；它只刷新本地 `.env.local.dataeye` 并执行预检，不会自动落库。
- `/novels`：小说库页面，支持搜索小说名、短剧/漫剧名，导入模拟映射，上传 CSV/JSON 映射文件，同步飞书电子表格，并手动新增、编辑、删除单条映射。

可以用查询参数直接打开某个筛选视图，例如查看已落库的 DataEye 真实榜单：

```text
http://localhost:3000/?date=2026-06-06&source=dataeye&dataKind=live
http://localhost:3000/?date=2026-06-06&source=dataeye&dataKind=live&rankType=1&rankPeriod=week
```

可随时生成本地 MVP 状态报告，核对 DataEye live 数据、最近预检状态、最新抓包材料、小说映射、匹配率、登录态文件和红果暂停状态：

```bash
npm run mvp:status
```

报告输出到：

```text
docs/mvp-status.md
```

同一份状态也可通过只读 API 获取：

```bash
curl http://localhost:3000/api/status
```

## 手动采集

页面上可以点击：

- `导入模拟小说库`
- 小说库页的 `导入 CSV/JSON`
- 小说库页的 `同步飞书表格`
- `采集 DataEye 模拟榜单`
- `导入抓包榜单`
- `上传抓包`

也可以直接请求 API：

```bash
curl -X POST http://localhost:3000/api/novels/import
curl -X POST http://localhost:3000/api/collect \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-06-05","source":"all","mode":"sample"}'
```

当前真实采集只启用 DataEye / 剧查查，落库请求必须明确指定 `source=dataeye`，避免和未验证的红果采集混跑：

先执行只读预检，不写入 SQLite。页面上也可以点击 `预检 DataEye / 剧查查真实采集`；同一日期、同一来源预检成功后，页面上的真实采集按钮才会启用：

```bash
npm run collect:preview -- --date 2026-06-06
npm run collect:preview -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye
npm run collect:preview -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye --rank-type all --period all
```

预检通过、榜单行核对无误后，再执行落库：

```bash
npm run collect:live -- --date 2026-06-06 --source dataeye --confirmed-preview
npm run collect:live -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
npm run dataeye:collect -- --date 2026-06-06 --login-env-file .env.local.dataeye --rank-type all --period all
```

也可以直接请求 API：

```bash
curl -X POST http://localhost:3000/api/collect \
  -H 'Content-Type: application/json' \
  -d '{"date":"2026-06-06","source":"dataeye","mode":"live","confirmedPreview":true,"rankType":"all","period":"all"}'
```

页面上的 `预检当前筛选 DataEye / 剧查查` 和 `采集当前筛选 DataEye / 剧查查` 会按当前榜单 tab 和周期 tab 执行 live 预检与落库流程；新增的 `一键全量预检 DataEye` 和 `一键全量真实采集 DataEye` 会固定执行 `rankType=all + period=all`。`collect:preview` 和 `collect:live` 仍兼容旧用法，默认只采 `rankType=0 + day`；`dataeye:daily` 默认升级为 `rankType=all + period=all`。当前页面操作按钮固定指向 DataEye；红果只保留为历史/模拟数据筛选和后续抓包分析入口，不推进真实采集。

DataEye 已知榜单类型：

| rankType | 中文名 |
| ---: | --- |
| 0 | 漫剧热播榜 |
| 1 | 动态漫榜 |
| 2 | 沙雕漫榜 |
| 3 | 真人AI榜 |
| 4..20 | 如接口返回可映射数组，会以 `未命名榜单 rankType=N` 入库，需后续补中文名 |

DataEye 周期参数：

| 周期 | 列表接口参数 |
| --- | --- |
| 日榜 | `day` |
| 周榜 | `week` |
| 月榜 | `month` |

去重规则：

```text
同来源 + 数据性质 + 榜单类型 + 周期 + 榜期 + 同作品归一化名称
```

重复采集不会覆盖历史数据，会在采集日志中显示跳过数量。

采集日期必须是有效的 `YYYY-MM-DD`，例如 `2026-06-06`。无效日期会被 API、`collect:preview` 和 `collect:live` 拒绝，不写入历史数据。

## 登录态配置

不要把登录态、cookie、token 写入代码。需要真实采集时，用本地 `.env.local` 或启动环境变量提供：

```bash
DATAEYE_SESSION=
DATAEYE_COOKIE=
DATAEYE_AUTHORIZATION=
DATAEYE_AUTHENTICATION=
DATAEYE_LOGIN_USER_ID=
DATAEYE_S=
DATAEYE_REFERER=
DATAEYE_USER_AGENT=
DATAEYE_TOKEN=
HONGGUO_SESSION=
HONGGUO_COOKIE=
HONGGUO_AUTHORIZATION=
HONGGUO_TOKEN=
```

当前剧查查 live 采集器已接入并验证微信小程序接口：

```text
GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=<日期>&rankType=0
GET https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=<rankType>
GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&week=<周榜期>&rankType=<rankType>
GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&month=<月榜期>&rankType=<rankType>
```

它对应「剧查查小程序 > 榜单 > 漫剧榜单」系列页面。请求登录态必须从环境变量读取，其中 `DATAEYE_AUTHENTICATION` 和 `DATAEYE_LOGIN_USER_ID` 为必填，`DATAEYE_S`、`DATAEYE_REFERER`、`DATAEYE_USER_AGENT`、Cookie、Authorization、Token 按抓包材料可选补充。页面 API 会读取 `.env.local` 和 `.env.local.dataeye`；CLI 可通过 `--login-env-file .env.local.dataeye` 显式指定。登录态缺失、过期或接口返回结构异常时，会返回明确失败原因，不会尝试绕过风控，也不会落入模拟数据冒充真实数据。

当前本机已落库可查看的 DataEye live 样例是 `2026-06-06`。最近一次使用现有 HAR 登录态重新预检 `2026-06-06` 时返回 `DATAEYE_AUTH_EXPIRED` / `登录态已失效，请重新登录`，说明需要重新打开剧查查小程序、用 Charles/Proxyman 导出新 HAR，并更新 `.env.local.dataeye` 后再采集新日期。

剧查查小程序「漫剧热播榜日榜」真实接口定位流程见：

```text
docs/dataeye-miniprogram-capture-runbook.md
```

红果漫剧日榜尚未验证接口，抓包材料准备流程见：

```text
docs/hongguo-capture-runbook.md
```

抓包前可先运行：

```bash
npm run capture:preflight
```

在 `npm run capture:analyze` 和 `npm run capture:validate` 证明响应包含可映射榜单数组前，不要扩展新的 `live` 采集器。

放入抓包材料后优先运行完整流水线：

```bash
npm run capture:pipeline
```

也可以在首页点击 `上传抓包`，直接把 Charles/Proxyman 导出的 `.har`、`.json`、`.txt` 或 `.curl` 文件保存到本地 `captures/`。上传成功后会自动生成 DataEye 抓包报告，上传 API 也会返回 pipeline 摘要；页面会重新读取最新 DataEye 抓包材料，再根据新鲜度决定是否允许刷新登录态。

上传后可继续点击 `生成 DataEye 抓包报告`，它等价于从页面触发 `npm run capture:pipeline -- --source dataeye --login-env-file .env.local.dataeye`。这个按钮只生成抓包分析、验证、预览和接口规格报告，不会刷新登录态，也不会执行 `collect:live` 落库。

也可以从抓包目标请求生成 `.env.local` 填写清单，敏感值只输出掩码：

```bash
npm run capture:env
```

如果确认当前 HAR 来自你自己的有效小程序登录态，也可以显式生成本地配置草稿。该文件包含完整敏感 Header，只写到本机 `.env.local.dataeye`，已被 `.gitignore` 忽略；人工核对后再复制到 `.env.local`：

```bash
npm run capture:env -- --write-local
```

当前主要推进 DataEye 时，也可以用一条命令完成“从最新目标 HAR 刷新 `.env.local.dataeye` + 自动预检”。该命令会选择 `captures/` 中最新、带有效认证头的 `motionComic` 榜单请求，完整敏感值只写入本地 `.env.local.dataeye`，报告只显示掩码：

```bash
npm run dataeye:refresh-login
```

该命令会继续执行 live 预检；预检失败时命令整体返回失败状态，并写入 `docs/live-collection-preview.md` 的失败原因。此时不要执行 `npm run collect:live`，需要重新抓包或补齐有效登录态后再试。

默认只接受 fresh 抓包材料；如果最新 DataEye 抓包已经 aging/stale，命令和页面按钮都不会覆盖 `.env.local.dataeye`。页面上的 `刷新登录态并预检` 按钮调用同一套逻辑，返回的只是状态、日期和报告路径，不会把完整登录态值展示到页面或 API 响应中。

如果你人工确认旧 HAR 仍可用，可以在命令行显式允许旧抓包覆盖本地登录态：

```bash
npm run dataeye:refresh-login -- --allow-stale-capture
```

如果只想先写入 `.env.local.dataeye`，暂不发起预检：

```bash
npm run dataeye:refresh-login -- --skip-preview
```

## DataEye 每日调度与续期探针

稳定采集优先使用服务端 HTTP 复现，不把 Xcode 或 Charles GUI 操作作为主链路。Xcode 不作为主自动化链路，只用于排查设备、模拟器或证书环境；当前不做绕过风控、逆向登录、自动破解签名或 token 生成。

每日调度入口：

```bash
npm run dataeye:daily -- --date 2026-06-06 --login-env-file .env.local.dataeye
npm run dataeye:daily -- --date 2026-06-06 --login-env-file .env.local.dataeye --rank-type all --period all
```

该命令固定 `source=dataeye`，先执行 live preview；只有 preview 返回真实榜单数组后，才会继续执行 `collect:live --confirmed-preview`。preview 失败、登录态过期、字段缺失或榜单为空时，不会写入 live 数据，也不会降级为 sample/capture。报告输出到：

```text
docs/dataeye-daily-run.md
```

不传 `--date` 时默认使用当天日期；如需默认采集前一天，可在本地环境中设置：

```bash
DATAEYE_DAILY_DATE_OFFSET_DAYS=-1
```

本地定时建议优先用 macOS `launchd` 包一层 npm runner，例如每天固定时间运行：

```bash
cd /Users/staff/Desktop/qm-work/剧查查-goal
npm run dataeye:daily -- --login-env-file .env.local.dataeye
```

登录态续期探针用于判断当前 Mac WeChat + Charles 环境是否具备刷新登录态条件：

```bash
npm run dataeye:renewal-probe
```

报告输出到：

```text
docs/dataeye-renewal-probe.md
```

探针只检查 Charles 端口/CLI、Mac WeChat 进程、`captures/` 中是否存在 fresh 的 `playlet-applet.dataeye.com/playlet/motionComic` 榜单请求；不会自动执行 GUI 点击，也不会自动导出 Charles HAR。探针显示 ready 后，再运行：

```bash
npm run dataeye:refresh-login
npm run dataeye:daily -- --login-env-file .env.local.dataeye
```

也可以不复制，直接用这份本地草稿做只读验证：

```bash
npm run capture:validate -- --login-env-file .env.local.dataeye
npm run collect:preview -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye
```

完整抓包流水线也支持同一个登录态文件参数，会传给 preflight 和 validate 两步：

```bash
npm run capture:pipeline -- --login-env-file .env.local.dataeye
npm run capture:pipeline -- --source dataeye --login-env-file .env.local.dataeye
npm run capture:pipeline -- --source hongguo --login-env-file .env.local.hongguo
```

如果希望导出 HAR/cURL 后自动分析，可以先运行：

```bash
npm run capture:watch
```

需要监听时同时复用本地登录态草稿，可以运行：

```bash
npm run capture:watch -- --login-env-file .env.local.dataeye
npm run capture:watch -- --source dataeye --login-env-file .env.local.dataeye
npm run capture:watch -- --source hongguo --login-env-file .env.local.hongguo
```

如果当前目标是刷新 DataEye 登录态，并在 fresh HAR 导出后自动完成预检和 daily gate，可以运行：

```bash
npm run capture:watch -- --source dataeye --login-env-file .env.local.dataeye --auto-refresh-login --auto-daily
```

这条命令不会操作 Charles/Proxyman GUI；它只监听 `captures/`。当你从 Charles/Proxyman 导出 fresh 的 `motionComic` HAR 后，它会先跑抓包流水线，再刷新 `.env.local.dataeye`，预检通过后按抓包里的最新榜期执行 `dataeye:daily`。如果抓包偏旧、预检失败或登录态失效，不会写入 live 数据。

流水线会生成 `docs/capture-material-audit.md` 和 `docs/ranking-preview.md`，用于检查材料完整度，并人工核对排名、作品名、热度值和类型是否与小程序页面一致。

如果抓包响应已经包含可映射榜单数组，可以先导入本地 SQLite 供页面查看。该方式只导入 HAR/JSON/cURL 中已有响应，不发起 live 请求，也不代表登录态已复现成功：

```bash
npm run capture:import -- --date 2026-06-05 --source dataeye
```

页面上也可以点击 `导入 DataEye / 剧查查抓包榜单` 执行同样的导入。导入后数据性质会显示为 `抓包导入`，与 `真实 live` 分开筛选。后续 live HTTP 复现仍必须先通过 `npm run capture:validate` 或 `npm run collect:preview`。

抓包验证通过后，也可单独生成采集器开发用的 API 规格草稿：

```bash
npm run capture:spec
```

## 飞书小说库

需求中的飞书表格地址：

```text
https://x0sgcptncj.feishu.cn/wiki/Cm9QwkKCsi7kSvk8ApFcMRY4nHc?from=from_copylink
```

当前 MVP 支持三种小说库导入方式：

- 页面按钮导入模拟数据，用于本地验证匹配链路。
- 将飞书表格导出为 CSV 或 JSON 后，用命令导入本地 SQLite。
- 通过飞书开放平台读取电子表格 range 后导入本地 SQLite。

CSV 支持以下中文表头：

```text
小说名称,短剧/漫剧名称,关系类型
```

也支持 JSON 数组：

```json
[
  {
    "novelName": "小说名称",
    "dramaTitle": "短剧/漫剧名称",
    "relationType": "exact"
  }
]
```

CSV/JSON 导入命令：

```bash
npm run novels:import -- --file ./data/novel-mappings.csv
```

飞书直连导入需要先在 `.env.local` 中配置飞书应用和实际电子表格信息。上方 Wiki 链接是知识库节点链接，不能直接替代 `FEISHU_SPREADSHEET_TOKEN`；请在飞书中打开实际电子表格后复制 spreadsheet token 和 sheet id。

```bash
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_TENANT_ACCESS_TOKEN=
FEISHU_SPREADSHEET_TOKEN=
FEISHU_SHEET_ID=
FEISHU_RANGE=A:D
```

如果已提供 `FEISHU_TENANT_ACCESS_TOKEN`，脚本会直接使用它；否则会用 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 获取 tenant access token。

飞书直连导入命令：

```bash
npm run novels:import:feishu
npm run novels:import:feishu -- --spreadsheet <spreadsheet_token> --sheet <sheet_id> --range A:D
```

也可以在 `/novels` 页面点击 `同步飞书表格`，页面会调用同一套服务端导入逻辑。缺少飞书配置时会显示明确错误，不会写入空映射。
如果 range 为空或表头不包含可识别的小说名、短剧/漫剧名字段，导入会失败并提示检查表头，不会把 `0` 条映射误报为同步成功。

导入后写入 `novel_mappings` 表，字段至少包括：

- 小说名称
- 短剧/漫剧名称
- 对应关系类型
- 来源标识

也可以在 `/novels` 页面直接填写小说名称和短剧/漫剧名称，保存单条映射；榜单页未匹配作品可点击 `去维护映射` 自动带入短剧/漫剧名称，并保留返回当前日期、来源和数据性质的榜单入口，方便保存后核对匹配结果。同一小说和同一短剧/漫剧重复保存会更新关系类型和来源，不会新增重复映射。列表中的已有映射可直接编辑或删除，删除后对应榜单会恢复为未匹配。

## 数据表

核心表：

- `ranking_entries`：榜单明细，包含来源、日期、排名、作品名、热度值、类型、来源标识、采集时间。
- `novel_mappings`：小说与短剧/漫剧映射。
- `collection_runs`：采集日志，记录成功、失败、插入数量和跳过数量。

## 当前限制

- DataEye / 剧查查真实采集接口和字段已通过 HAR 定位，并已完成 `2026-06-06` live 预检和落库；当前现有 HAR 登录态重新预检 `2026-06-06` 已显示过期，需要重新抓包或更新 `.env.local.dataeye` 后才能继续采集新日期。
- 已支持将 HAR 中的剧查查榜单响应导入为 `抓包导入` 数据，用于页面核对；它不等同于 live 采集成功。
- 红果真实采集已暂停推进；后续如需恢复，需要先确认榜单入口、请求参数和字段结构，抓包准备见 `docs/hongguo-capture-runbook.md`。
- 当前不做风控绕过，不硬编码登录态。
- 小说库支持飞书导出 CSV/JSON 导入，也支持通过飞书 OpenAPI 读取电子表格；但需要提供飞书应用凭证和实际电子表格 token。
- 匹配策略当前是精确匹配优先，已保留名称归一化和后续模糊匹配扩展位置。

## 验证

```bash
npm run lint
npm run test
npm run mvp:status
npm run capture:pipeline
npm run collect:preview -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye
npm run collect:live -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
npm run build
```

在未配置有效 `.env.local` 登录态时，`collect:preview` 和 `collect:live` 应明确提示缺少或失效的 DataEye 登录态；`collect:live` 会写失败运行报告，但不会插入真实榜单行。
