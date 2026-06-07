# DataEye 登录态刷新

生成时间：2026-06-07T12:19:40.843Z

## 结论

已从抓包目标请求刷新本地 DataEye 登录态，且 live 预检通过。 已继续执行 live 预检，详情见 `docs/live-collection-preview.md`。

| 项 | 内容 |
| --- | --- |
| 目标请求 | `Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har#0` |
| 来源文件 | `captures/Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har` |
| 请求日期 | 2026-06-06 |
| 捕获时间 | 2026-06-07T12:07:34.895Z |
| 距今 | 12 分钟（较新） |
| 抓包字段映射就绪 | 是 |
| 本地登录态文件 | `.env.local.dataeye` |
| 预检执行 | 已执行，退出码 0 |
| 预检结果 | ready |

## Header 对照

敏感值只显示掩码，完整值仅写入本机 `.env.local.dataeye`。

| 环境变量 | Header | 抓包状态 |
| --- | --- | --- |
| DATAEYE_AUTHENTICATION | authentication | eyJh...UW4E |
| DATAEYE_LOGIN_USER_ID | loginUserId | <set> |
| DATAEYE_S | S | 4f44...b026 |
| DATAEYE_REFERER | referer | http...html |
| DATAEYE_USER_AGENT | user-agent | Mozi...8788 |
| DATAEYE_COOKIE | cookie | 未提供 |
| DATAEYE_AUTHORIZATION | authorization | 未提供 |
| DATAEYE_TOKEN | token | 未提供 |

## 下一步

只有第一条预检返回真实榜单数组并人工核对无误后，才执行第二条落库命令。

```bash
npm run collect:preview -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye
npm run collect:live -- --date 2026-06-06 --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
```
