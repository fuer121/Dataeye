# 项目总控信源

更新时间：2026-06-11

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
| 2026-06-11 | 小说库表格聚焦映射核对字段 | 当前运营核对主要看小说名称、短剧/漫剧名和是否映射，作者、分类、阅读偏好、操作列会增加扫描成本 | `/novels` 表格移除作者、分类、阅读偏好、操作列；短剧/漫剧名和映射匹配前移到小说名称后；筛选只保留小说/短剧模糊搜索和映射匹配下拉 |
| 2026-06-11 | DataEye 日常采集目标切换为 tab HAR 映射出的 4 个榜单 | 用户提供 `captures/dataeye/tab/tab-list-name.har` 和 `captures/dataeye/2026-06-11` 新抓包，当前每日目标不再是旧 `漫剧热播榜/动态漫榜/真人AI榜/沙雕漫榜` | `rankType=all` 改为 `红果漫剧榜、热力榜、抖音热播、红果榜`；旧 `motionComic rankType=0..3` 仅显式指定时兼容 |
| 2026-06-11 | DataEye 新榜单日期口径固定为“页面日期 + 榜期”双字段 | 页面按 `rankingDate` 筛选同一次采集日期，周榜/月榜真实榜期不能写入 `rankingDate`，否则周期 Tab 会查不到数据 | `rankingDate` 保持采集日期如 `2026-06-11`；`periodValue` 存真实榜期，如热力榜日榜 `2026-06-10`、周榜 `2026-06-01 ~ 2026-06-07`、月榜 `2026-05` |
| 2026-06-11 | 站内原生短剧 Excel 默认读取 `captures/原生短剧数据` | 用户已将导出 Excel 放到 `captures` 目录，原导入器只查根目录 `原生短剧数据` 会误报缺少 `day.xlsx/week.xlsx/month.xlsx` | 默认同时查 `原生短剧数据` 和 `captures/原生短剧数据`；页面日期无对应 T+1 导出目录时回退到最新完整导出目录 |
| 2026-06-11 | 清理本地 SQLite 中明确标记的 sample 展示数据 | 用户要求确认匹配数据是否真实；审计发现早期 MVP 残留 `data_kind=sample` 榜单和 `source_ref=sample` 小说映射 | 已删除 15 条 sample 榜单、4 条 sample 映射、7 条 sample 采集日志；随后按用户确认删除 1 条 `manual-form` 映射；当前映射只剩上传 Excel 来源 |
| 2026-06-11 | 站内原生短剧顶部筛选改为榜期筛选 | 原日期控件按 `ranking_date` 查询，容易和 Excel 导出日期、DataEye 页面日期混淆，导致 native 视图停留在 `2026-06-11` 时无数据 | native 视图主控件显示 `榜期` 并绑定 `periodValue`；默认使用站内原生短剧最新榜期，DataEye 仍保留日期 + 榜期双字段 |
| 2026-06-11 | 隐藏 DataEye 页面固定全量采集板块 | 当前页面需要聚焦榜单核对和当前筛选采集，固定全量入口占用空间且存在误触全量落库风险 | 前端不展示 `一键全量预检/真实采集 DataEye` 板块；保留当前筛选预检/采集入口，CLI/API 全量能力不变 |
| 2026-06-11 | 隐藏 DataEye 页面模拟采集按钮 | 当前 DataEye 页面应聚焦真实数据核对，模拟采集入口容易和真实采集混淆 | 前端不展示 `采集 DataEye 模拟榜单`；保留抓包导入、当前筛选预检和当前筛选真实采集入口 |
| 2026-06-11 | 隐藏 DataEye 页面榜期文本筛选入口 | DataEye 页面的可见筛选只保留日期、匹配状态、数据性质、榜单类型和周期，避免手动输入榜期造成无数据误判 | 前端不展示 DataEye `榜期` 输入；保留底层 `periodValue` 字段、URL/API 查询能力和表格榜期展示 |
| 2026-06-11 | 隐藏榜单页页头动作组 | 页头右上角的上传抓包、生成报告、导入模拟小说库等入口与当前核对视图主流程无关，且容易与真实采集入口混淆 | 前端不展示 `header-actions`；保留底层抓包上传和抓包流水线 API，页面内仍保留当前筛选抓包导入/预检/采集入口 |
| 2026-06-11 | 隐藏榜单表格类型列 | 当前核对视图聚焦榜期、排名、作品名、热度/消耗、小说匹配和采集信息，类型字段增加横向扫描成本 | 前端不展示表格 `类型` 列；底层 `dramaType` 字段、采集映射和 API 数据不变 |
| 2026-06-11 | 单周期 DataEye 榜单隐藏周期切换 | `红果漫剧榜` 当前只支持日榜，继续展示日榜/周榜/月榜会暗示存在周榜和月榜；同时页面白名单未包含新榜单 ID 会导致 `rankType=119` 回退为全部榜单 | 页面根据 `lib/dataeye-rankings.js` 的 `periods` 元数据隐藏单周期榜单的周期切换；切换到单周期榜单时自动收敛为 `day`；`app/page.jsx` 的 rankType 白名单同步读取当前 DataEye 榜单定义 |
| 2026-06-11 | 来源 Tab 切换自动定位最新有数据榜期 | 站内原生短剧和 DataEye / 剧查查的数据日期口径不同，直接沿用切换前日期会导致进入目标来源后无数据或显示过期榜期 | 新增 `/api/rankings/latest`，按目标来源、数据性质、榜单类型和周期查询最新可用日期/榜期；前端切换来源 Tab 时自动更新筛选值 |
| 2026-06-11 | 榜单列表展示匹配小说平台 id，并在首次进入时优先展示已匹配 | 榜单核对需要从作品直接看到对应小说的平台 id；默认展示全部会让已匹配内容被未匹配行稀释 | 平台 id 仅从 `novels.platform_id` 查询展示，不新增榜单字段；URL 未显式传 `match` 时，首屏按当前可见列表自动选择 `已匹配` 或回退 `全部` |
| 2026-06-11 | 隐藏 DataEye 页面抓包榜单导入入口 | 当前页面已定位为真实榜单核对和当前筛选采集，抓包导入属于后台/CLI 辅助流程，继续展示会和真实 live 入口混淆 | 前端不展示 `导入 DataEye / 剧查查抓包榜单`；`/api/capture/import` 与 `npm run capture:import` 保留 |
| 2026-06-11 | 隐藏 DataEye 页面当前筛选预检入口 | 当前页面继续收敛为榜单核对视图，预检属于后台/CLI/API 操作，继续展示会增加运营侧误触和理解成本 | 前端不展示 `预检当前筛选 DataEye / 剧查查`；`/api/collect/preview` 和 `collect:preview` 保留 |
| 2026-06-11 | 顶层来源 Tab 文案收敛为 `剧查查` | 运营页面顶部入口需要更短、更贴近用户实际识别的小程序名称 | 仅修改来源 Tab 显示文案；底层 `source=dataeye`、DataEye 登录态、采集 API 和报告口径不变 |

## 任务看板

| ID | 任务 | 状态 | 负责人 | 依赖 | 产出 | 验收 |
| --- | --- | --- | --- | --- | --- | --- |
| T-001 | 建立项目总控信源并修正 README 榜单名口径 | 完成 | 总控 Agent | 已合并的 `origin/main` | `docs/project-control.md`、README 映射修正 | 文档存在，映射与 `lib/dataeye-rankings.js` 一致，检查通过 |
| T-002 | 梳理下一轮 DataEye 全量采集验证计划 | 完成 | 分析型 Agent | T-001 | `docs/dataeye-full-collection-validation-plan.md`、`docs/capture-organization.md`、递归抓包读取支持 | 明确日期、rankType、period、登录态、落库验收口径；抓包子目录可被脚本读取 |
| T-003 | 执行旧 DataEye motionComic 全量 live 采集与数据抽检 | 归档阻塞 | 实现型 Agent + 验证型 Agent | T-002、有效 `.env.local.dataeye` | live 数据、运行报告、抽检结论 | `captures/dataeye/2026-06-10/day` 旧材料已返回业务 `statusCode=401`；日常采集目标已切到 T-014 的新 4 榜单，不再沿用旧 motionComic 全量目标 |
| T-004 | 登录态续期与调度稳定性复核 | 待启动 | 排查型 Agent | T-003 | 续期流程风险清单 | 过期、缺字段、fresh HAR 更新路径均有明确提示 |
| T-005 | 总控状态校准与本地原始数据边界登记 | 完成 | 总控 Agent | 当前仓库、服务状态、Git 状态 | `.gitignore`、`docs/project-control.md` | 服务可访问；原始 Excel 数据不进 Git；文档与 Git 边界一致 |
| T-006 | 评估 `原生短剧数据/0610` Excel 是否接入 MVP | 待启动 | 分析型 Agent | T-005、用户确认接入目标 | 字段识别、数据口径、是否入库建议 | 明确 day/week/month 三个 xlsx 的字段、去重口径、与现有 DataEye live 数据关系 |
| T-007 | 推送 `codex/info-get` 到远端 | 完成 | 总控 Agent | T-001 至 T-005 | 远端分支 `origin/codex/info-get` | 本地分支已跟踪远端，GitHub 可创建 PR |
| T-008 | 接入站内原生短剧 Excel 并新增顶层来源 Tab | 完成 | 实现型 Agent | 最新 `origin/main`、`原生短剧数据/0610`、小说库匹配能力 | `source=native` 数据模型、`native:import` CLI、`POST /api/native/import`、前端来源 Tab | `npm test`、`npm run lint`、`npm run build` 通过；`0610` 成功导入为 `2026-06-09` |
| T-009 | 固化项目总控职责为必读文件 | 完成 | 总控 Agent | 用户总控职责要求、`docs/project-control.md` | `docs/controller-responsibilities.md`、`AGENTS.md`、主控文档决策记录 | 后续请求有明确必读文件和读取顺序；Git 忽略边界写入入口说明 |
| T-010 | 小说库双 Tab 管理 | 完成（已被 T-011 取代） | 实现型 Agent | T-009、现有 `novel_mappings` 表 | `/novels` 双 Tab、`listNovelLibrary`、`GET /api/novels` 双列表返回、README 同步 | 后续以 T-011 单页小说主库方案为准 |
| T-011 | 小说库 Excel 导入与单页映射维护 | 完成 | 实现型 Agent | T-010、当前本地小说主库导出字段 | `novels` 表、`/api/novels/import` Excel/CSV/JSON 导入、`/novels` 单页小说主库和映射表单、README 同步 | `npm test`、`npm run lint`、`npm run build` 通过；`/novels` 局域网页面返回 200 并完成页面快照验收 |
| T-012 | 小说映射 Excel 上传与匹配展示 | 完成 | 实现型 Agent | T-011、`assess/小说短剧漫剧映射.xlsx` 表头 | `/api/novels/import/mappings`、映射 Excel 导入服务、小说库映射列、README 同步 | 目标测试、`npm test`、`npm run lint`、`npm run build` 通过；映射导入不清空已存在小说元数据；`/novels` 局域网页面快照验收通过 |
| T-013 | 小说库表格和筛选简化 | 完成 | 实现型 Agent | T-012、当前 `/novels` 页面 | 表格列重排和裁剪、删除关系类型控件、维护映射表单前置、小说/短剧模糊搜索、映射匹配下拉筛选、README 同步 | 目标测试、`npm test`、`npm run lint`、`npm run build`、页面快照验收通过 |
| T-014 | DataEye 新 4 榜单采集目标切换 | 完成 | 实现型 Agent | `captures/dataeye/tab/tab-list-name.har`、`captures/dataeye/2026-06-11` HAR | `lib/dataeye-rankings.js` 新榜单定义、`lib/collectors/live.js` 新端点采集、抓包登录态识别扩展、README 同步、`2026-06-11` live 数据 | `npm test` 和 `npm run lint` 通过；刷新 `.env.local.dataeye` 后 `2026-06-11 rankType=all period=all` 预检 ready；live 落库新增 330 条、跳过重复 0 条 |
| T-015 | 修正 DataEye 新榜单周/月榜页面日期口径 | 完成 | 排查型 Agent + 实现型 Agent | T-014、页面筛选反馈 | `lib/collectors/live.js` 修正新端点 `rankingDate`，SQLite 现有 2026-06-11 数据定向修复，测试覆盖 | `npm test` 176 项通过；`npm run lint` 通过；`date=2026-06-11` 下 day=150、week=90、month=90；week/month 页面 HTTP 200 |
| T-016 | 修正站内原生短剧 Excel 导入目录 | 完成 | 排查型 Agent + 实现型 Agent | `captures/原生短剧数据/0611`、页面导入报错 | `lib/native-rankings.js` 默认目录扩展、最新完整导出目录回退、README 同步、测试覆盖 | `node --test tests/native-import.test.mjs`、`npm test`、`npm run lint` 通过；API 导入 `date=2026-06-11` 成功使用 `0611` 并入库为 `2026-06-10` |
| T-017 | 审计并清理本地测试展示数据 | 完成 | 排查型 Agent | 当前 SQLite、小说库页面反馈 | 删除 `ranking_entries.data_kind=sample`、`novel_mappings.source_ref=sample`、`collection_runs.mode=sample` 和用户确认删除的 `manual-form` 映射 | sample 残留计数为 0；`manual-form` 残留计数为 0；剩余映射为 `mapping-import:小说短剧漫剧映射.xlsx` 15 条 |
| T-018 | 站内原生短剧筛选改为榜期口径 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、`periodValue` 数据模型 | `components/DashboardClient.jsx` native 筛选绑定 `periodValue`、`app/page.jsx` 默认 latest native period、`lib/rankings.js` latest period 查询、README 同步 | `npm test` 179 项通过；`npm run lint` 通过；浏览器验证旧 URL 自动校准为 `periodValue=2026-06-10` 且 native 日榜显示 60 条 |
| T-019 | 隐藏 DataEye 固定全量采集板块 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、DataEye 当前筛选采集入口 | `components/DashboardClient.jsx` 移除固定全量采集 section、README 同步、测试覆盖 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证 DataEye 页不再展示全量采集板块，当前筛选入口仍可见 |
| T-020 | 隐藏 DataEye 模拟采集按钮 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、DataEye 真实采集边界 | `components/DashboardClient.jsx` 移除 DataEye 模拟采集按钮、README 同步、测试覆盖 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证 DataEye 页不再展示模拟采集按钮，真实预检/采集入口仍可见 |
| T-021 | 隐藏 DataEye 榜期文本筛选入口 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、`periodValue` 数据模型 | `components/DashboardClient.jsx` 移除 DataEye toolbar 榜期输入、README 同步、测试覆盖 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证 DataEye 筛选区不再展示榜期输入，表格榜期列仍可见 |
| T-022 | 隐藏榜单页页头动作组 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、现有抓包 API | `components/DashboardClient.jsx` 移除页头 `header-actions`、README 同步、测试覆盖 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证页头不再展示上传抓包、生成报告、导入模拟小说库和模拟采集入口 |
| T-023 | 隐藏榜单表格类型列 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、现有 `dramaType` 数据模型 | `components/DashboardClient.jsx` 移除表格类型列、测试覆盖、主控文档同步 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证表格不再展示类型列，数据行仍正常 |
| T-024 | 红果漫剧榜隐藏周期切换 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、`DATAEYE_RANKING_DEFINITIONS.periods` | `components/DashboardClient.jsx` 按单周期 DataEye 榜单隐藏 `period-switch`，`app/page.jsx` 允许当前 DataEye 新榜单 ID，测试覆盖、主控文档同步 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证 `rankType=119` 不展示日榜/周榜/月榜切换，其他多周期榜单仍展示 |
| T-025 | 来源 Tab 切换自动定位最新榜期 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、现有 `ranking_entries` 日期与榜期数据 | `/api/rankings/latest`、`getLatestRankingDate` scope 过滤、前端来源 Tab 切换最新榜期应用、测试覆盖、主控文档同步 | 目标测试、`npm test`、`npm run lint` 通过；浏览器验证从 DataEye 切到站内原生短剧自动定位到最新 native 榜期，再切回 DataEye 自动定位到最新 DataEye 日期 |
| T-026 | 榜单匹配平台 id 与首次进入默认匹配筛选 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、`novels.platform_id`、现有精确匹配结果 | `listRankingEntries` 返回 `matchedNovelPlatformIds`、榜单表格新增平台 id 列、首屏默认匹配筛选逻辑、测试覆盖、主控文档同步 | 平台 id 位于对应小说名称后；未匹配或无平台 id 时为空；无显式 `match` URL 首屏有已匹配则默认已匹配，无已匹配则回退全部；显式 `match` 不被覆盖 |
| T-027 | 隐藏 DataEye 抓包榜单导入入口 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、现有抓包导入 CLI/API | `components/DashboardClient.jsx` 移除抓包导入按钮和前端函数、README CLI-only 说明、测试覆盖、主控文档同步 | 页面不再展示 `导入 DataEye / 剧查查抓包榜单`；后台 `app/api/capture/import` 保留；目标测试、lint 和浏览器验收通过 |
| T-028 | 隐藏 DataEye 当前筛选预检入口 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、现有预检 API | `components/DashboardClient.jsx` 移除预检按钮和前端函数、README CLI/API 说明、测试覆盖、主控文档同步 | 页面不再展示 `预检当前筛选 DataEye / 剧查查`；后台 `app/api/collect/preview` 保留；目标测试、lint 和页面 HTML 验收通过 |
| T-029 | 顶层来源 Tab 改名为剧查查 | 完成 | 实现型 Agent + 验证型 Agent | 用户页面反馈、现有 `sourceTabs` | `components/DashboardClient.jsx` 来源 Tab 文案调整、测试覆盖、主控文档同步 | 顶层来源 Tab 显示 `剧查查`；底层 `source=dataeye` 和 `sourceLabels.dataeye` 仍保留 DataEye / 剧查查 语义 |

## 线程索引

| 线程 | 目标 | 状态 | 输入 | 结束条件 |
| --- | --- | --- | --- | --- |
| 主控线程 | 维护项目状态、分支、文档、风险和任务边界 | 进行中 | 当前仓库、Git、运行报告、用户决策 | 每轮结束时状态、下一步、Git 建议清楚 |
| DataEye 全量采集线程 | 验证新 4 个 DataEye 目标榜单与 day/week/month 周期 | 完成 | `.env.local.dataeye`、`captures/dataeye/2026-06-11`、SQLite | `docs/live-collection-preview.md`、`docs/live-collection-run.md`、SQLite live 数据 | 330 行预检 ready；live 落库新增 330 条；页面日期 `2026-06-11` 下日榜/周榜/月榜均可查询；`红果漫剧榜` 只确认 day，week/month 按不支持记录 |
| 登录态稳定性线程 | 验证抓包刷新登录态和日常调度是否可靠 | 待启动 | Proxyman/Charles 抓包材料、capture scripts | 给出可稳定执行路径或阻塞原因 |
| 原生 Excel 数据接入线程 | 将 `原生短剧数据` 或 `captures/原生短剧数据` 作为站内原生短剧来源入库并展示 | 完成 | `day.xlsx`、`week.xlsx`、`month.xlsx` | CLI/API/UI 可导入并展示；页面日期无匹配导出目录时可回退到最新完整导出目录；小说匹配复用现有精确匹配 |
| 小说库管理优化线程 | 将小说库改为本地 Excel/CSV 主库导入 + 单页映射维护，并支持独立映射 Excel 导入和映射核对筛选 | 完成 | 本地小说主库导出字段、映射 Excel、`novels`、`novel_mappings`、`/novels` 页面 | 小说主库可导入和搜索，映射 Excel 可批量写入映射，小说/短剧模糊搜索和映射状态筛选可用，榜单页回填短剧名路径保留 |

## Git 记录

| 项 | 状态 |
| --- | --- |
| 当前工作分支 | `codex/fiction-get` |
| 上游 | `origin/main` 为分支来源；推送目标为 `origin/codex/fiction-get` |
| 分支来源 | 最新 `origin/main` |
| 远端状态 | 本轮提交目标为 `origin/codex/fiction-get`，PR 待创建或更新 |
| 最近已合并功能 | PR #6：站内原生短剧 Tab 与 Excel 导入 |
| 最近主控提交 | T-009：固化总控职责必读文件 |
| 本轮提交边界 | T-013 至 T-029：小说库表格与筛选简化、DataEye 新 4 榜单与页面核对优化、站内原生短剧导入目录修正、匹配平台 id、入口隐藏与来源 Tab 文案调整 |
| 暂存说明 | `docs/capture-import.md`、`docs/dataeye-login-refresh.md`、`docs/live-collection-preview.md`、`docs/live-collection-run.md` 属运行报告，`Dify-flow/`、`assess/`、`app/novels/*.csv` 属本地数据/材料，均排除本次提交 |

## 风险与阻塞清单

| 风险 | 等级 | 当前判断 | 应对 |
| --- | --- | --- | --- |
| 登录态过期导致 live 采集失败 | 高 | DataEye 登录态依赖用户本地 `.env.local.dataeye` | live 前必须预检；失败不落库 |
| 旧 DataEye motionComic 材料失效 | 中 | 2026-06-11 `captures/dataeye/2026-06-10/day` 的 3 个旧 HAR 复现返回业务 `statusCode=401`；已不作为当前日常采集目标 | 使用 `captures/dataeye/2026-06-11` 新 4 榜单材料和 `.env.local.dataeye` 重新预检 |
| 生成报告文档容易成为脏工作区 | 中 | `docs/*preview*`、`docs/*refresh*` 会随运行更新 | 运行报告默认不随代码提交，提交前单独判断 |
| 抓包材料散装导致误选旧 HAR | 中 | 根目录已有多批 Charles/Proxyman/cURL 混放 | 后续按 `captures/dataeye/<date>/<period>/` 归档，脚本递归读取 |
| 原始 Excel 数据误提交 | 中 | `原生短剧数据/0610` 存在 day/week/month xlsx | 作为本地输入材料忽略，接入前先做字段评估 |
| dev server 与 `next build` 共用 `.next` 导致页面异常 | 中 | 2026-06-10 曾在 dev server 运行时执行 `next build`，覆盖 `.next` 后运行态出现 404/500 和页面无 UI | 构建前先停止 dev server，或构建后执行 `rm -rf .next` 并重启 `screen` 会话 |
| 原生 Excel 重复剧名导致跳过 | 中 | `0610` 有 998 条有效行，SQLite 新增 994 条、跳过 4 条同周期同名数据 | 维持现有唯一约束，后续如要保留同名多条需新增站内唯一 ID 字段 |
| 站内原生短剧页面日期与导出日期错位 | 中 | 页面日期是数据日期，Excel 目录日期是导出日期；当前 `0611` 目录实际入库 `2026-06-10` | 导入器继续执行 T-1 规则；当所选日期无 T+1 目录时只回退到最新完整导出目录，并在返回结果中明确 `exportDate` 和 `rankingDate` |
| README 或历史报告口径滞后 | 中 | README 曾保留 rankType 2/3 旧映射 | 代码源以 `lib/dataeye-rankings.js` 为准，主控文档登记同步要求 |
| 未命名 rankType 被误认为已确认榜单 | 中 | 探测会入库 `rankType=4..20` | 前端只展示已命名榜单，报告保留未命名提示 |
| DataEye 旧榜单名继续误导日常采集 | 中 | 当前日常采集目标已切到 4 个新接口，旧 `motionComic rankType=0..3` 仅保留兼容 | README、主控文档和代码源统一以 `lib/dataeye-rankings.js` 为准；新增测试覆盖新端点 |
| 红果真实采集误启动 | 中 | 红果接口未验证 | 页面和脚本维持暂停，不进入 live |

## 下一步行动

1. 推送 `codex/fiction-get` 后创建或更新 PR，审查重点放在小说库映射、DataEye 新 4 榜单、站内原生短剧导入和榜单核对 UI。
2. 运行报告和本地数据材料继续保持未提交，后续如需沉淀报告再单独开文档任务。
3. 下一步在页面继续核对 `2026-06-11` 的 DataEye live 数据和站内原生短剧匹配结果。
