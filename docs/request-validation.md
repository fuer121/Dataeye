# 请求复现验证

生成时间：2026-06-07T12:21:23.905Z

## 结论

已成功获取可映射的疑似真实榜单数组，当前登录态可用于真实采集验证。

## 环境登录态

来源过滤：dataeye

环境文件：`.env.local.dataeye`（存在）

| 变量 | 状态 |
| --- | --- |
| DATAEYE_COOKIE | 未提供 |
| DATAEYE_AUTHORIZATION | 未提供 |
| DATAEYE_SESSION | 未提供 |
| DATAEYE_AUTHENTICATION | eyJh...UW4E |
| DATAEYE_LOGIN_USER_ID | <set> |
| DATAEYE_S | 4f44...b026 |
| DATAEYE_REFERER | 已提供 |
| DATAEYE_USER_AGENT | 已提供 |
| DATAEYE_TOKEN | 未提供 |
| HONGGUO_COOKIE | 未提供 |
| HONGGUO_AUTHORIZATION | 未提供 |
| HONGGUO_SESSION | 未提供 |
| HONGGUO_TOKEN | 未提供 |

## 验证结果

### 尝试 1: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har` |
| 请求 ID | `proxyman-dataeye-miniprogram-manhua-hot-20260607.har#0` |
| 捕获时间 | 2026-06-07T09:41:06.886Z |
| 距今 | 2.7 小时（可能需要重新抓取） |
| HTTP 状态码 | 200 |
| 状态文本 |  |
| 耗时 | 292 ms |
| 原始请求含脱敏敏感值 | 否 |
| 是否包含榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

最小 Header:

| Header | 值 |
| --- | --- |
| `accept` | `*/*` |
| `authentication` | `eyJh...UW4E` |
| `content-type` | `application/json` |
| `loginuserid` | `<set>` |
| `loginUserId` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `S` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgra...<truncated>` |

响应 JSON 结构:

```json
{
  "statusCode": "number",
  "page": {
    "pageId": "number",
    "pageSize": "number",
    "totalRecords": "number"
  },
  "content": [
    "array(30)",
    {
      "calculateDate": "object",
      "playletId": "number",
      "playletName": "string",
      "cover": "string",
      "totalEpisode": "number",
      "playCount": "string",
      "playCountAdd": "string",
      "tags": "string",
      "manufacturer": "object",
      "playletUser": "string",
      "listDays": "number",
      "listDaysUnit": "string",
      "ranking": "number",
      "playletOnlineTime": "string",
      "isNew": "number",
      "playletRelateList": "object",
      "unifiedPlayletId": "object",
      "overseasPlayletName": "string",
      "platformList": [
        "array(0)",
        null
      ],
      "contractorList": [
        "array(0)",
        null
      ],
      "copyrightHolderList": [
        "array(1)",
        {
          "id": "number",
          "publisherName": "string",
          "name": "string",
          "logo": "object",
          "playletId": "number",
          "type": "number"
        }
      ]
    }
  ],
  "message": "object"
}
```

首条榜单字段:

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

目标字段映射:

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.9亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","逆袭","剧情"] |

响应片段:

```text
{"statusCode":200,"page":{"pageId":1,"pageSize":30,"totalRecords":111634},"content":[{"calculateDate":null,"playletId":3424605,"playletName":"全家一起搬，商圈大换血","cover":"https://adxvideo.dataeye.com/5104/9a8461a108ea05d32fa1d99d8dfbde13.jpeg?auth_key=<redacted>","totalEpisode":60,"playCount":"1.9亿","playCountAdd":"1.6亿","tags":"[\"都市日常\",\"现代\",\"逆袭\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...eY4q\",\"nickname\":\"佳思剧场\",\"avatar\":\"https://adxvideo.dataeye.com/9151/a30159c5f690a4f8a811355695b1776a.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"1319...9486\",\"account\":\"3157...4031\"}]","listDays":1,"listDaysUnit":"日","ranking":1,"playletOnlineTime":"2026-06-05","isNew":0,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":[],"contractorList":[],"copyrightHolderList":[{"id":52453,"publisherName":"杭州刚刚好影视","name":"杭州刚刚好影视","logo":null,"playletId":3424605,"type":3}]},{"calculateDate":null,"playletId":3445732,"playletName":"烬九州","cover":"https://adxvideo.dataeye.com/7910/06f3e09dfbefd758aa485d1a0748ea8b.jpeg?auth_key=<redacted>","totalEpisode":115,"playCount":"1.3亿","playCountAdd":"1.3亿","tags":"[\"古代\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...idqF\",\"nickname\":\"安风青灵漫影\",\"avatar\":\"https://adxvideo.dataeye.com/9362/2819fdbab375b5a31aabd50d984776e7.jpeg?auth_key=<redacted>",\"userIdentity\":1,\"userId\":\"3402...3819\",\"account\":\"9363...1000\"}]","listDays":null,"listDaysUnit":"天","ranking":2,"playletOnlineTime":"2026-06-06","isNew":1,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3425330,"playletName":"仙祖归来：修仙满级回来后，我儿孙满堂了","cover":"https://adxvideo.dataeye.com/2933/1b28ce355d2344c27dc9ad7a4f0e92d5.jpeg?auth_key=<redacted>","totalEpisode":66,"playCount":"1.4亿","playCountAdd":"1.2亿","tags":"[\"都市日常\",\"现代\",\"穿越\",\"奇幻脑洞\"]","manufacturer":null,"pla...<truncated>
```

### 尝试 2: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#11` |
| 捕获时间 | 2026-06-07T02:55:22.874Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| HTTP 状态码 | 200 |
| 状态文本 |  |
| 耗时 | 70 ms |
| 原始请求含脱敏敏感值 | 否 |
| 是否包含榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

最小 Header:

| Header | 值 |
| --- | --- |
| `authentication` | `eyJh...UW4E` |
| `content-type` | `application/json` |
| `loginuserid` | `<set>` |
| `loginUserId` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `S` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgra...<truncated>` |

响应 JSON 结构:

```json
{
  "statusCode": "number",
  "page": {
    "pageId": "number",
    "pageSize": "number",
    "totalRecords": "number"
  },
  "content": [
    "array(30)",
    {
      "calculateDate": "object",
      "playletId": "number",
      "playletName": "string",
      "cover": "string",
      "totalEpisode": "number",
      "playCount": "string",
      "playCountAdd": "string",
      "tags": "string",
      "manufacturer": "object",
      "playletUser": "string",
      "listDays": "number",
      "listDaysUnit": "string",
      "ranking": "number",
      "playletOnlineTime": "string",
      "isNew": "number",
      "playletRelateList": "object",
      "unifiedPlayletId": "object",
      "overseasPlayletName": "string",
      "platformList": [
        "array(0)",
        null
      ],
      "contractorList": [
        "array(0)",
        null
      ],
      "copyrightHolderList": [
        "array(1)",
        {
          "id": "number",
          "publisherName": "string",
          "name": "string",
          "logo": "object",
          "playletId": "number",
          "type": "number"
        }
      ]
    }
  ],
  "message": "object"
}
```

首条榜单字段:

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

目标字段映射:

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.9亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","逆袭","剧情"] |

响应片段:

```text
{"statusCode":200,"page":{"pageId":1,"pageSize":30,"totalRecords":111634},"content":[{"calculateDate":null,"playletId":3424605,"playletName":"全家一起搬，商圈大换血","cover":"https://adxvideo.dataeye.com/5104/9a8461a108ea05d32fa1d99d8dfbde13.jpeg?auth_key=<redacted>","totalEpisode":60,"playCount":"1.9亿","playCountAdd":"1.6亿","tags":"[\"都市日常\",\"现代\",\"逆袭\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...eY4q\",\"nickname\":\"佳思剧场\",\"avatar\":\"https://adxvideo.dataeye.com/9151/a30159c5f690a4f8a811355695b1776a.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"1319...9486\",\"account\":\"3157...4031\"}]","listDays":1,"listDaysUnit":"日","ranking":1,"playletOnlineTime":"2026-06-05","isNew":0,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":[],"contractorList":[],"copyrightHolderList":[{"id":52453,"publisherName":"杭州刚刚好影视","name":"杭州刚刚好影视","logo":null,"playletId":3424605,"type":3}]},{"calculateDate":null,"playletId":3445732,"playletName":"烬九州","cover":"https://adxvideo.dataeye.com/7910/06f3e09dfbefd758aa485d1a0748ea8b.jpeg?auth_key=<redacted>","totalEpisode":115,"playCount":"1.3亿","playCountAdd":"1.3亿","tags":"[\"古代\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...idqF\",\"nickname\":\"安风青灵漫影\",\"avatar\":\"https://adxvideo.dataeye.com/9362/2819fdbab375b5a31aabd50d984776e7.jpeg?auth_key=<redacted>",\"userIdentity\":1,\"userId\":\"3402...3819\",\"account\":\"9363...1000\"}]","listDays":null,"listDaysUnit":"天","ranking":2,"playletOnlineTime":"2026-06-06","isNew":1,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3425330,"playletName":"仙祖归来：修仙满级回来后，我儿孙满堂了","cover":"https://adxvideo.dataeye.com/2933/1b28ce355d2344c27dc9ad7a4f0e92d5.jpeg?auth_key=<redacted>","totalEpisode":66,"playCount":"1.4亿","playCountAdd":"1.2亿","tags":"[\"都市日常\",\"现代\",\"穿越\",\"奇幻脑洞\"]","manufacturer":null,"pla...<truncated>
```

### 尝试 3: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#10` |
| 捕获时间 | 2026-06-07T02:55:21.392Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| HTTP 状态码 | 200 |
| 状态文本 |  |
| 耗时 | 69 ms |
| 原始请求含脱敏敏感值 | 否 |
| 是否包含榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

最小 Header:

| Header | 值 |
| --- | --- |
| `authentication` | `eyJh...UW4E` |
| `content-type` | `application/json` |
| `loginuserid` | `<set>` |
| `loginUserId` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `S` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgra...<truncated>` |

响应 JSON 结构:

```json
{
  "statusCode": "number",
  "page": {
    "pageId": "number",
    "pageSize": "number",
    "totalRecords": "number"
  },
  "content": [
    "array(30)",
    {
      "calculateDate": "object",
      "playletId": "number",
      "playletName": "string",
      "cover": "string",
      "totalEpisode": "number",
      "playCount": "string",
      "playCountAdd": "string",
      "tags": "string",
      "manufacturer": "object",
      "playletUser": "string",
      "listDays": "number",
      "listDaysUnit": "string",
      "ranking": "number",
      "playletOnlineTime": "string",
      "isNew": "number",
      "playletRelateList": "object",
      "unifiedPlayletId": "object",
      "overseasPlayletName": "string",
      "platformList": [
        "array(0)",
        null
      ],
      "contractorList": [
        "array(0)",
        null
      ],
      "copyrightHolderList": [
        "array(1)",
        {
          "id": "number",
          "publisherName": "string",
          "name": "string",
          "logo": "object",
          "playletId": "number",
          "type": "number"
        }
      ]
    }
  ],
  "message": "object"
}
```

首条榜单字段:

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

目标字段映射:

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 全家一起搬，商圈大换血 |
| `heatValue` | 是 | playCount | 1.9亿 |
| `dramaType` | 是 | tags | ["都市日常","现代","逆袭","剧情"] |

响应片段:

```text
{"statusCode":200,"page":{"pageId":1,"pageSize":30,"totalRecords":111634},"content":[{"calculateDate":null,"playletId":3424605,"playletName":"全家一起搬，商圈大换血","cover":"https://adxvideo.dataeye.com/5104/9a8461a108ea05d32fa1d99d8dfbde13.jpeg?auth_key=<redacted>","totalEpisode":60,"playCount":"1.9亿","playCountAdd":"1.6亿","tags":"[\"都市日常\",\"现代\",\"逆袭\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...eY4q\",\"nickname\":\"佳思剧场\",\"avatar\":\"https://adxvideo.dataeye.com/9151/a30159c5f690a4f8a811355695b1776a.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"1319...9486\",\"account\":\"3157...4031\"}]","listDays":1,"listDaysUnit":"日","ranking":1,"playletOnlineTime":"2026-06-05","isNew":0,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":[],"contractorList":[],"copyrightHolderList":[{"id":52453,"publisherName":"杭州刚刚好影视","name":"杭州刚刚好影视","logo":null,"playletId":3424605,"type":3}]},{"calculateDate":null,"playletId":3445732,"playletName":"烬九州","cover":"https://adxvideo.dataeye.com/7910/06f3e09dfbefd758aa485d1a0748ea8b.jpeg?auth_key=<redacted>","totalEpisode":115,"playCount":"1.3亿","playCountAdd":"1.3亿","tags":"[\"古代\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...idqF\",\"nickname\":\"安风青灵漫影\",\"avatar\":\"https://adxvideo.dataeye.com/9362/2819fdbab375b5a31aabd50d984776e7.jpeg?auth_key=<redacted>",\"userIdentity\":1,\"userId\":\"3402...3819\",\"account\":\"9363...1000\"}]","listDays":null,"listDaysUnit":"天","ranking":2,"playletOnlineTime":"2026-06-06","isNew":1,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3425330,"playletName":"仙祖归来：修仙满级回来后，我儿孙满堂了","cover":"https://adxvideo.dataeye.com/2933/1b28ce355d2344c27dc9ad7a4f0e92d5.jpeg?auth_key=<redacted>","totalEpisode":66,"playCount":"1.4亿","playCountAdd":"1.2亿","tags":"[\"都市日常\",\"现代\",\"穿越\",\"奇幻脑洞\"]","manufacturer":null,"pla...<truncated>
```

### 尝试 4: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#13` |
| 捕获时间 | 2026-06-07T02:55:28.503Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| HTTP 状态码 | 200 |
| 状态文本 |  |
| 耗时 | 846 ms |
| 原始请求含脱敏敏感值 | 否 |
| 是否包含榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

最小 Header:

| Header | 值 |
| --- | --- |
| `authentication` | `eyJh...UW4E` |
| `content-type` | `application/json` |
| `loginuserid` | `<set>` |
| `loginUserId` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `S` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgra...<truncated>` |

响应 JSON 结构:

```json
{
  "statusCode": "number",
  "page": {
    "pageId": "number",
    "pageSize": "number",
    "totalRecords": "number"
  },
  "content": [
    "array(30)",
    {
      "calculateDate": "object",
      "playletId": "number",
      "playletName": "string",
      "cover": "string",
      "totalEpisode": "number",
      "playCount": "string",
      "playCountAdd": "string",
      "tags": "string",
      "manufacturer": "object",
      "playletUser": "string",
      "listDays": "number",
      "listDaysUnit": "string",
      "ranking": "number",
      "playletOnlineTime": "string",
      "isNew": "number",
      "playletRelateList": "object",
      "unifiedPlayletId": "object",
      "overseasPlayletName": "string",
      "platformList": "object",
      "contractorList": "object",
      "copyrightHolderList": "object"
    }
  ],
  "message": "object"
}
```

首条榜单字段:

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

目标字段映射:

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 弃子逆袭，从烂瓦房到商界大佬 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | ["种田","逆袭","乡村"] |

响应片段:

```text
{"statusCode":200,"page":{"pageId":1,"pageSize":30,"totalRecords":110403},"content":[{"calculateDate":null,"playletId":3427485,"playletName":"弃子逆袭，从烂瓦房到商界大佬","cover":"https://adxvideo.dataeye.com/900/b84141f6164f1db692f28fde26c9674a.jpeg?auth_key=<redacted>","totalEpisode":36,"playCount":"1.4亿","playCountAdd":"1.4亿","tags":"[\"种田\",\"逆袭\",\"乡村\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...hG-C\",\"nickname\":\"喜樂讲漫剧\",\"avatar\":\"https://adxvideo.dataeye.com/6013/390b83a624c769aa976ba7de3e08c055.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"4355...4176\",\"account\":\"4904...5256\"}]","listDays":1,"listDaysUnit":"日","ranking":1,"playletOnlineTime":"2026-06-05","isNew":1,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3360799,"playletName":"免费代收三年，停办后全小区求我开门","cover":"https://adxvideo.dataeye.com/8275/48995eb0ac6f77fb074305c36081e109.jpeg?auth_key=<redacted>","totalEpisode":31,"playCount":"3.6亿","playCountAdd":"1.0亿","tags":"[\"都市日常\",\"现代\",\"逆袭\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...31_y\",\"nickname\":\"随心漫\",\"avatar\":\"https://adxvideo.dataeye.com/4466/888ea9f3c3530a6d6ad7b009f7141a66.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"2191...0665\",\"account\":\"7382...7391\"}]","listDays":null,"listDaysUnit":"天","ranking":2,"playletOnlineTime":"2026-06-03","isNew":0,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3410435,"playletName":"这杯咖啡，你喝不起","cover":"https://adxvideo.dataeye.com/8774/e4472f1bef5dea4b8bc195793eaf32f5.jpeg?auth_key=<redacted>","totalEpisode":46,"playCount":"1.3亿","playCountAdd":"1.0亿","tags":"[\"都市日常\",\"现代\",\"职场\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...OgIm\",\"nickname\":\"碎梦短剧\",\"avatar\":\"...<truncated>
```

### 尝试 5: GET https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0

| 项 | 内容 |
| --- | --- |
| 来源 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#12` |
| 捕获时间 | 2026-06-07T02:55:26.018Z |
| 距今 | 9.4 小时（可能需要重新抓取） |
| HTTP 状态码 | 200 |
| 状态文本 |  |
| 耗时 | 611 ms |
| 原始请求含脱敏敏感值 | 否 |
| 是否包含榜单数组 | 是 |
| 榜单条数 | 30 |
| 字段映射就绪 | 是 |
| 缺失字段 | 无 |

最小 Header:

| Header | 值 |
| --- | --- |
| `authentication` | `eyJh...UW4E` |
| `content-type` | `application/json` |
| `loginuserid` | `<set>` |
| `loginUserId` | `<set>` |
| `referer` | `https://servicewechat.com/wxa4d39034d8eeffe7/225/page-frame.html` |
| `s` | `4f44...b026` |
| `S` | `4f44...b026` |
| `user-agent` | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgra...<truncated>` |

响应 JSON 结构:

```json
{
  "statusCode": "number",
  "page": {
    "pageId": "number",
    "pageSize": "number",
    "totalRecords": "number"
  },
  "content": [
    "array(30)",
    {
      "calculateDate": "object",
      "playletId": "number",
      "playletName": "string",
      "cover": "string",
      "totalEpisode": "number",
      "playCount": "string",
      "playCountAdd": "string",
      "tags": "string",
      "manufacturer": "object",
      "playletUser": "string",
      "listDays": "number",
      "listDaysUnit": "string",
      "ranking": "number",
      "playletOnlineTime": "string",
      "isNew": "number",
      "playletRelateList": "object",
      "unifiedPlayletId": "object",
      "overseasPlayletName": "string",
      "platformList": "object",
      "contractorList": "object",
      "copyrightHolderList": "object"
    }
  ],
  "message": "object"
}
```

首条榜单字段:

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

目标字段映射:

| 目标字段 | 是否识别 | 响应字段 | 样例 |
| --- | --- | --- | --- |
| `rank` | 是 | ranking | 1 |
| `title` | 是 | playletName | 弃子逆袭，从烂瓦房到商界大佬 |
| `heatValue` | 是 | playCount | 1.4亿 |
| `dramaType` | 是 | tags | ["种田","逆袭","乡村"] |

响应片段:

```text
{"statusCode":200,"page":{"pageId":1,"pageSize":30,"totalRecords":110403},"content":[{"calculateDate":null,"playletId":3427485,"playletName":"弃子逆袭，从烂瓦房到商界大佬","cover":"https://adxvideo.dataeye.com/900/b84141f6164f1db692f28fde26c9674a.jpeg?auth_key=<redacted>","totalEpisode":36,"playCount":"1.4亿","playCountAdd":"1.4亿","tags":"[\"种田\",\"逆袭\",\"乡村\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...hG-C\",\"nickname\":\"喜樂讲漫剧\",\"avatar\":\"https://adxvideo.dataeye.com/6013/390b83a624c769aa976ba7de3e08c055.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"4355...4176\",\"account\":\"4904...5256\"}]","listDays":1,"listDaysUnit":"日","ranking":1,"playletOnlineTime":"2026-06-05","isNew":1,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3360799,"playletName":"免费代收三年，停办后全小区求我开门","cover":"https://adxvideo.dataeye.com/8275/48995eb0ac6f77fb074305c36081e109.jpeg?auth_key=<redacted>","totalEpisode":31,"playCount":"3.6亿","playCountAdd":"1.0亿","tags":"[\"都市日常\",\"现代\",\"逆袭\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...31_y\",\"nickname\":\"随心漫\",\"avatar\":\"https://adxvideo.dataeye.com/4466/888ea9f3c3530a6d6ad7b009f7141a66.jpeg?auth_key=<redacted>",\"userIdentity\":0,\"userId\":\"2191...0665\",\"account\":\"7382...7391\"}]","listDays":null,"listDaysUnit":"天","ranking":2,"playletOnlineTime":"2026-06-03","isNew":0,"playletRelateList":null,"unifiedPlayletId":null,"overseasPlayletName":"","platformList":null,"contractorList":null,"copyrightHolderList":null},{"calculateDate":null,"playletId":3410435,"playletName":"这杯咖啡，你喝不起","cover":"https://adxvideo.dataeye.com/8774/e4472f1bef5dea4b8bc195793eaf32f5.jpeg?auth_key=<redacted>","totalEpisode":46,"playCount":"1.3亿","playCountAdd":"1.0亿","tags":"[\"都市日常\",\"现代\",\"职场\",\"剧情\"]","manufacturer":null,"playletUser":"[{\"secUid\":\"MS4w...OgIm\",\"nickname\":\"碎梦短剧\",\"avatar\":\"...<truncated>
```


## 失败排查

已拿到可映射榜单数组，可基于本次结果整理 `docs/api-spec.md` 并进入采集器开发。
