# DataEye 登录态续期探针

生成时间：2026-06-07T08:25:48.364Z

## 结论

已发现 DataEye 目标请求，但抓包偏旧，不建议覆盖本地登录态。

| 项 | 内容 |
| --- | --- |
| 状态 | needs_fresh_capture |
| 可刷新登录态 | 否 |
| 下一步 | 已发现 DataEye 目标请求，但抓包不是 fresh。请重新触发 Mac WeChat 小程序请求并导出新 HAR。 |

## Charles

| 项 | 内容 |
| --- | --- |
| 端口 | 8888 |
| 端口可连接 | 是 |
| CLI 可用 | 是 |
| 错误 | 无 |

## Mac WeChat

| 项 | 内容 |
| --- | --- |
| 进程存在 | 是 |
| 相关进程数 | 16 |

## DataEye 目标请求

| 项 | 内容 |
| --- | --- |
| 请求 ID | charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har#10 |
| 来源文件 | /Users/staff/Desktop/qm-work/剧查查-goal/captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har |
| URL | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0 |
| 抓包新鲜度 | 5.5 小时（可能需要重新抓取） |

## 边界

- Xcode 不作为主自动化链路，只用于排查设备、模拟器或证书环境。
- 不做绕过风控、逆向登录、自动破解签名或 token 生成。
- 本探针不会自动执行 GUI 点击，也不会自动导出 Charles HAR。
- 只有检测到 fresh 的 DataEye motionComic 请求后，才建议运行 `npm run dataeye:refresh-login`。
