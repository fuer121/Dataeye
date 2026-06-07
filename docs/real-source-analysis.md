# 剧查查 / 红果漫剧日榜真实数据源分析

分析时间：2026-06-05
更新：2026-06-07

本文件记录真实接口来源、当前实现状态和仍未满足的启用条件。

## 结论

当前项目已经完成本地 MVP 数据链路，并基于 Charles HAR 定位到剧查查小程序「漫剧热播榜 + 日榜」接口。DataEye / 剧查查已在 `2026-06-06` 使用 `.env.local.dataeye` 完成 live 预检和真实落库验证。

- 页面默认仍可展示 `lib/collectors/sample.js` 的模拟数据，用于本地验证筛选和匹配链路。
- DataEye / 剧查查 live collector 已接入 `lib/collectors/live.js`，目标接口为 `https://playlet-applet.dataeye.com/playlet/motionComic`。
- 采集器只支持已抓包确认的「漫剧热播榜 + 日榜 + 指定日期」，固定 `rankType=0`，登录态只从环境变量读取。
- 当前已支持将 HAR 中的榜单响应导入 SQLite 并标记为 `capture` / `抓包导入`，用于页面核对真实抓包数据。
- 当前 `docs/request-validation.md` 显示已成功获取可映射疑似真实榜单数组，`.env.local.dataeye` 可用于 DataEye live 验证。
- DataEye `2026-06-06` live 已通过：`collect:preview` 返回 30 条，`collect:live` 已落库，重复执行同日采集会跳过重复 30 条。
- DataEye 当前使用现有 HAR 登录态重新预检 `2026-06-06` 未落库：接口返回 `DATAEYE_AUTH_EXPIRED` / `登录态已失效，请重新登录`，需要重新抓包并更新 `.env.local.dataeye` 后再采集新日期。
- 红果漫剧榜仍只有 ADXray 行业版候选接口线索，尚未获得可映射真实响应；当前暂停推进，不应实现或启用红果 live collector。

## 当前项目核对

| 项目 | 结论 |
| --- | --- |
| DataEye 抓包导入 | `npm run capture:import -- --date 2026-06-05 --source dataeye` 可将 HAR 响应导入为 `capture` 数据 |
| DataEye live 采集 | `lib/collectors/live.js` 已接入剧查查小程序 `motionComic`，`2026-06-06` 已通过 live 预检和落库 |
| 模拟采集 | `lib/collectors/sample.js` |
| 默认采集模式 | `lib/collectors/index.js` 中 `mode || "sample"` |
| 登录态配置 | `.env.example` 预留 `DATAEYE_AUTHENTICATION` / `DATAEYE_LOGIN_USER_ID` / `DATAEYE_S` 等变量 |
| 本地登录态 | `.env.local.dataeye` 已提供 DataEye 小程序登录态，本地文件被 `.gitignore` 忽略 |
| README 说明 | 真实采集需先 `collect:preview`，通过后再 `collect:live` 或页面/API 落库 |
| 最新登录态状态 | 现有 HAR 登录态对 `2026-06-06` 重新预检返回 401 登录态失效；失败不会插入 live 行 |

## 请求链路共性

以下链路来自 `https://adxray-app.dataeye.com` 的 Next.js 前端 bundle。

请求封装位于前端 chunk 模块 `61473`：

| 项 | 结论 |
| --- | --- |
| POST 封装 | `v_` |
| GET 封装 | `U2` |
| 实际请求前缀 | `/api` + 业务路径 |
| 请求体 | `application/x-www-form-urlencoded;charset=UTF-8` |
| Cookie | `credentials: "include"`，需要浏览器 Cookie |
| 固定 Header | `Content-Language`、`X-Request-With: XMLHttpRequest`、`S` |
| 签名参数 | POST 会追加 `thisTimes` 和 `sign` |
| 加密参数 | 榜单请求未发现额外加密参数；只发现签名参数 |

签名逻辑位于前端 chunk 模块 `25288`：

| 项 | 结论 |
| --- | --- |
| 参数处理 | 参数 key 排序 |
| 拼接方式 | `key=value&key2=value2...` |
| 签名算法 | 拼接固定 key 后 MD5 大写 |
| 是否可省略 | 不可省略，前端 POST 请求会带 |

注意：这些只是 Web 前端链路。若目标是“剧查查小程序”接口，还必须用微信开发者工具或抓包样本验证小程序请求链路。

## 1. DataEye / 剧查查漫剧日榜

### 定位状态

已通过 Charles HAR 定位到剧查查微信小程序真实榜单接口，抓包响应中包含截图对应日期的真实榜单数组。

| 项 | 内容 |
| --- | --- |
| 小程序页面 | 剧查查小程序 > 榜单 > 漫剧热播榜 > 日榜 |
| 抓包文件 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 榜单接口 | `GET https://playlet-applet.dataeye.com/playlet/motionComic` |
| 核心参数 | `pageId`、`pageSize`、`day`、`rankType=0` |
| 抓包日期样例 | `2026-06-06`、`2026-06-05`、`2026-06-04` |
| 字段映射 | `ranking`、`playletName`、`playCount`、`tags` |
| 当前 live 复现 | 已通过：`2026-06-06` DataEye live 预检 30 条并已落库 |
| 最新预检状态 | 现有 HAR 登录态对 `2026-06-06` 返回 `DATAEYE_AUTH_EXPIRED`，需重新抓包更新登录态 |

当前可执行的验证命令：

```bash
npm run capture:pipeline -- --source dataeye --login-env-file .env.local.dataeye
npm run capture:import -- --date 2026-06-05 --source dataeye
npm run collect:preview -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye
npm run collect:live -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
```

`capture:import` 只使用本地抓包响应，导入后页面数据性质显示为 `抓包导入`。DataEye live 采集必须先用当前有效登录态跑通 `collect:preview`，再显式执行 `collect:live --confirmed-preview`；登录态缺失、过期、接口无榜单数组或字段缺失时应失败并记录明确原因，不得写入模拟数据冒充 live 数据。

以下 ADXray 行业版页面线索仍保留为历史分析，不作为当前小程序采集器的数据源。

### 已验证页面和接口线索

#### 线索 A：短剧热力榜

| 项 | 内容 |
| --- | --- |
| 页面 URL | `https://adxray-app.dataeye.com/rank/playlet-popularity` |
| 页面标题 | `短剧热力榜` |
| 业务路径 | `/app/playlet/listHotRanking` |
| 完整请求 URL | `https://adxray-app.dataeye.com/api/app/playlet/listHotRanking` |
| 请求方式 | POST |
| 是否需要 Cookie | 是 |
| 是否需要 Token / Session | 是，依赖 Cookie 中登录态 |
| 是否需要签名 | 是，`thisTimes` + `sign` |
| 是否存在加密参数 | 未发现 |
| 分页参数 | `pageId`、`pageSize` |
| 日期参数 | `day` / `week` / `month` |
| 是否真实请求成功 | 否，未登录返回 `401 Unauthorized` |
| 是否拿到真实榜单数据 | 否 |
| 是否可认定为漫剧日榜 | 否。页面是短剧热力榜，不是已验证的漫剧日榜 |

前端字段线索：

| 目标字段 | 前端字段 |
| --- | --- |
| 排名 | `ranking` |
| 名称 | `playletName` / `highlightText` |
| 热度值 | `consumeNum` |
| 类型 | `playletTags` |
| 日期 | 请求参数 `day` / `week` / `month` |

#### 线索 B：短剧排行榜

| 项 | 内容 |
| --- | --- |
| 页面 URL | `https://adxray-app.dataeye.com/rank/playlet-flow` |
| 页面标题 | `短剧排行榜` |
| 业务路径 | `/app/playlet/listRanking` |
| 完整请求 URL | `https://adxray-app.dataeye.com/api/app/playlet/listRanking` |
| 请求方式 | POST |
| 是否需要 Cookie | 是 |
| 是否需要 Token / Session | 是，依赖 Cookie 中登录态 |
| 是否需要签名 | 是，`thisTimes` + `sign` |
| 是否存在加密参数 | 未发现 |
| 分页参数 | `pageId`、`pageSize` |
| 日期参数 | `day` / `week` / `month` |
| 排序参数 | `sortBy`，页面默认 `CREATIVE_COUNT` |
| 是否真实请求成功 | 否，未登录返回 `401 Unauthorized` |
| 是否拿到真实榜单数据 | 否 |
| 是否可认定为漫剧日榜 | 否。页面是短剧排行榜，没有验证到漫剧日榜筛选参数 |

前端字段线索：

| 目标字段 | 前端字段 |
| --- | --- |
| 排名 | `ranking` |
| 名称 | `playletName` / `highlightText` |
| 热度值 | 页面显示 `creativeCount` / `materialCount`，不是热度值 |
| 类型 | `playletTypes` |
| 日期 | 请求参数 `day` / `week` / `month` |

#### 线索 C：漫剧热播榜枚举

| 项 | 内容 |
| --- | --- |
| 枚举值 | `MOTION_COMIC_HOT_RANK` |
| 中文 | `漫剧热播榜` |
| 所在位置 | ADXray 行业版前端公共 chunk |
| 是否看到页面实际传参 | 否 |
| 是否看到成功响应 | 否 |
| 是否可作为真实接口 | 否，只能作为后续抓包验证线索 |

为了验证这个线索，尝试过以下未登录请求：

```bash
curl 'https://adxray-app.dataeye.com/api/app/playlet/listRanking' \
  -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8' \
  -H 'Content-Language: zh-cn' \
  -H 'X-Request-With: XMLHttpRequest' \
  -H 'S: <frontend-generated-s>' \
  --data 'pageId=1&pageSize=50&day=2026-06-05&sortBy=CREATIVE_COUNT&rankType=MOTION_COMIC_HOT_RANK&thisTimes=<timestamp>&sign=<md5-sign>'
```

返回：

```json
{"msg":"Unauthorized","statusCode":401}
```

这个请求只能证明接口需要登录态，不能证明 `rankType=MOTION_COMIC_HOT_RANK` 是正确参数。

### DataEye / 剧查查当前状态

1. 已完成：`.env.local.dataeye` 提供 `DATAEYE_AUTHENTICATION`、`DATAEYE_LOGIN_USER_ID`、`DATAEYE_S`、`DATAEYE_REFERER`、`DATAEYE_USER_AGENT`。
2. 已验证：`2026-06-06` live 预检返回 30 条，字段可映射到 `rank`、`title`、`heatValue`、`dramaType`。
3. 已落库：`2026-06-06` DataEye live 数据写入 `ranking_entries`，页面可通过 `/?date=2026-06-06&source=dataeye&dataKind=live` 查看。
4. 仍需注意：小程序登录态可能过期；过期后重新用 Charles 抓取 Header 并更新 `.env.local.dataeye`，再先跑 `collect:preview`。

## 2. 红果漫剧日榜

### 定位状态

已从 ADXray 行业版“红果漫剧榜”页面定位到真实页面使用的候选接口，但未登录请求未成功，未拿到真实榜单数据。

### 页面和接口

| 项 | 内容 |
| --- | --- |
| 页面 URL | `https://adxray-app.dataeye.com/rank/hongguo-comic` |
| 页面标题 | `红果漫剧榜` |
| 页面说明 | 热度和排名数据来自“红果免费漫剧”APP 内热播榜 |
| 日期业务路径 | `/app/playlet/listHongGuoComicsRankingDate` |
| 榜单业务路径 | `/app/playlet/listHongGuoComicsRanking` |
| 日期完整 URL | `https://adxray-app.dataeye.com/api/app/playlet/listHongGuoComicsRankingDate` |
| 榜单完整 URL | `https://adxray-app.dataeye.com/api/app/playlet/listHongGuoComicsRanking` |
| 请求方式 | POST |
| 是否需要 Cookie | 是 |
| 是否需要 Token / Session | 是，依赖 Cookie 中登录态 |
| 是否需要签名 | 是，`thisTimes` + `sign` |
| 是否存在加密参数 | 未发现 |
| 分页参数 | `pageId`、`pageSize` |
| 日期参数 | `day` / `week` / `month` |
| 搜索参数 | `searchKey` |
| 排序参数 | `sortBy`，页面默认 `MATERIAL_CNT` |
| 是否真实请求成功 | 否，未登录返回 `401 Unauthorized` |
| 是否拿到真实榜单数据 | 否 |

### 前端字段映射

字段来自 `rank/hongguo-comic` 页面表格渲染逻辑。

| 目标字段 | 前端字段 |
| --- | --- |
| 排名 | `ranking` |
| 短剧/漫剧名称 | `playletName` |
| 热度值 | `hotValue` |
| 类型 | `contentTypes` |
| 日期 | 请求参数 `day` / `week` / `month` |
| 集数 | `totalEpisode` |
| 承制方 | `contractorList` |
| 排名环比 | `rankChange` |
| 作品 ID | `playletId` / `playletNativeId` |

### 可复现的未登录请求示例

以下示例可以复现“接口存在但未登录无法取数”的结果。`S` 和 `sign` 需要按前端逻辑生成，下面用占位符表示。

```bash
curl 'https://adxray-app.dataeye.com/api/app/playlet/listHongGuoComicsRanking' \
  -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded;charset=UTF-8' \
  -H 'Content-Language: zh-cn' \
  -H 'X-Request-With: XMLHttpRequest' \
  -H 'S: <frontend-generated-s>' \
  -H 'Cookie: <DATAEYE_COOKIE>' \
  --data 'pageId=1&pageSize=50&sortBy=MATERIAL_CNT&day=<YYYY-MM-DD>&thisTimes=<timestamp>&sign=<md5-sign>'
```

未登录返回：

```json
{"msg":"Unauthorized","statusCode":401}
```

日期接口未登录请求也返回：

```json
{"msg":"Unauthorized","statusCode":401}
```

### 预期返回结构

没有拿到真实响应，所以下面只能写前端预期结构，不是已验证返回示例。

```json
{
  "statusCode": 200,
  "content": [
    {
      "ranking": 1,
      "playletName": "<作品名>",
      "hotValue": 123456,
      "contentTypes": ["<题材标签>"],
      "totalEpisode": 0,
      "contractorList": [],
      "rankChange": 0,
      "playletId": "<id>",
      "playletNativeId": "<native-id>"
    }
  ],
  "page": {
    "pageId": 1,
    "pageSize": 50,
    "totalRecords": 0
  }
}
```

## 已执行的未登录验证

所有请求均使用前端同类 POST 表单结构，带 `thisTimes`、`sign`、`S`，但不带真实 Cookie。

| 接口 | 结果 | 是否拿到榜单 |
| --- | --- | --- |
| `/api/app/playlet/getHotRankingDate` | `401 Unauthorized` | 否 |
| `/api/app/playlet/listHotRanking` | `401 Unauthorized` | 否 |
| `/api/app/playlet/listRanking` | `401 Unauthorized` | 否 |
| `/api/app/playlet/listRanking` + `rankType=MOTION_COMIC_HOT_RANK` | `401 Unauthorized` | 否 |
| `/api/app/playlet/getNewLabels` | `500 Internal Server Error` | 否 |
| `/api/app/playlet/listHongGuoComicsRankingDate` | `401 Unauthorized` | 否 |
| `/api/app/playlet/listHongGuoComicsRanking` | `401 Unauthorized` | 否 |
| `/api/app/playlet/listHongGuoRankingDate` | `401 Unauthorized` | 否 |
| `/api/app/playlet/listHongGuoRanking` | `401 Unauthorized` | 否 |

## 需要提供的抓包内容

要继续完成真实接口定位，需要提供以下任一类材料。

### DataEye / 剧查查漫剧日榜

请提供以下之一：

- 微信开发者工具中剧查查小程序“漫剧日榜”页面的 Network HAR；
- 或 Chrome DevTools 中 DataEye / ADXray 已登录账号打开目标榜单页面的 HAR；
- 或目标接口的 cURL。

最小内容：

- 榜单日期接口 URL、method、headers、payload、response；
- 榜单列表接口 URL、method、headers、payload、response；
- 至少一条真实榜单行，包含排名、名称、热度、类型、日期；
- Cookie/token 可脱敏，但 header 名、参数名和响应字段不能删。

### 红果漫剧日榜

请提供已登录状态下：

- `https://adxray-app.dataeye.com/rank/hongguo-comic` 的 Network HAR；
- 或 `listHongGuoComicsRankingDate` 和 `listHongGuoComicsRanking` 的 cURL；
- 或红果免费漫剧 APP / 小程序热播榜页面的 Network 样本。

最小内容同上。

## 当前不应继续做的事

- 不应把 `sample.js` 数据称为真实数据。
- 不应把 `MOTION_COMIC_HOT_RANK` 当作已验证接口参数。
- 不应把未登录 `401` 的接口写成采集器。
- 不应在代码中硬编码 Cookie、token 或 session。
- 不应绕过登录、验证码或风控。
