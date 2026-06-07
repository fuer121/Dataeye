# DataEye 真实采集环境变量模板

生成时间：2026-06-06T17:13:47.883Z

## 目标请求

| 项 | 内容 |
| --- | --- |
| 来源文件 | `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har` |
| 请求 ID | `charles-dataeye-miniprogram-manhua-hot-20260606.har#32` |
| 方法 | GET |
| URL | https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0 |
| 捕获时间 | 2026-06-06T09:45:30.609Z |
| 距今 | 7.5 小时（可能需要重新抓取） |
| 抓包响应状态 | 200 |
| 抓包字段映射就绪 | 是 |

## 建议写入 .env.local

以下值来自抓包 Header 的存在性和掩码预览。敏感值不会完整输出；请从 Charles/HAR 原请求中复制完整值到 `.env.local`。

```bash
DATAEYE_AUTHENTICATION=<从 authentication 复制完整值>
DATAEYE_LOGIN_USER_ID=<从 loginUserId 复制完整值>
DATAEYE_S=
DATAEYE_REFERER=
DATAEYE_USER_AGENT=
DATAEYE_COOKIE=
DATAEYE_AUTHORIZATION=
DATAEYE_TOKEN=
```

## Header 对照

| 环境变量 | Header | 抓包状态 |
| --- | --- | --- |
| DATAEYE_AUTHENTICATION | authentication | eyJh...JA-Y |
| DATAEYE_LOGIN_USER_ID | loginUserId | <set> |
| DATAEYE_S | S | b03b...09c3 |
| DATAEYE_REFERER | referer | http...html |
| DATAEYE_USER_AGENT | user-agent | Mozi...h_CN |
| DATAEYE_COOKIE | cookie | 未提供 |
| DATAEYE_AUTHORIZATION | authorization | 未提供 |
| DATAEYE_TOKEN | token | 未提供 |

## 可选本地导出

如需从本次目标请求生成包含完整 Header 值的本地配置草稿，可运行：

```bash
npm run capture:env -- --write-local
```

该命令会写入 `.env.local.dataeye`，不会把敏感值写入 docs。

## 使用方式

1. 将上方变量填入项目根目录 `.env.local`。
2. 先运行只读预检：

```bash
npm run collect:preview -- --date 2026-06-05
```

如已生成 `.env.local.dataeye` 草稿，也可以先不复制，直接显式指定本地登录态文件：

```bash
npm run capture:validate -- --login-env-file .env.local.dataeye
npm run collect:preview -- --date 2026-06-05 --source dataeye --login-env-file .env.local.dataeye
```

3. 预检拿到榜单数组后，再用同一份登录态执行 live 落库：

```bash
npm run collect:live -- --date 2026-06-05 --source dataeye --login-env-file .env.local.dataeye --confirmed-preview
```
