# 如何提供抓包材料

本项目只用抓包材料验证真实榜单接口。请不要把 Cookie、Token、Session 写进代码；可以放入本地 `.env.local`，不要提交。

剧查查小程序「漫剧热播榜日榜」的专用抓包步骤见：

```text
docs/dataeye-miniprogram-capture-runbook.md
```

## 文件放置目录

请把 HAR、cURL、Network JSON、response JSON 放到项目根目录下：

```text
captures/
```

推荐文件命名：

```text
captures/dataeye-comic-YYYYMMDD.har
captures/hongguo-comic-YYYYMMDD.har
captures/dataeye-comic-list.curl
captures/hongguo-comic-list.curl
captures/hongguo-comic-response.json
captures/wechat-devtools-dataeye-comic.json
captures/charles-dataeye-comic-YYYYMMDD.har
captures/charles-hongguo-comic-YYYYMMDD.har
```

## Chrome DevTools 导出 HAR

1. 打开 Chrome，进入已登录的目标页面。
2. 按 `F12` 或右键选择 `检查`。
3. 打开 `Network` 面板。
4. 勾选 `Preserve log`。
5. 刷新页面，或重新选择榜单日期，让榜单请求重新发出。
6. 在 Network 搜索框中搜索关键词：
   - `ranking`
   - `HongGuo`
   - `playlet`
   - `comic`
   - `list`
7. 找到榜单列表请求后，右键请求，选择 `Save all as HAR with content`。
8. 保存到 `captures/` 目录。

注意：必须选择 `with content`，否则响应体可能为空，无法确认榜单字段。

## 微信开发者工具导出 Network 请求

1. 打开微信开发者工具。
2. 打开目标小程序页面。
3. 进入 `调试器` 的 `Network` 面板。
4. 勾选保留日志或清空后重新进入榜单页面。
5. 操作到目标榜单页，切换日期或刷新榜单。
6. 找到榜单列表请求和日期请求。
7. 右键复制请求信息，或导出 Network 记录。
8. 保存为 `.json` 或 `.txt` 文件放到 `captures/`。

如果工具支持复制为 cURL，优先复制为 cURL。

## Charles 导出抓包材料

Charles 适合抓小程序、App 或浏览器里不方便直接复制的请求。当前脚本读取 `.har`、`.json`、`.txt`、`.curl`，不要只提供 Charles 原生 `.chls` 文件。

### 准备

1. 打开 Charles。
2. 运行 `npm run capture:preflight`，确认本机 IP、Charles 端口和当前抓包材料状态。
3. 确认 `Proxy` -> `macOS Proxy` 已开启，或在 iPhone Wi-Fi 里手动配置代理。
4. 如果目标请求是 HTTPS，确认设备或电脑已经安装并信任 Charles Root Certificate。
5. 开始操作前，点击扫帚图标清空旧请求。
6. 打开目标页面，进入剧查查或红果漫剧日榜，切换日期或刷新榜单。

### 定位请求

在 Charles 左侧域名列表或上方 Filter 中搜索：

- `rank`
- `ranking`
- `list`
- `hot`
- `playlet`
- `comic`
- `hongguo`
- `dataeye`

优先找返回 JSON 的 `GET` 或 `POST` 请求。点开请求后重点看：

- `Request` -> `Headers`
- `Request` -> `Query String` 或 `Body`
- `Response` -> `JSON` / `Text`

### 导出 HAR

1. 在 Charles 中选中疑似榜单请求，或选中包含榜单操作的一段请求。
2. 选择 `File` -> `Export Session...`。
3. 格式选择 `HTTP Archive (.har)`。
4. 保存到：

```text
captures/charles-dataeye-comic-YYYYMMDD.har
captures/charles-hongguo-comic-YYYYMMDD.har
```

如果只能导出全部 Session，也可以保存完整 HAR，分析脚本会尝试自动筛选疑似榜单接口。

### 复制或保存单个请求

如果 Charles 版本支持复制 cURL：

1. 右键目标请求。
2. 选择 `Copy cURL Request` 或类似选项。
3. 保存为：

```text
captures/charles-dataeye-comic-list.curl
captures/charles-hongguo-comic-list.curl
```

如果不能复制 cURL，请手动把 URL、Method、Headers、Query、Body、Response 复制到 `.txt` 文件：

```text
captures/charles-dataeye-comic-list.txt
captures/charles-hongguo-comic-list.txt
```

注意：`.chls` 可以自己留作备份，但请额外导出 `.har`、`.curl`、`.json` 或 `.txt`，否则项目脚本无法解析。

剧查查小程序抓包导出前，可先按以下清单检查：

```text
docs/charles-export-checklist.md
```

## 复制目标请求为 cURL

### Chrome

1. 在 Network 面板找到榜单列表请求。
2. 右键请求。
3. 选择 `Copy` -> `Copy as cURL`。
4. 保存为：

```text
captures/hongguo-comic-list.curl
```

### 微信开发者工具

如果右键菜单支持复制 cURL，直接复制。否则请复制以下信息：

- URL
- Method
- Request Headers
- Query String Parameters
- Request Payload / Form Data
- Response

保存为 `.txt` 或 `.json` 放到 `captures/`。

## 必须提供的请求

至少需要两个请求：

1. 榜单日期接口
   - 用于确认可用日期字段，如 `day`、`week`、`month`。
2. 榜单列表接口
   - 必须包含真实榜单数组。
   - 必须能看到排名、作品名、热度、类型等字段。

如果只能先提供一个，请优先提供榜单列表接口。

## 可以脱敏的字段

这些字段可以脱敏，但建议同时在 `.env.local` 中提供真实值供本地验证：

- `Cookie`
- `Authorization`
- `authentication`
- `loginUserId`
- `S`
- `Token`
- `Session`
- `Set-Cookie`
- 用户 ID
- 手机号
- 邮箱
- 设备唯一 ID

脱敏示例：

```text
Cookie: SESSION=abcd...wxyz; tokenglobal=1234...7890
Authorization: Bearer abcd...wxyz
authentication: abcd...wxyz
loginUserId: 1234...7890
```

## 不能脱敏的字段

以下字段不能脱敏，否则无法复现请求：

- 请求 URL
- HTTP Method
- Header 名称
- Content-Type
- 请求体字段名
- 请求体中的日期参数
- 请求体中的分页参数
- 请求体中的排序参数
- `sign` 字段名和值
- `thisTimes` / timestamp 字段名和值
- 设备参数字段名和值
- 响应 JSON 的字段名
- 至少一条榜单数据行

如果 `sign` 或时间戳字段被脱敏，脚本无法判断签名规则是否可复用。

## `.env.local` 推荐格式

如果抓包里的敏感值已脱敏，请在项目根目录创建 `.env.local`，只保存在本机：

```bash
DATAEYE_AUTHENTICATION=
DATAEYE_LOGIN_USER_ID=
DATAEYE_S=
DATAEYE_REFERER=
DATAEYE_USER_AGENT=
DATAEYE_COOKIE=
DATAEYE_AUTHORIZATION=
DATAEYE_TOKEN=
HONGGUO_COOKIE=
HONGGUO_AUTHORIZATION=
HONGGUO_TOKEN=
```

脚本会优先用 `.env.local` 中的真实值替换抓包里的脱敏登录态。剧查查小程序当前已定位接口必填 `DATAEYE_AUTHENTICATION` 和 `DATAEYE_LOGIN_USER_ID`；Cookie / Authorization / Token 只在目标请求实际包含时需要。

## 运行完整流水线

推荐直接运行：

```bash
npm run capture:pipeline
```

输出：

```text
docs/capture-pipeline.md
```

流水线会依次执行预检、材料审计、分析、验证、榜单预览和 API 规格草稿生成。

也可以在抓包导出前启动监听：

```bash
npm run capture:watch
```

脚本会监听 `captures/`，发现新的 HAR、JSON、txt 或 curl 文件后自动运行流水线。

榜单预览输出：

```text
docs/capture-material-audit.md
docs/ranking-preview.md
```

## 单独运行分析

```bash
npm run capture:analyze
```

输出：

```text
docs/request-analysis.md
```

该文档会列出疑似榜单接口、Header 是否含 Cookie/Authorization/Token、payload 和响应字段。

## 单独运行验证

```bash
npm run capture:validate
```

输出：

```text
docs/request-validation.md
```

验证脚本会尝试用最小 Header 集合发起请求，并记录：

- HTTP 状态码
- 返回 JSON 结构
- 是否包含榜单数组
- 榜单条数
- 首条榜单字段

没有真实抓包或登录态时，脚本只会输出缺少材料，不会宣称接口验证成功。

## 抓包前预检

```bash
npm run capture:preflight
```

输出：

```text
docs/capture-preflight.md
```

预检会列出可填入 iPhone Wi-Fi 代理的本机 IP、Charles 端口是否可连接、当前 `/captures` 文件数量，以及 DataEye 登录态是否已配置。敏感值只显示掩码。

## 生成 API 规格草稿

当分析和验证报告都能证明候选接口包含可映射榜单数组后，运行：

```bash
npm run capture:spec
```

输出：

```text
docs/api-spec.md
```

该文档用于后续实现 `lib/collectors/live.js`，但它本身不代表真实采集器已经接入。
