# 真实采集落库报告

生成时间：2026-06-07T04:39:50.526Z

## 结论

真实采集落库完成。请打开页面核对榜单日期、来源、排名、热度值、类型和匹配结果。

| 项 | 内容 |
| --- | --- |
| 请求来源 | dataeye |
| 请求日期 | 2026-06-06 |
| 状态 | success |
| 预检确认 | 是 |

## 环境变量状态

登录态文件：.env.local.dataeye（存在）

| 变量 | 状态 |
| --- | --- |
| DATAEYE_AUTHENTICATION | eyJh...AGVE |
| DATAEYE_LOGIN_USER_ID | <set> |
| DATAEYE_S | 4f44...b026 |
| DATAEYE_REFERER | http...html |
| DATAEYE_USER_AGENT | Mozi...h_CN |
| DATAEYE_COOKIE | 未提供 |
| DATAEYE_AUTHORIZATION | 未提供 |
| DATAEYE_TOKEN | 未提供 |

## 运行结果

| 来源 | 日期 | 模式 | 状态 | 新增 | 跳过重复 | 消息 |
| --- | --- | --- | --- | ---: | ---: | --- |
| dataeye | 2026-06-06 | live | success | 0 | 30 | 采集完成：新增 0 条，跳过重复 30 条。 |

## 下一步

- 访问 `http://localhost:3000/?date=2026-06-06&source=dataeye&dataKind=live` 核对页面展示。
- 重复执行同一天采集时，应看到新增 0 条、跳过重复若干条。
