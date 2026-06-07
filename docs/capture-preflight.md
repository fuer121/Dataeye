# 抓包环境预检

生成时间：2026-06-07T12:21:21.824Z

## Charles

| 项 | 状态 |
| --- | --- |
| 本机端口 | 127.0.0.1:8888 |
| 是否可连接 | 否 |
| 错误 | ECONNREFUSED |

如果端口不可连接，请确认 Charles 已打开，并检查 Charles 的 Proxy 端口是否为 8888。如使用其他端口，可运行：

```bash
CHARLES_PORT=<端口> npm run capture:preflight
```

## iPhone Wi-Fi 代理可用地址

| 网络接口 | iPhone 代理服务器 | 端口 |
| --- | --- | ---: |
| en0 | 192.168.1.26 | 8888 |
| utun9 | 10.8.9.119 | 8888 |

## 抓包材料

| 项 | 数量 |
| --- | ---: |
| /captures 文件 | 5 |

- `captures/Proxyman-playlet-applet.dataeye.com_06-06-2026-20-10-17.har`
- `captures/cURL-proxyman.txt`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606-fresh.har`
- `captures/charles-dataeye-miniprogram-manhua-hot-20260606.har`
- `captures/proxyman-dataeye-miniprogram-manhua-hot-20260607.har`

## DataEye 登录态

登录态文件：.env.local.dataeye（存在）

| 变量 | 状态 |
| --- | --- |
| DATAEYE_AUTHENTICATION | eyJh...UW4E |
| DATAEYE_LOGIN_USER_ID | <set> |
| DATAEYE_S | 4f44...b026 |
| DATAEYE_REFERER | 已提供 |
| DATAEYE_USER_AGENT | 已提供 |
| DATAEYE_COOKIE | 未提供 |
| DATAEYE_AUTHORIZATION | 未提供 |
| DATAEYE_TOKEN | 未提供 |

剧查查小程序 live 采集必填 `DATAEYE_AUTHENTICATION` 和 `DATAEYE_LOGIN_USER_ID`；`DATAEYE_S`、`DATAEYE_REFERER`、`DATAEYE_USER_AGENT` 按抓包请求补充。Cookie、Authorization、Token 仅在目标请求实际包含时需要。

## 下一步

1. 在 iPhone Wi-Fi 代理中填入上面的本机 IP 和 Charles 端口。
2. 安装并信任 Charles Root Certificate。
3. 按 `docs/dataeye-miniprogram-capture-runbook.md` 抓剧查查小程序「漫剧热播榜 + 日榜」。
4. 将 HAR 或 cURL 保存到 `captures/`。
5. 运行 `npm run capture:pipeline`。
