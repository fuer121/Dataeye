# Agent Instructions

每次处理本仓库请求前，必须先读取：

1. `docs/controller-responsibilities.md`
2. `docs/project-control.md`

然后再读取 `git status --short --branch` 与本轮任务相关文件。

执行要求：

- 遵守 `docs/controller-responsibilities.md` 中的总控职责、任务拆解、线程管理、文档同步和 Git 决策标准。
- 以 `docs/project-control.md` 作为项目状态真实信源。
- 不提交 `captures/`、`原生短剧数据/`、`.env.local*` 或其他本地敏感/原始数据文件。
- 不把运行报告类临时变更混入功能提交，除非本轮任务明确要求更新该报告。
- 当前红果 live 仍暂停；DataEye live 仍需有效登录态和预检通过。
