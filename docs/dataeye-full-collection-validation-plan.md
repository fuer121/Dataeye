# DataEye 全量采集验证计划

更新时间：2026-06-08

## 目标

验证 DataEye / 剧查查真实采集从单一「漫剧热播榜日榜」扩展到：

- `rankType=all`：探测 `0..20`
- `period=all`：日榜、周榜、月榜
- 只推进 DataEye，红果 live 保持暂停

## 输入

| 输入 | 要求 |
| --- | --- |
| 登录态 | `.env.local.dataeye` 存在，至少包含 `DATAEYE_AUTHENTICATION` 和 `DATAEYE_LOGIN_USER_ID` |
| 抓包材料 | 如需刷新登录态，使用 fresh 的 DataEye `motionComic` HAR 或 cURL |
| 榜期日期 | 默认使用当前目标日期；若接口返回周榜/月榜榜期，以 `motionComicDate` 返回值为准 |
| 代码分支 | `codex/info-get` |

## 执行顺序

1. 登录态健康检查

```bash
npm run collect:preview -- --date 2026-06-07 --source dataeye --login-env-file .env.local.dataeye --rank-type 0 --period day
```

验收：

- 状态为 `ready`
- 返回榜单数组
- 样例行包含排名、名称、热度值、类型
- 若失败，停止，不执行 live

2. 全量预检

```bash
npm run collect:preview -- --date 2026-06-07 --source dataeye --login-env-file .env.local.dataeye --rank-type all --period all
```

验收：

- `docs/live-collection-preview.md` 出现组合摘要
- 成功组合包含 `rankType + period + periodValue + rows`
- 单个组合失败不影响其他组合继续
- 未命名 rankType 可以出现在报告中，但不作为前端可见榜单验收项

3. 全量 live 落库

```bash
npm run dataeye:collect -- --date 2026-06-07 --login-env-file .env.local.dataeye --rank-type all --period all
```

验收：

- live 命令只在全量预检通过后执行
- 写入 `ranking_entries`
- 去重规则仍为 `source + data_kind + rank_type + rank_period + period_value + normalized_title`
- 重复执行同一榜期不产生重复作品行

4. SQLite 抽检

验收项：

- `dataeye/live` 有 `day/week/month` 数据
- 已命名榜单至少覆盖 `rankType=0..3` 中接口可返回的组合
- 表格展示只显示已命名榜单
- 热度值使用周期口径：优先 `playCountAdd`，再回退 `playCount`

## 成功标准

| 项 | 标准 |
| --- | --- |
| 预检 | `rankType=all + period=all` 可生成组合报告 |
| live | 成功组合可落库，失败组合有明确原因 |
| 展示 | 页面可按日榜、周榜、月榜查看已命名榜单 |
| 数据安全 | 不把抓包导入或模拟数据冒充 live |
| Git | 采集报告默认不提交，除非被明确选为交付证据 |

## 阻塞处理

| 阻塞 | 处理 |
| --- | --- |
| 登录态失效 | 重新导出 fresh HAR/cURL，运行 `npm run dataeye:refresh-login` |
| 预检 rows 为 0 | 不执行 live，检查 rankType、periodValue 和响应结构 |
| 周榜/月榜失败 | 保留失败组合原因，先确认 `motionComicDate` 返回的 `week/month` 值 |
| 未命名榜单过多 | 不阻塞入库；另开任务补中文名映射 |
