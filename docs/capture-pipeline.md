# 抓包流水线总览

生成时间：2026-06-07T12:21:24.106Z

## 结论

已识别抓包响应中的可映射榜单候选，但候选抓包可能已经偏旧。建议重新抓取新鲜 HAR，再验证 live HTTP 复现。

## 执行步骤

| 步骤 | 命令 | 状态 | 耗时 |
| --- | --- | ---: | ---: |
| preflight | `node scripts/capture-preflight.js --login-env-file .env.local.dataeye` | 0 | 69 ms |
| audit | `node scripts/audit-capture-material.js` | 0 | 63 ms |
| analyze | `node scripts/analyze-capture.js --source dataeye` | 0 | 68 ms |
| validate | `node scripts/validate-request.js --login-env-file .env.local.dataeye --source dataeye` | 0 | 1975 ms |
| preview | `node scripts/extract-ranking-preview.js --source dataeye` | 0 | 92 ms |
| spec | `node scripts/generate-api-spec.js --source dataeye` | 0 | 70 ms |

## 抓包材料

| 项 | 数量 |
| --- | ---: |
| 输入文件 | 5 |
| 解析请求 | 50 |
| 解析错误 | 0 |
| 可映射榜单候选 | 16 |
| 材料审计问题 | 0 |
| 来源过滤 | dataeye |

- `captures/Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har`
- `captures/cURL-proxyman.txt`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har`
- `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har`

## 登录态文件

.env.local.dataeye（存在）

## 来源过滤

dataeye

## 抓包新鲜度

| 请求 ID | 捕获时间 | 距今 | 提示 | URL |
| --- | --- | --- | --- | --- |
| `proxyman-dataeye-miniprogram-manhua-hot-20260607.har#0` | 2026-06-07T09:41:06.886Z | 2.7 小时 | 可能需要重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#11` | 2026-06-07T02:55:22.874Z | 9.4 小时 | 可能需要重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#10` | 2026-06-07T02:55:21.392Z | 9.4 小时 | 可能需要重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#13` | 2026-06-07T02:55:28.503Z | 9.4 小时 | 可能需要重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#12` | 2026-06-07T02:55:26.018Z | 9.4 小时 | 可能需要重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#32` | 2026-06-06T09:45:30.609Z | 1.1 天 | 建议重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#33` | 2026-06-06T09:45:48.705Z | 1.1 天 | 建议重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-04&rankType=0 |
| `Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har#0` | 2026-06-07T12:07:34.895Z | 14 分钟 | 较新 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-06&rankType=1 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#18` | 2026-06-06T09:45:16.284Z | 1.1 天 | 建议重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=3 |
| `charles-dataeye-miniprogram-manhua-hot-20260606.har#13` | 2026-06-06T09:45:16.232Z | 1.1 天 | 建议重新抓取 | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=3&day=2026-06-05&rankType=2 |

## 下一步

- 当前可映射榜单候选的抓包时间可能偏旧，优先重新抓取剧查查小程序「漫剧热播榜 + 日榜」HAR。
- 新 HAR 放入 `captures/` 后重新运行 `npm run capture:pipeline`。
- 如确认为新鲜登录态，再运行 `npm run capture:env -- --write-local` 和 `npm run collect:preview -- --date <日期> --source dataeye --login-env-file .env.local.dataeye`。

## 相关报告

- `docs/capture-preflight.md`
- `docs/capture-material-audit.md`
- `docs/request-analysis.md`
- `docs/request-validation.md`
- `docs/ranking-preview.md`
- `docs/api-spec.md`
