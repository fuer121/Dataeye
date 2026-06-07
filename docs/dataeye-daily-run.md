# DataEye 每日采集

生成时间：2026-06-07T12:20:18.654Z

## 结论

DataEye 每日采集完成。

| 项 | 内容 |
| --- | --- |
| 来源 | dataeye |
| 日期 | 2026-06-06 |
| 状态 | success |
| 预检条数 | 30 |
| live 是否执行 | 是 |
| 下一步 | 打开 http://localhost:3000/?date=2026-06-06&source=dataeye&dataKind=live 核对页面。 |

## 登录态文件

登录态文件：.env.local.dataeye（存在）

## 预检结果

| 项 | 内容 |
| --- | --- |
| 状态 | ready |
| 错误 | 无 |
| 下一步 | 无 |

## live 结果

| 来源 | 日期 | 模式 | 状态 | 新增 | 跳过重复 | 消息 |
| --- | --- | --- | --- | ---: | ---: | --- |
| dataeye | 2026-06-06 | live | success | 0 | 30 | 采集完成：新增 0 条，跳过重复 30 条。 |

## 说明

- daily 调度固定 source=dataeye。
- preview 未返回真实榜单数组时，不执行 live 落库。
- 红果真实采集仍保持暂停，不参与 daily 调度。
