# 请求抓包分析

生成时间：2026-06-07T12:21:21.946Z

## 输入文件

- `captures/Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har`
- `captures/cURL-proxyman.txt`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har`
- `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har`

## 解析概览

| 项 | 数量 |
| --- | ---: |
| 输入文件 | 5 |
| 解析到的请求 | 50 |
| 疑似榜单请求 | 20 |
| 字段映射就绪请求 | 16 |
| 解析错误 | 0 |
| 来源过滤 | dataeye |



## 疑似榜单接口

### 候选 1: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har` |
| 请求 ID | `proxyman-dataeye-miniprogram-manhua-hot-20260607.har#0` |
| 捕获时间 | 2026-06-07T09:41:06.886Z |
| 距今 | 2.7 小时（可能需要重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

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

Payload:

```text
<empty>
```

首条榜单字段：

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

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.9亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","逆袭","剧情"] |

### 候选 2: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#11` |
| 捕获时间 | 2026-06-07T02:55:22.874Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

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
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.9亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","逆袭","剧情"] |

### 候选 3: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#10` |
| 捕获时间 | 2026-06-07T02:55:21.392Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

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
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.9亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","逆袭","剧情"] |

### 候选 4: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#13` |
| 捕获时间 | 2026-06-07T02:55:28.503Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3427485,
  "playletName": "弃子逆袭，从烂瓦房到商界大佬",
  "cover": "https://adxvideo.dataeye.com/900/b84141f6164f1db692f28fde26c9674a.jpeg?auth_key=<redacted>",
  "totalEpisode": 36,
  "playCount": "1.4亿",
  "playCountAdd": "1.4亿",
  "tags": "[\"种田\",\"逆袭\",\"乡村\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...hG-C\",\"nickname\":\"喜樂讲漫剧\",\"avatar\":\"https://adxvideo.dataeye.com/6013/390b83a624c769aa976ba7de3e08c055.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"4355...4176\",\"account\":\"4904...5256\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 1,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 弃子逆袭，从烂瓦房到商界大佬 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | ["种田","逆袭","乡村"] |

### 候选 5: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#12` |
| 捕获时间 | 2026-06-07T02:55:26.018Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3427485,
  "playletName": "弃子逆袭，从烂瓦房到商界大佬",
  "cover": "https://adxvideo.dataeye.com/900/b84141f6164f1db692f28fde26c9674a.jpeg?auth_key=<redacted>",
  "totalEpisode": 36,
  "playCount": "1.4亿",
  "playCountAdd": "1.4亿",
  "tags": "[\"种田\",\"逆袭\",\"乡村\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...hG-C\",\"nickname\":\"喜樂讲漫剧\",\"avatar\":\"https://adxvideo.dataeye.com/6013/390b83a624c769aa976ba7de3e08c055.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"4355...4176\",\"account\":\"4904...5256\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 1,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 弃子逆袭，从烂瓦房到商界大佬 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | ["种田","逆袭","乡村"] |

### 候选 6: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#32` |
| 捕获时间 | 2026-06-06T09:45:30.609Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3427485,
  "playletName": "弃子逆袭，从烂瓦房到商界大佬",
  "cover": "https://adxvideo.dataeye.com/900/b84141f6164f1db692f28fde26c9674a.jpeg?auth_key=<redacted>",
  "totalEpisode": 36,
  "playCount": "1.4亿",
  "playCountAdd": "1.4亿",
  "tags": "[\"种田\",\"逆袭\",\"乡村\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...hG-C\",\"nickname\":\"喜樂讲漫剧\",\"avatar\":\"https://adxvideo.dataeye.com/6013/390b83a624c769aa976ba7de3e08c055.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"4355...4176\",\"account\":\"4904...5256\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 1,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 弃子逆袭，从烂瓦房到商界大佬 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | ["种田","逆袭","乡村"] |

### 候选 7: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-04&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#33` |
| 捕获时间 | 2026-06-06T09:45:48.705Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 27 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3355124,
  "playletName": "金钱照冷暖",
  "cover": "https://adxvideo.dataeye.com/7936/f6e0dad80c9946bc548f99269b71ef43.jpeg?auth_key=<redacted>",
  "totalEpisode": 46,
  "playCount": "2.8亿",
  "playCountAdd": "1.3亿",
  "tags": "[\"都市日常\",\"现代\",\"剧情\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...Ehzx\",\"nickname\":\"云栖剧场\",\"avatar\":\"https://adxvideo.dataeye.com/4492/ca65d9be53e4c4860de61d28b2230ccb.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"2321...1975\",\"account\":\"meil...6677\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-01",
  "isNew": 0,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 金钱照冷暖 |
| `heatValue` | 是 | playCount | 2.8亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","剧情"] |

### 候选 8: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-06&rankType=1

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har` |
| 请求 ID | `Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har#0` |
| 捕获时间 | 2026-06-07T12:07:34.895Z |
| 距今 | 14 分钟（较新） |
| 评分 | 23 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 3 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept` | `*/*` |
| `accept-encoding` | `gzip, deflate, br` |
| `accept-language` | `zh-CN,zh;q=0.9` |
| `authentication` | `eyJh...UW4E` |
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

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3445732,
  "playletName": "烬九州",
  "cover": "https://adxvideo.dataeye.com/3777/9d6cc863ac084329a33cb55bab8bd541.jpeg?auth_key=<redacted>",
  "totalEpisode": 74,
  "playCount": "1.3亿",
  "playCountAdd": "1.3亿",
  "tags": "[\"古代\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...idqF\",\"nickname\":\"安风青灵漫影\",\"avatar\":\"https://adxvideo.dataeye.com/9362/2819fdbab375b5a31aabd50d984776e7.jpeg?auth_key=<redacted>\",\"userIdentity\":1,\"userId\":\"3402...3819\",\"account\":\"9363...1000\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-06",
  "isNew": 1,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 烬九州 |
| `heatValue` | 是 | playCount | 1.3亿 |
| `dramaType` | 是 | tags | ["古代"] |

### 候选 9: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=3

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#18` |
| 捕获时间 | 2026-06-06T09:45:16.284Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 23 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 3 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 1722996,
  "playletName": "李来福穿越1960年",
  "cover": "https://adxvideo.dataeye.com/2530/fff70c439d616346d7040e3bb6fe594b.jpeg?auth_key=<redacted>",
  "totalEpisode": 276,
  "playCount": "9.2亿",
  "playCountAdd": "317w",
  "tags": "[\"系统\",\"穿越\",\"乡村\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...qNAs\",\"nickname\":\"小山子动画\",\"avatar\":\"https://adxvideo.dataeye.com/1133/d85f3949965a964100dc7ae30ef46d5c.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"8096...5336\",\"account\":\"9769...2575\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2024-07-01",
  "isNew": 0,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 李来福穿越1960年 |
| `heatValue` | 是 | playCount | 9.2亿 |
| `dramaType` | 是 | tags | ["系统","穿越","乡村"] |

### 候选 10: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=2

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#13` |
| 捕获时间 | 2026-06-06T09:45:16.232Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 23 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 3 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3427485,
  "playletName": "弃子逆袭，从烂瓦房到商界大佬",
  "cover": "https://adxvideo.dataeye.com/900/b84141f6164f1db692f28fde26c9674a.jpeg?auth_key=<redacted>",
  "totalEpisode": 36,
  "playCount": "1.4亿",
  "playCountAdd": "1.4亿",
  "tags": "[\"种田\",\"逆袭\",\"乡村\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...hG-C\",\"nickname\":\"喜樂讲漫剧\",\"avatar\":\"https://adxvideo.dataeye.com/6013/390b83a624c769aa976ba7de3e08c055.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"4355...4176\",\"account\":\"4904...5256\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 1,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 弃子逆袭，从烂瓦房到商界大佬 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | ["种田","逆袭","乡村"] |

### 候选 11: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=1

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#15` |
| 捕获时间 | 2026-06-06T09:45:16.232Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 23 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 3 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3207707,
  "playletName": "地府成圣谁让他当阴差的第三季",
  "cover": "https://adxvideo.dataeye.com/8731/c2becbb8bb5f0bcd465f0b233d0f0fe2.jpeg?auth_key=<redacted>",
  "totalEpisode": 47,
  "playCount": "3746w",
  "playCountAdd": "3074w",
  "tags": "[\"系统\",\"穿越\",\"玄幻仙侠\",\"男频\"]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...vHzH\",\"nickname\":\"顽石\",\"avatar\":\"https://adxvideo.dataeye.com/3099/1620265ddd5f2031b9c9f9e4dd06e91f.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"3283...5405\",\"account\":\"8748...9434\"}]",
  "listDays": 1,
  "listDaysUnit": "日",
  "ranking": 1,
  "playletOnlineTime": "2026-06-04",
  "isNew": 0,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": "",
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 地府成圣谁让他当阴差的第三季 |
| `heatValue` | 是 | playCount | 3746w |
| `dramaType` | 是 | tags | ["系统","穿越","玄幻仙侠","男频"] |

### 候选 12: GET https://playlet-applet.dataeye.com/playlet/listHotRanking?pageId=1&pageSize=30&day=2026-06-06

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#7` |
| 捕获时间 | 2026-06-07T02:55:15.204Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 19 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "ranking": 1,
  "playletId": 3339891,
  "playletName": "你夺我股份，我断你专利",
  "relatedParty": null,
  "totalConsumeNum": 5005000,
  "consumeNum": 1227000,
  "newFlag": false,
  "topNum": 1,
  "coverOss": "https://adxvideo.dataeye.com/4653/5a3eb1a14bc51eb5d8b25248465db06a.jpeg?auth_key=<redacted>",
  "relatedPartyCompany": [
    "番茄"
  ],
  "contractorCompany": [
    "海鱼星空"
  ],
  "copyrightHolderCompany": [
    "海鱼星空"
  ],
  "playletTags": [
    "男频",
    null,
    "现代",
    "逆袭",
    "打脸虐渣",
    "都市日常",
    "总裁",
    "大男主"
  ],
  "unifiedPlayletId": null,
  "overseasPlayletName": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 你夺我股份，我断你专利 |
| `heatValue` | 是 | totalConsumeNum | 5005000 |
| `dramaType` | 是 | playletTags | 男频,,现代,逆袭,打脸虐渣,都市日常,总裁,大男主 |

### 候选 13: GET https://playlet-applet.dataeye.com/playlet/listHotRanking?pageId=1&pageSize=30&day=2026-06-05

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#26` |
| 捕获时间 | 2026-06-06T09:45:22.572Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 19 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "ranking": 1,
  "playletId": 3379171,
  "playletName": "苏太太高调离婚了",
  "relatedParty": null,
  "totalConsumeNum": 4115000,
  "consumeNum": 1106000,
  "newFlag": false,
  "topNum": 3,
  "coverOss": "https://adxvideo.dataeye.com/6905/4fe5a81ce03327e0b4cf152e59bd08f5.jpeg?auth_key=<redacted>",
  "relatedPartyCompany": [
    "番茄"
  ],
  "contractorCompany": [
    "杭州刚刚好影视"
  ],
  "copyrightHolderCompany": [
    "杭州刚刚好影视"
  ],
  "playletTags": [
    "女频",
    null,
    "现代",
    "逆袭",
    "打脸虐渣",
    "都市日常",
    "女性成长",
    "总裁",
    "大女主"
  ],
  "unifiedPlayletId": null,
  "overseasPlayletName": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 苏太太高调离婚了 |
| `heatValue` | 是 | totalConsumeNum | 4115000 |
| `dramaType` | 是 | playletTags | 女频,,现代,逆袭,打脸虐渣,都市日常,女性成长,总裁,大女主 |

### 候选 14: GET https://playlet-applet.dataeye.com/playlet/listHotRanking?pageId=1&pageSize=3&day=2026-06-05

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#19` |
| 捕获时间 | 2026-06-06T09:45:16.296Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 19 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 3 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "ranking": 1,
  "playletId": 3379171,
  "playletName": "苏太太高调离婚了",
  "relatedParty": null,
  "totalConsumeNum": 4115000,
  "consumeNum": 1106000,
  "newFlag": false,
  "topNum": 3,
  "coverOss": "https://adxvideo.dataeye.com/6905/4fe5a81ce03327e0b4cf152e59bd08f5.jpeg?auth_key=<redacted>",
  "relatedPartyCompany": [
    "番茄"
  ],
  "contractorCompany": [
    "杭州刚刚好影视"
  ],
  "copyrightHolderCompany": [
    "杭州刚刚好影视"
  ],
  "playletTags": [
    "女频",
    null,
    "现代",
    "逆袭",
    "打脸虐渣",
    "都市日常",
    "女性成长",
    "总裁",
    "大女主"
  ],
  "unifiedPlayletId": null,
  "overseasPlayletName": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 苏太太高调离婚了 |
| `heatValue` | 是 | totalConsumeNum | 4115000 |
| `dramaType` | 是 | playletTags | 女频,,现代,逆袭,打脸虐渣,都市日常,女性成长,总裁,大女主 |

### 候选 15: GET https://playlet-applet.dataeye.com/playlet/selectNativePlayletPlayCountListByDate?pageId=1&pageSize=30&day=2026-06-06

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#29` |
| 捕获时间 | 2026-06-06T09:45:26.500Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 18 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3424605,
  "playletName": "全家一起搬，商圈大换血",
  "cover": "https://adxvideo.dataeye.com/5104/9a8461a108ea05d32fa1d99d8dfbde13.jpeg?auth_key=<redacted>",
  "totalEpisode": 60,
  "playCount": "1.4亿",
  "playCountAdd": "1.2亿",
  "tags": "[]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...eY4q\",\"nickname\":\"佳思剧场\",\"avatar\":\"https://adxvideo.dataeye.com/9151/a30159c5f690a4f8a811355695b1776a.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"1319...9486\",\"account\":\"3157...4031\"}]",
  "listDays": 0,
  "listDaysUnit": "天",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 0,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": null,
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | [] |

### 候选 16: GET https://playlet-applet.dataeye.com/playlet/selectNativePlayletPlayCountListByDate?pageId=1&pageSize=3&day=2026-06-06

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#16` |
| 捕获时间 | 2026-06-06T09:45:16.232Z |
| 距今 | 1.1 天（建议重新抓取） |
| 评分 | 18 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...JA-Y` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `b03b...09c3` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a27) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "calculateDate": null,
  "playletId": 3424605,
  "playletName": "全家一起搬，商圈大换血",
  "cover": "https://adxvideo.dataeye.com/5104/9a8461a108ea05d32fa1d99d8dfbde13.jpeg?auth_key=<redacted>",
  "totalEpisode": 60,
  "playCount": "1.4亿",
  "playCountAdd": "1.2亿",
  "tags": "[]",
  "manufacturer": null,
  "playletUser": "[{\"secUid\":\"MS4w...eY4q\",\"nickname\":\"佳思剧场\",\"avatar\":\"https://adxvideo.dataeye.com/9151/a30159c5f690a4f8a811355695b1776a.jpeg?auth_key=<redacted>\",\"userIdentity\":0,\"userId\":\"1319...9486\",\"account\":\"3157...4031\"}]",
  "listDays": 0,
  "listDaysUnit": "天",
  "ranking": 1,
  "playletOnlineTime": "2026-06-05",
  "isNew": 0,
  "playletRelateList": null,
  "unifiedPlayletId": null,
  "overseasPlayletName": null,
  "platformList": null,
  "contractorList": null,
  "copyrightHolderList": null
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | [] |

### 候选 17: GET https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=animationHot

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#8` |
| 捕获时间 | 2026-06-07T02:55:21.318Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 19 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 1 |
| 字段映射就绪 | 否 |
| 缺失字段 | rank, heatValue, dramaType |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "id": 1,
  "title": "淘宝发布AI剧百万激励：最高50万元保底！百万播放最高20万奖金！登上DataEye这一榜单就有保底！",
  "articleUrl": "https://mp.weixin.qq.com/s/t3wcFjJCSo9SsotNx6P5WA",
  "policyDate": "2026-04-01",
  "coverImg": "https://adxvideo.dataeye.com/1685/7a95f007f826a6ea2930219029951a1e.webp?auth_key=<redacted>",
  "rankingDisplayTitle": "淘宝发布AI剧百万激励"
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 否 |  |  |
| `title` | 是 | title | 淘宝发布AI剧百万激励：最高50万元保底！百万播放最高20万奖金！登上DataEye这一榜单就有保底！ |
| `heatValue` | 否 |  |  |
| `dramaType` | 否 |  |  |

### 候选 18: GET https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#9` |
| 捕获时间 | 2026-06-07T02:55:21.318Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 8 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 否 |
| 榜单条数 | 未识别 |
| 字段映射就绪 | 否 |
| 缺失字段 | rank, title, heatValue, dramaType |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 否 |  |  |
| `title` | 否 |  |  |
| `heatValue` | 否 |  |  |
| `dramaType` | 否 |  |  |

### 候选 19: GET https://playlet-applet.dataeye.com/playlet/getHotRankingDate

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#5` |
| 捕获时间 | 2026-06-07T02:55:15.000Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 8 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 否 |
| 榜单条数 | 未识别 |
| 字段映射就绪 | 否 |
| 缺失字段 | rank, title, heatValue, dramaType |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 否 |  |  |
| `title` | 否 |  |  |
| `heatValue` | 否 |  |  |
| `dramaType` | 否 |  |  |

### 候选 20: GET https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=hot

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#4` |
| 捕获时间 | 2026-06-07T02:55:14.997Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| 评分 | 19 |
| HTTP 方法 | GET |
| 响应状态 | 200 |
| 包含 Cookie | 否 |
| 包含 Authorization | 否 |
| 包含 Token Header | 否 |
| 响应疑似榜单数组 | 是 |
| 榜单条数 | 3 |
| 字段映射就绪 | 否 |
| 缺失字段 | rank, heatValue, dramaType |

Headers:

| Header | 值 |
| --- | --- |
| `accept-encoding` | `gzip,compress,br,deflate` |
| `authentication` | `eyJh...AGVE` |
| `connection` | `keep-alive` |
| `content-type` | `application/json` |
| `host` | `playlet-applet.dataeye.com` |
| `loginuserid` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a29) NetType/WIFI Language/zh_CN` |

Payload:

```text
<empty>
```

首条榜单字段：

```json
{
  "id": 1,
  "title": "淘宝发布AI剧百万激励：最高50万元保底！百万播放最高20万奖金！登上DataEye这一榜单就有保底！",
  "articleUrl": "https://mp.weixin.qq.com/s/t3wcFjJCSo9SsotNx6P5WA",
  "policyDate": "2026-04-01",
  "coverImg": "https://adxvideo.dataeye.com/1685/7a95f007f826a6ea2930219029951a1e.webp?auth_key=<redacted>",
  "rankingDisplayTitle": "淘宝发布AI剧百万激励"
}
```

目标字段映射：

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 否 |  |  |
| `title` | 是 | title | 淘宝发布AI剧百万激励：最高50万元保底！百万播放最高20万奖金！登上DataEye这一榜单就有保底！ |
| `heatValue` | 否 |  |  |
| `dramaType` | 否 |  |  |


## 全部请求摘要

| 请求 ID | 评分 | 疑似榜单 | 方法 | 状态 | Cookie | Auth | Token | URL |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `proxyman-dataeye-miniprogram-manhua-hot-20260607.har#0` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#11` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#10` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#13` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#12` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#32` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#33` | 27 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-04&rankType=0 |
| `Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har#0` | 23 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-06&rankType=1 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#18` | 23 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=3 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#13` | 23 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=2 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#15` | 23 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=1 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#7` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/listHotRanking?pageId=1&pageSize=30&day=2026-06-06 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#26` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/listHotRanking?pageId=1&pageSize=30&day=2026-06-05 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#19` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/listHotRanking?pageId=1&pageSize=3&day=2026-06-05 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#14` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/listHongGuoRanking?pageId=1&pageSize=3&day=2026-06-06 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#5` | 10 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/listHongGuoRankingDate |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#29` | 18 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/selectNativePlayletPlayCountListByDate?pageId=1&pageSize=30&day=2026-06-06 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#16` | 18 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/selectNativePlayletPlayCountListByDate?pageId=1&pageSize=3&day=2026-06-06 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#8` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=animationHot |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#9` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#6` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/interactiveMsg/checkNotRead?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#5` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/getHotRankingDate |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#4` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=hot |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#3` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/login/getUserInfo?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#2` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/common/rankConfig/list |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#1` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/interactiveMsg/checkNotRead?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#0` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/login/getUserInfo?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#31` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#30` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=animationHot |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#28` | 11 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=DYHotPlay |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#27` | 4 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/getNativePlayCountDate |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#25` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/rankingPolicy/listByRankId?rankId=hot |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#23` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/getHotRankingDate |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#24` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/interactiveMsg/checkNotRead?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#22` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/login/getUserInfo?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#21` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/common/rankConfig/list |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#20` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/interactiveMsg/checkNotRead?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#17` | 5 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/login/getUserInfo?userSeqno=650985 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#12` | 11 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/popularContent/Hotlist |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#11` | 19 | 是 | POST | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/playletListV2 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#10` | 7 | 是 | POST | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/filmBase/listV2 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#7` | 19 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/actor/list?pageId=1&pageSize=10&sortType=1&actorType=1&from=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#9` | 9 | 是 | POST | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/banner/getBanners |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#8` | 7 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/activity/center/list?pageId=1&pageSize=2&type=1&range=1&from=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#6` | 17 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/getPlayletRevenueRankData?pageId=1&pageSize=3 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#4` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/getHotRankingDate |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#3` | 4 | 否 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/getNativePlayCountDate |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#1` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=2 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#2` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=1 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#0` | 8 | 是 | GET | 200 | 否 | 否 | 否 | https://playlet-applet.dataeye.com/playlet/motionComicDate?rankType=3 |

## 说明

- Cookie、Authorization、Token 等敏感值已掩码，只显示是否存在和前后 4 位。
- 该文档只做候选识别，不代表真实接口已经验证成功。
- 下一步运行 `npm run capture:validate`，脚本会尝试用最小 Header 集合复现候选请求。
