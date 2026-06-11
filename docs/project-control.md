# 项目总控信源

更新时间：2026-06-10

本文件是项目进入优化阶段后的主控真实信源。目标变更、任务拆分、线程启动或结束、关键决策、风险升级、Git 提交与阻塞解除，都先同步到这里。

## 项目总览

| 项 | 当前状态 |
| --- | --- |
| 项目 | 短剧/漫剧榜单采集 MVP |
| 技术栈 | Next.js + SQLite + better-sqlite3 |
| 当前阶段 | 已完成 MVP，进入多来源榜单展示、原生短剧导入与小说库管理优化阶段 |
| 当前主数据源 | DataEye / 剧查查、站内原生短剧 |
| 暂停范围 | 红果真实采集暂不推进 |
| 已验证能力 | DataEye motionComic 接口抓包、登录态预检、live 落库、rankType 维度、day/week/month 周期维度、站内原生短剧 Excel 导入、小说主库 Excel/CSV 导入、小说精确匹配展示 |
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
| 2026-06-10 | `codex/info-get` 已推送到远端 | 主控基线提交需要进入协作可见状态 | 后续可基于该分支创建 PR |
| 2026-06-10 | 从最新 `origin/main` 创建 `codex/native-info` 推进站内原生短剧接入 | `codex/info-get` 已合并，原生短剧是新的独立功能边界 | 本轮只改 native 来源、Excel 导入、顶层来源 Tab，不恢复红果 live |
| 2026-06-10 | 站内原生短剧使用 `source=native`、`dataKind=live`、Excel 导出日期 T-1 作为数据日期 | `原生短剧数据/0610` 的真实数据日期为 `2026-06-09` | `day.xlsx/week.xlsx/month.xlsx` 入库为 `day/week/month`，榜期值均为数据日期 |
| 2026-06-10 | 总控职责固化为每次请求必读文件 | 后续项目进入优化阶段，需要让总控职责、真实信源读取顺序和 Git 边界可继承 | 新增 `docs/controller-responsibilities.md` 和根目录 `AGENTS.md`；每次请求先读职责文件和 `docs/project-control.md` |
| 2026-06-10 | 小说库第一版拆为 `小说库` 和 `短剧和小说映射关系` 两个 Tab | 当前只有 `novel_mappings` 表，新增小说主表会扩大迁移范围 | `小说库` Tab 从映射表按小说名去重生成；映射关系 Tab 保留导入、编辑、删除和飞书同步 |
| 2026-06-10 | 小说库改为单页小说主库 + 行内映射维护 | 用户确认本地导出字段是书籍主库，需要上传 Excel/CSV 后形成小说主表，不再单独维护映射 Tab | 新增 `novels` 表；`/novels` 页面只保留小说库列表、Excel/CSV 导入和同页映射表单；`novel_mappings` 继续作为榜单匹配表 |
| 2026-06-10 | 小说和短剧/漫剧映射 Excel 设为独立上传入口 | 用户提供的映射文件只有 `小说名称` 和 `短剧/漫剧名称` 两列，不应混入小说主库导入语义 | 新增 `/api/novels/import/mappings`；缺失小说自动创建最小小说行；小说库表格展示短剧/漫剧名和映射匹配 |

## 任务看板

| ID | 任务 | 状态 | 负责人 | 依赖 | 产出 | 验收 |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | 建立项目总控信源并修正 README 榜单名口径 | 完成 | 总控 Agent | 已合并的 `origin/main` | `docs/project-control.md`、README 映射修正 | 文档存在，映射与 `lib/dataeye-rankings.js` 一致，检查通过 |
| T-002 | 梳理下一轮 DataEye 全量采集验证计划 | 完成 | 分析型 Agent | T-001 | `docs/dataeye-full-collection-validation-plan.md`、`docs/capture-organization.md`、递归抓包读取支持 | 明确日期、rankType、period、登录态、落库验收口径；抓包子目录可被脚本读取 |
| T-003 | 执行全量 DataEye live 采集与数据抽检 | blocked | 实现型 Agent + 验证型 Agent | T-002、有效 `.env.local.dataeye` | live 数据、运行报告、抽检结论 | 当前 `rankType=0/day/2026-06-07` 预检返回 `statusCode=401` 登录态失效；需 fresh HAR/cURL 或更新 `.env.local.dataeye` 后重试 |
| T-004 | 登录态续期与调度稳定性复核 | 待启动 | 排查型 Agent | T-003 | 续期流程风险清单 | 过期、缺字段、fresh HAR 更新路径均有明确提示 |
| T-005 | 总控状态校准与本地原始数据边界登记 | 完成 | 总控 Agent | 当前仓库、服务状态、Git 状态 | `.gitignore`、`docs/project-control.md` | 服务可访问；原始 Excel 数据不进 Git；文档与 Git 边界一致 |
| T-006 | 评估 `原生短剧数据/0610` Excel 是否接入 MVP | 待启动 | 分析型 Agent | T-005、用户确认接入目标 | 字段识别、数据口径、是否入库建议 | 明确 day/week/month 三个 xlsx 的字段、去重口径、与现有 DataEye live 数据关系 |
| T-007 | 推送 `codex/info-get` 到远端 | 完成 | 总控 Agent | T-001 至 T-005 | 远端分支 `origin/codex/info-get` | 本地分支已跟踪远端，GitHub 可创建 PR |
| T-008 | 接入站内原生短剧 Excel 并新增顶层来源 Tab | 完成 | 实现型 Agent | 最新 `origin/main`、`原生短剧数据/0610`、小说库匹配能力 | `source=native` 数据模型、`native:import` CLI、`POST /api/native/import`、前端来源 Tab | `npm test`、`npm run lint`、`npm run build` 通过；`0610` 成功导入为 `2026-06-09` |
| T-009 | 固化项目总控职责为必读文件 | 完成 | 总控 Agent | 用户总控职责要求、`docs/project-control.md` | `docs/controller-responsibilities.md`、`AGENTS.md`、主控文档决策记录 | 后续请求有明确必读文件和读取顺序；Git 忽略边界写入入口说明 |
| T-010 | 小说库双 Tab 管理 | 完成（已被 T-011 取代） | 实现型 Agent | T-009、现有 `novel_mappings` 表 | `/novels` 双 Tab、`listNovelLibrary`、`GET /api/novels` 双列表返回、README 同步 | 后续以 T-011 单页小说主库方案为准 |
| T-011 | 小说库 Excel 导入与单页映射维护 | 完成 | 实现型 Agent | T-010、当前本地小说主库导出字段 | `novels` 表、`/api/novels/import` Excel/CSV/JSON 导入、`/novels` 单页小说主库和映射表单、README 同步 | `npm test`、`npm run lint`、`npm run build` 通过；`/novels` 局域网页面返回 200 并完成页面快照验收 |
| T-012 | 小说映射 Excel 上传与匹配展示 | 完成 | 实现型 Agent | T-011、`assess/小说短剧漫剧映射.xlsx` 表头 | `/api/novels/import/mappings`、映射 Excel 导入服务、小说库映射列、README 同步 | 目标测试、`npm test`、`npm run lint`、`npm run build` 通过；映射导入不清空已存在小说元数据；`/novels` 局域网页面快照验收通过 |

## 线程索引

| 线程 | 目标 | 状态 | 输入 | 结束条件 |
| --- | --- | --- | --- | --- |
| 主控线程 | 维护项目状态、分支、文档、风险和任务边界 | 进行中 | 当前仓库、Git、运行报告、用户决策 | 每轮结束时状态、下一步、Git 建议清楚 |
| DataEye 全量采集线程 | 验证 rankType 全部已知/可探测榜单与 day/week/month 周期 | 待启动 | `.env.local.dataeye`、`npm run dataeye:daily`、SQLite | 输出采集报告、失败组合、抽检结论 |
| 登录态稳定性线程 | 验证抓包刷新登录态和日常调度是否可靠 | 待启动 | Proxyman/Charles 抓包材料、capture scripts | 给出可稳定执行路径或阻塞原因 |
| 原生 Excel 数据接入线程 | 将 `原生短剧数据/0610` 作为站内原生短剧来源入库并展示 | 完成 | `day.xlsx`、`week.xlsx`、`month.xlsx` | CLI/API/UI 可导入并展示，小说匹配复用现有精确匹配 |
| 小说库管理优化线程 | 将小说库改为本地 Excel/CSV 主库导入 + 单页映射维护，并支持独立映射 Excel 导入 | 完成 | 本地小说主库导出字段、映射 Excel、`novels`、`novel_mappings`、`/novels` 页面 | 小说主库可导入和搜索，映射 Excel 可批量写入映射，行内维护映射，榜单页回填短剧名路径保留 |

## Git 记录

| 项 | 状态 |
| --- | --- |
| 当前工作分支 | `codex/fiction-get` |
| 上游 | `origin/main` 为分支来源；推送目标为 `origin/codex/fiction-get` |
| 分支来源 | 最新 `origin/main` |
| 远端状态 | 尚未创建 PR |
| 最近已合并功能 | PR #6：站内原生短剧 Tab 与 Excel 导入 |
| 最近主控提交 | T-009：固化总控职责必读文件 |
| 本轮提交边界 | T-011 小说库 Excel 导入与单页映射维护、T-012 小说映射 Excel 上传与匹配展示；`Dify-flow/`、`assess/` 和本地导出 CSV 是未跟踪数据/目录，不属于本轮提交 |
| 暂存说明 | `docs/dataeye-login-refresh.md` 和 `docs/live-collection-preview.md` 属运行报告，已排除本次提交 |

## 风险与阻塞清单

| 风险 | 等级 | 当前判断 | 应对 |
| --- | --- | --- | --- |
| 登录态过期导致 live 采集失败 | 高 | DataEye 登录态依赖用户本地 `.env.local.dataeye` | live 前必须预检；失败不落库 |
| T-003 当前阻塞 | 高 | 2026-06-07 `rankType=0/day` 健康预检失败：`statusCode=401`，提示登录态已失效 | 重新导出 fresh DataEye `motionComic` HAR/cURL 到推荐目录，再运行 `npm run dataeye:refresh-login` 和预检 |
| 生成报告文档容易成为脏工作区 | 中 | `docs/*preview*`、`docs/*refresh*` 会随运行更新 | 运行报告默认不随代码提交，提交前单独判断 |
| 抓包材料散装导致误选旧 HAR | 中 | 根目录已有多批 Charles/Proxyman/cURL 混放 | 后续按 `captures/dataeye/<date>/<period>/` 归档，脚本递归读取 |
| 原始 Excel 数据误提交 | 中 | `原生短剧数据/0610` 存在 day/week/month xlsx | 作为本地输入材料忽略，接入前先做字段评估 |
| dev server 与 `next build` 共用 `.next` 导致页面异常 | 中 | 2026-06-10 曾在 dev server 运行时执行 `next build`，覆盖 `.next` 后运行态出现 404/500 和页面无 UI | 构建前先停止 dev server，或构建后执行 `rm -rf .next` 并重启 `screen` 会话 |
| 原生 Excel 重复剧名导致跳过 | 中 | `0610` 有 998 条有效行，SQLite 新增 994 条、跳过 4 条同周期同名数据 | 维持现有唯一约束，后续如要保留同名多条需新增站内唯一 ID 字段 |
| README 或历史报告口径滞后 | 中 | README 曾保留 rankType 2/3 旧映射 | 代码源以 `lib/dataeye-rankings.js` 为准，主控文档登记同步要求 |
| 未命名 rankType 被误认为已确认榜单 | 中 | 探测会入库 `rankType=4..20` | 前端只展示已命名榜单，报告保留未命名提示 |
| 红果真实采集误启动 | 中 | 红果接口未验证 | 页面和脚本维持暂停，不进入 live |

## 下一步行动

1. 用户确认后，将 `codex/fiction-get` 上的 T-011/T-012 变更作为一个小说库优化闭环提交并推送。
2. 创建 PR，审查重点放在小说主库导入、映射 Excel 导入、缺失小说自动创建和 `/novels` 页面展示。
3. 解除 T-003 阻塞：将 fresh DataEye `motionComic` HAR/cURL 放入 `captures/dataeye/<date>/<period>/`，或直接更新 `.env.local.dataeye`。
