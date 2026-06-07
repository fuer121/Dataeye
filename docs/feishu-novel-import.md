# 飞书小说库导入报告

生成时间：2026-06-07T04:24:50.300Z

## 结论

飞书小说库导入未完成。

| 项 | 内容 |
| --- | --- |
| 状态 | failed |
| 读取行数 | 0 |
| 可映射行数 | 0 |
| 导入/更新映射 | 0 |
| 耗时 | 1 ms |
| 错误 | 请配置 FEISHU_SPREADSHEET_TOKEN。Wiki 链接不能直接替代表格 token。 |

## 环境变量状态

| 变量 | 状态 |
| --- | --- |
| FEISHU_APP_ID | 未提供 |
| FEISHU_APP_SECRET | 未提供 |
| FEISHU_TENANT_ACCESS_TOKEN | 未提供 |
| FEISHU_SPREADSHEET_TOKEN | 未提供 |
| FEISHU_SHEET_ID | 未提供 |
| FEISHU_RANGE | 未提供 |

## 字段要求

飞书表格首行需包含以下字段之一：

| 目标字段 | 支持表头 |
| --- | --- |
| 小说名称 | `小说名称`、`小说名`、`novelName`、`novel_name` |
| 短剧/漫剧名称 | `短剧/漫剧名称`、`短剧名称`、`漫剧名称`、`剧名`、`dramaTitle`、`drama_title` |
| 关系类型 | `关系类型`、`对应关系`、`relationType`、`relation_type` |
| 来源标识 | `来源`、`来源标识`、`sourceRef`、`source_ref` |

## 下一步

- 如果缺少配置，请在 `.env.local` 中补充飞书应用和表格信息。
- 如果只有 Wiki 链接，请先在飞书中打开实际电子表格，复制 spreadsheet token 和 sheet id。
- 也可以继续使用 `npm run novels:import -- --file ./data/novel-mappings.csv` 导入飞书导出的 CSV。
