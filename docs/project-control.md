# 项目总控信源

更新时间：2026-06-08

本文件是项目进入优化阶段后的主控真实信源。目标变更、任务拆分、线程启动或结束、关键决策、风险升级、Git 提交与阻塞解除，都先同步到这里。

## 项目总览

| 项 | 当前状态 |
| --- | --- |
| 项目 | 短剧/漫剧榜单采集 MVP |
| 技术栈 | Next.js + SQLite + better-sqlite3 |
| 当前阶段 | 已完成 MVP，进入 DataEye 真实采集与展示优化阶段 |
| 当前主数据源 | DataEye / 剧查查 |
| 暂停范围 | 红果真实采集暂不推进 |
| 已验证能力 | DataEye motionComic 接口抓包、登录态预检、live 落库、rankType 维度、day/week/month 周期维度、小说精确匹配展示 |
| 运行边界 | 不绕过风控；登录态只从本地环境变量或本地配置读取；抓包数据不冒充 live 数据 |

## 决策记录

| 日期 | 决策 | 原因 | 影响 |
| --- | --- | --- | --- |
| 2026-06-08 | 当前新工作从 `origin/main` 拉出 `codex/info-get` | `codex/info-plus` 已合并到主分支，后续优化需要新分支承载 | 后续代码与文档变更应在 `codex/info-get` 上推进 |
| 2026-06-08 | DataEye 仍是唯一 live 推进源，红果保持暂停 | 红果尚未完成真实接口验证 | 避免未验证采集器混入真实数据 |
| 2026-06-08 | DataEye 榜单中文名以 `lib/dataeye-rankings.js` 为唯一代码源 | 避免前端、README、入库历史各自硬编码造成错位 | rankType 2 为真人AI榜，rankType 3 为沙雕漫榜 |
| 2026-06-08 | 未命名 rankType 可入库和出报告，但默认不在前端榜单切换中展示 | 探测范围需要保留，用户界面只展示已确认名称 | 降低误读未命名榜单的风险 |

## 任务看板

| ID | 任务 | 状态 | 负责人 | 依赖 | 产出 | 验收 |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | 建立项目总控信源并修正 README 榜单名口径 | 完成 | 总控 Agent | 已合并的 `origin/main` | `docs/project-control.md`、README 映射修正 | 文档存在，映射与 `lib/dataeye-rankings.js` 一致，检查通过 |
| T-002 | 梳理下一轮 DataEye 全量采集验证计划 | 待启动 | 分析型 Agent | T-001 | 采集验证清单 | 明确日期、rankType、period、登录态、落库验收口径 |
| T-003 | 执行全量 DataEye live 采集与数据抽检 | 待启动 | 实现型 Agent + 验证型 Agent | T-002、有效 `.env.local.dataeye` | live 数据、运行报告、抽检结论 | `all/all` 采集可运行；失败组合有原因；SQLite 未重复写入 |
| T-004 | 登录态续期与调度稳定性复核 | 待启动 | 排查型 Agent | T-003 | 续期流程风险清单 | 过期、缺字段、fresh HAR 更新路径均有明确提示 |

## 线程索引

| 线程 | 目标 | 状态 | 输入 | 结束条件 |
| --- | --- | --- | --- | --- |
| 主控线程 | 维护项目状态、分支、文档、风险和任务边界 | 进行中 | 当前仓库、Git、运行报告、用户决策 | 每轮结束时状态、下一步、Git 建议清楚 |
| DataEye 全量采集线程 | 验证 rankType 全部已知/可探测榜单与 day/week/month 周期 | 待启动 | `.env.local.dataeye`、`npm run dataeye:daily`、SQLite | 输出采集报告、失败组合、抽检结论 |
| 登录态稳定性线程 | 验证抓包刷新登录态和日常调度是否可靠 | 待启动 | Proxyman/Charles 抓包材料、capture scripts | 给出可稳定执行路径或阻塞原因 |

## Git 记录

| 项 | 状态 |
| --- | --- |
| 当前工作分支 | `codex/info-get` |
| 上游 | `origin/main` |
| 分支来源 | `origin/main` commit `67a6031` |
| 最近已合并功能 | PR #3：DataEye 多榜单 + 多周期采集扩展 |
| 最近主控提交 | T-001：项目总控信源与 README 榜单名口径同步 |
| 当前未提交变更 | 无 |
| 暂存说明 | 切分支前将 `docs/dataeye-login-refresh.md` 和 `docs/live-collection-preview.md` 的本地运行报告改动暂存到 git stash，避免串入新分支 |

## 风险与阻塞清单

| 风险 | 等级 | 当前判断 | 应对 |
| --- | --- | --- | --- |
| 登录态过期导致 live 采集失败 | 高 | DataEye 登录态依赖用户本地 `.env.local.dataeye` | live 前必须预检；失败不落库 |
| 生成报告文档容易成为脏工作区 | 中 | `docs/*preview*`、`docs/*refresh*` 会随运行更新 | 运行报告默认不随代码提交，提交前单独判断 |
| README 或历史报告口径滞后 | 中 | README 曾保留 rankType 2/3 旧映射 | 代码源以 `lib/dataeye-rankings.js` 为准，主控文档登记同步要求 |
| 未命名 rankType 被误认为已确认榜单 | 中 | 探测会入库 `rankType=4..20` | 前端只展示已命名榜单，报告保留未命名提示 |
| 红果真实采集误启动 | 中 | 红果接口未验证 | 页面和脚本维持暂停，不进入 live |

## 下一步行动

1. 启动 T-002：先定义 DataEye 全量采集验证范围，再执行 live。
2. T-002 通过后再启动 T-003：执行全量 DataEye live 采集与数据抽检。
3. 运行报告若更新，只在确认需要沉淀时提交；普通预检报告默认不进入代码提交。
