# 抓包材料质量审计

生成时间：2026-06-07T12:21:21.887Z

## 结论

抓包材料结构审计通过。仍需结合验证报告确认接口可复现。

## 概览

| 项 | 数量 |
| --- | ---: |
| 输入文件 | 5 |
| 解析请求 | 50 |
| 解析错误 | 0 |
| 疑似榜单请求 | 40 |
| 可映射榜单请求 | 17 |
| 审计问题 | 0 |

## 审计问题

无。

## 抓包新鲜度

| 请求 ID | 捕获时间 | 距今 | 提示 |
| --- | --- | --- | --- |
| `proxyman-dataeye-miniprogram-manhua-hot-20260607.har#0` | 2026-06-07T09:41:06.886Z | 2.7 小时 | 可能需要重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#11` | 2026-06-07T02:55:22.874Z | 9.4 小时 | 可能需要重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#10` | 2026-06-07T02:55:21.392Z | 9.4 小时 | 可能需要重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#13` | 2026-06-07T02:55:28.503Z | 9.4 小时 | 可能需要重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#12` | 2026-06-07T02:55:26.018Z | 9.4 小时 | 可能需要重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#32` | 2026-06-06T09:45:30.609Z | 1.1 天 | 建议重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#33` | 2026-06-06T09:45:48.705Z | 1.1 天 | 建议重新抓取 |
| `Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har#0` | 2026-06-07T12:07:34.895Z | 14 分钟 | 较新 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#18` | 2026-06-06T09:45:16.284Z | 1.1 天 | 建议重新抓取 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#13` | 2026-06-06T09:45:16.232Z | 1.1 天 | 建议重新抓取 |

## 输入文件

- `captures/Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har`
- `captures/cURL-proxyman.txt`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har`
- `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har`

## 解析错误

无。

## 说明

- Cookie、Authorization、Token、Session 可以脱敏。
- URL、Method、Header 名称、Content-Type、日期参数、分页参数、榜单类型、sign、timestamp 不能脱敏。
- 响应 JSON 字段名和至少一条榜单数据行不能脱敏。
- 该审计只判断材料完整度，不代表真实接口已经接入。
