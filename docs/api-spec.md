# 榜单 API 规格草稿

生成时间：2026-06-07T12:21:24.086Z

## 状态

已从抓包材料中生成候选 API 规格草稿。该文档仍需结合 `docs/request-validation.md` 确认当前登录态是否能复现榜单数组；只有验证通过后，才可将本次登录态视为可用于真实采集落库。

## 候选接口

| 项 | 内容 |
| --- | --- |
| 来源文件 | `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har` |
| 请求 ID | `proxyman-dataeye-miniprogram-manhua-hot-20260607.har#0` |
| HTTP 方法 | GET |
| URL | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| 抓包响应状态 | 200 |
| 评分 | 27 |
| 榜单条数 | 30 |
| 识别来源 | dataeye |
| 来源过滤 | dataeye |

## 请求 Header

| Header | 值 |
| --- | --- |
| `accept` | `*/*` |
| `accept-encoding` | `gzip, deflate, br` |
| `accept-language` | `zh-CN,zh;q=0.9` |
| `authentication` | `eyJh...kJ3Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `sec-fetch-dest` | `empty` |
| `sec-fetch-mode` | `cors` |
| `sec-fetch-site` | `cross-site` |
| `user-agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgra...<truncated>` |
| `xweb_xhr` | `1` |

## 请求 Payload

```text
<empty>
```

## 字段映射

| 目标字段 | 响应字段 | 样例 |
| --- | --- | --- |
| `rank` | `ranking` | `1` |
| `title` | `playletName` | `全家一起搬，商圈大换血` |
| `heatValue` | `playCount` | `1.9亿` |
| `dramaType` | `tags` | `["都市日常","现代","逆袭","剧情"]` |

## 首条榜单样例

```json
{
  "calculateDate": null,
  "playletId": 3424605,
  "playletName": "全家一起搬，商圈大换血",
  "cover": "https://adxvideo.dataeye.com/5104/9a8461a108ea05d32fa1d99d8dfbde13.jpeg?auth_key=<redacted>",
  "totalEpisode": 60,
  "playCount": "1.9亿",
  "playCountAdd": "1.6亿",
  "tags": "[\"都市日常\",\"现代\",\"逆袭\",\"剧情\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...eY4q\",\"nickname\":\"佳思剧场\",\"avatar\":\"https://adxvideo.dataeye.com/9151/a30159c5f690a4f8a811355695b1776a.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"1319...9486\",\"account\":\"3157...4031\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 0,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": [],
  "contractorList": [],
  "copyrightHolderList": [
    {
      "id": 52453,
      "publisherName": "杭州刚刚好影视",
      "name": "杭州刚刚好影视",
      "logo": null,
      "playletId": 3424605,
      "type": 3
    }
  ]
}
```

## 采集器落库映射

| 数据库字段 | 来源 |
| --- | --- |
| `source` | `dataeye` |
| `rankingDate` | API 日期参数，第一版由采集入参传入 |
| `rank` | `ranking` |
| `title` | `playletName` |
| `heatValue` | `playCount` |
| `dramaType` | `tags` |
| `sourceRef` | 请求 URL |
| `rawPayload` | 完整原始榜单条目 |

## 启用门槛

- `npm run capture:validate` 必须显示 HTTP 状态码为 2xx，且业务响应包含榜单数组。
- `docs/request-validation.md` 必须显示字段映射就绪，目标字段 `rank`、`title`、`heatValue`、`dramaType` 均可识别。
- CLI live 落库必须显式传入 `--confirmed-preview`；API live 落库必须传入 `confirmedPreview=true`。
- 如果 HTTP 为 2xx 但响应业务状态为登录失效、无权限或未返回榜单数组，仍然不得执行真实采集落库。
- 同一日期重复验证结果应稳定。
- 登录态只允许从 `.env.local` 或运行环境变量读取。
- 未满足以上条件时，不要宣称真实采集成功，也不要用失败响应落库。
