# Charles 导出前检查清单

用于剧查查小程序「榜单 > 漫剧热播榜 > 日榜」抓包。导出前按此清单检查，避免材料无法分析。

## 抓包前

- Charles 已打开。
- `npm run capture:preflight` 显示 `Charles port 8888: open`。
- iPhone Wi-Fi 代理服务器填 `docs/capture-preflight.md` 中的 `en0` 地址。
- iPhone Wi-Fi 代理端口填 `8888`，或 Charles 实际端口。
- iPhone 已安装并信任 Charles Root Certificate。
- Charles 已为目标小程序域名开启 SSL Proxying。
- Charles Session 已清空。

## 小程序操作

- 打开微信里的剧查查小程序。
- 进入「榜单」。
- 选择「漫剧热播榜」。
- 周期选择「日榜」。
- 日期停留或切换到 `2026-06-05`。
- 下拉刷新一次。
- 向下滚动触发下一页请求。
- 切换到另一个日期，再切回 `2026-06-05`。

## 导出前确认

- Charles 中能看到返回 JSON 的榜单列表请求。
- 至少有一个响应体包含榜单数组。
- 能在响应里看到作品名、排名、热度值和类型/标签。
- 能看到日期/榜期请求，或榜单请求中包含日期参数。
- 如果有分页，能看到第一页和第二页请求。
- 请求 URL、Method、Header 名称、Content-Type、Payload 字段名和值未脱敏。
- `sign`、timestamp、日期、分页、榜单类型参数未脱敏。
- 响应 JSON 字段名和至少一条榜单数据行未脱敏。
- Cookie、Authorization、Token、Session、authentication、loginUserId、S 可以脱敏，但后续复现时需要把当前有效值放入 `.env.local`。

## 推荐导出文件

保存到项目根目录 `captures/`：

```text
captures/charles-dataeye-miniprogram-manhua-hot-20260605.har
captures/dataeye-miniprogram-manhua-hot-list-20260605.curl
captures/dataeye-miniprogram-manhua-hot-date.curl
captures/dataeye-miniprogram-manhua-hot-page2-20260605.curl
```

如果只导出一个文件，优先导出完整 HAR：

```text
captures/charles-dataeye-miniprogram-manhua-hot-20260605.har
```

不要只提供 `.chls`。

## 导出后

运行：

```bash
npm run capture:pipeline
```

或者在导出前先开一个监听终端：

```bash
npm run capture:watch
```

这样 HAR/cURL 保存到 `captures/` 后会自动刷新流水线报告。

按顺序查看：

```text
docs/capture-material-audit.md
docs/request-analysis.md
docs/request-validation.md
docs/ranking-preview.md
docs/api-spec.md
```
