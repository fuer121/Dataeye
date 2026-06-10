# 项目总控信源

更新时间：2026-06-10

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
| 本地服务 | `screen` 会话 `dataeye-goal-dev` 承载 `npm run dev -- --hostname 0.0.0.0`；局域网优先访问 `http://qimaodeMacBook-Air.local:3000` |

## 决策记录

| 日期 | 决策 | 原因 | 影响 |
| --- | --- | --- | --- |
| 2026-06-08 | 当前新工作从 `origin/main` 拉出 `codex/info-get` | `codex/info-plus` 已合并到主分支，后续优化需要新分支承载 | 后续代码与文档变更应在 `codex/info-get` 上推进 |
| 2026-06-08 | DataEye 仍是唯一 live 推进源，红果保持暂停 | 红果尚未完成真实接口验证 | 避免未验证采集器混入真实数据 |
| 2026-06-08 | DataEye 榜单中文名以 `lib/dataeye-rankings.js` 为唯一代码源 | 避免前端、README、入库历史各自硬编码造成错位 | rankType 2 为真人AI榜，rankType 3 为沙雕漫榜 |
| 2026-06-08 | 未命名 rankType 可入库和出报告，但默认不在前端榜单切换中展示 | 探测范围需要保留，用户界面只展示已确认名称 | 降低误读未命名榜单的风险 |
| 2026-06-08 | `captures/` 后续允许按来源、日期和周期分目录归档 | 根目录散装 HAR 不利于长期维护 | 抓包读取工具支持递归扫描，整理规范见 `docs/capture-organization.md` |
| 2026-06-10 | `原生短剧数据/` 作为本地原始 Excel 输入目录，不进入 Git | 目录下有 `0610/day.xlsx`、`week.xlsx`、`month.xlsx`，属于数据材料而非代码 | 已加入 `.gitignore`，后续如需接入先开独立评估任务 |
| 2026-06-10 | 本地预览服务使用 `screen` 独立会话承载 | 普通对话会话进程会随工具会话结束而中断 | 通过 `screen -S dataeye-goal-dev -X quit` 停止服务 |

## 任务看板

| ID | 任务 | 状态 | 负责人 | 依赖 | 产出 | 验收 |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | 建立项目总控信源并修正 README 榜单名口径 | 完成 | 总控 Agent | 已合并的 `origin/main` | `docs/project-control.md`、README 映射修正 | 文档存在，映射与 `lib/dataeye-rankings.js` 一致，检查通过 |
| T-002 | 梳理下一轮 DataEye 全量采集验证计划 | 完成 | 分析型 Agent | T-001 | `docs/dataeye-full-collection-validation-plan.md`、`docs/capture-organization.md`、递归抓包读取支持 | 明确日期、rankType、period、登录态、落库验收口径；抓包子目录可被脚本读取 |
| T-003 | 执行全量 DataEye live 采集与数据抽检 | blocked | 实现型 Agent + 验证型 Agent | T-002、有效 `.env.local.dataeye` | live 数据、运行报告、抽检结论 | 当前 `rankType=0/day/2026-06-07` 预检返回 `statusCode=401` 登录态失效；需 fresh HAR/cURL 或更新 `.env.local.dataeye` 后重试 |
| T-004 | 登录态续期与调度稳定性复核 | 待启动 | 排查型 Agent | T-003 | 续期流程风险清单 | 过期、缺字段、fresh HAR 更新路径均有明确提示 |
| T-005 | 总控状态校准与本地原始数据边界登记 | 完成 | 总控 Agent | 当前仓库、服务状态、Git 状态 | `.gitignore`、`docs/project-control.md` | 服务可访问；原始 Excel 数据不进 Git；文档与 Git 边界一致 |
| T-006 | 评估 `原生短剧数据/0610` Excel 是否接入 MVP | 待启动 | 分析型 Agent | T-005、用户确认接入目标 | 字段识别、数据口径、是否入库建议 | 明确 day/week/month 三个 xlsx 的字段、去重口径、与现有 DataEye live 数据关系 |

## 线程索引

| 线程 | 目标 | 状态 | 输入 | 结束条件 |
| --- | --- | --- | --- | --- |
| 主控线程 | 维护项目状态、分支、文档、风险和任务边界 | 进行中 | 当前仓库、Git、运行报告、用户决策 | 每轮结束时状态、下一步、Git 建议清楚 |
| DataEye 全量采集线程 | 验证 rankType 全部已知/可探测榜单与 day/week/month 周期 | 待启动 | `.env.local.dataeye`、`npm run dataeye:daily`、SQLite | 输出采集报告、失败组合、抽检结论 |
| 登录态稳定性线程 | 验证抓包刷新登录态和日常调度是否可靠 | 待启动 | Proxyman/Charles 抓包材料、capture scripts | 给出可稳定执行路径或阻塞原因 |
| 原生 Excel 数据评估线程 | 判断 `原生短剧数据/0610` 是否需要入库或仅做对照材料 | 待启动 | `day.xlsx`、`week.xlsx`、`month.xlsx` | 输出字段映射、风险和接入建议 |

## Git 记录

| 项 | 状态 |
| --- | --- |
| 当前工作分支 | `codex/info-get` |
| 上游 | `origin/main` |
| 分支来源 | `origin/main` commit `67a6031` |
| 最近已合并功能 | PR #3：DataEye 多榜单 + 多周期采集扩展 |
| 最近主控提交 | T-005：总控状态校准与本地原始数据边界登记 |
| 当前未提交变更 | 无 |
| 暂存说明 | 切分支前将 `docs/dataeye-login-refresh.md` 和 `docs/live-collection-preview.md` 的本地运行报告改动暂存到 git stash，避免串入新分支 |

## 风险与阻塞清单

| 风险 | 等级 | 当前判断 | 应对 |
| --- | --- | --- | --- |
| 登录态过期导致 live 采集失败 | 高 | DataEye 登录态依赖用户本地 `.env.local.dataeye` | live 前必须预检；失败不落库 |
| T-003 当前阻塞 | 高 | 2026-06-07 `rankType=0/day` 健康预检失败：`statusCode=401`，提示登录态已失效 | 重新导出 fresh DataEye `motionComic` HAR/cURL 到推荐目录，再运行 `npm run dataeye:refresh-login` 和预检 |
| 生成报告文档容易成为脏工作区 | 中 | `docs/*preview*`、`docs/*refresh*` 会随运行更新 | 运行报告默认不随代码提交，提交前单独判断 |
| 抓包材料散装导致误选旧 HAR | 中 | 根目录已有多批 Charles/Proxyman/cURL 混放 | 后续按 `captures/dataeye/<date>/<period>/` 归档，脚本递归读取 |
| 原始 Excel 数据误提交 | 中 | `原生短剧数据/0610` 存在 day/week/month xlsx | 作为本地输入材料忽略，接入前先做字段评估 |
| README 或历史报告口径滞后 | 中 | README 曾保留 rankType 2/3 旧映射 | 代码源以 `lib/dataeye-rankings.js` 为准，主控文档登记同步要求 |
| 未命名 rankType 被误认为已确认榜单 | 中 | 探测会入库 `rankType=4..20` | 前端只展示已命名榜单，报告保留未命名提示 |
| 红果真实采集误启动 | 中 | 红果接口未验证 | 页面和脚本维持暂停，不进入 live |

## 下一步行动

1. 推送 `codex/info-get`，让 T-001/T-002/T-003/T-005 的主控提交进入远端。
2. 解除 T-003 阻塞：将 fresh DataEye `motionComic` HAR/cURL 放入 `captures/dataeye/<date>/<period>/`，或直接更新 `.env.local.dataeye`。
3. 如要使用 `原生短剧数据/0610`，先启动 T-006 做字段评估，不直接入库。
