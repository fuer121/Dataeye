#!/usr/bin/env node
import { importFeishuNovelMappings } from "../lib/feishu-novel-import.js";
import { maskSensitiveValue, readEnvLocal, rel, writeMarkdown } from "./capture-utils.js";

applyEnvLocal();
applyArgs(process.argv.slice(2));

const startedAt = Date.now();
let result;

try {
  const importResult = await importFeishuNovelMappings();
  result = {
    ok: true,
    changedCount: importResult.changedCount,
    rowCount: importResult.rowCount,
    mappingCount: importResult.mappingCount,
    error: "",
    env: summarizeEnv()
  };
} catch (error) {
  result = {
    ok: false,
    changedCount: 0,
    rowCount: 0,
    mappingCount: 0,
    error: error.message,
    env: summarizeEnv()
  };
}

const output = writeMarkdown("feishu-novel-import.md", renderReport(result));

console.log(`Status: ${result.ok ? "success" : "failed"}`);
console.log(`Rows: ${result.rowCount}`);
console.log(`Imported/updated: ${result.changedCount}`);
console.log(`Wrote ${rel(output)}`);

if (!result.ok) process.exitCode = 1;

function applyEnvLocal() {
  const env = readEnvLocal();
  for (const [key, value] of Object.entries(env)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

function applyArgs(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--spreadsheet") {
      process.env.FEISHU_SPREADSHEET_TOKEN = argv[index + 1] || "";
      index += 1;
    } else if (item === "--sheet") {
      process.env.FEISHU_SHEET_ID = argv[index + 1] || "";
      index += 1;
    } else if (item === "--range") {
      process.env.FEISHU_RANGE = argv[index + 1] || "";
      index += 1;
    }
  }
}

function renderReport(result) {
  const now = new Date().toISOString();
  return `# 飞书小说库导入报告

生成时间：${now}

## 结论

${result.ok ? "飞书小说库导入完成。" : "飞书小说库导入未完成。"}

| 项 | 内容 |
| --- | --- |
| 状态 | ${result.ok ? "success" : "failed"} |
| 读取行数 | ${result.rowCount} |
| 可映射行数 | ${result.mappingCount} |
| 导入/更新映射 | ${result.changedCount} |
| 耗时 | ${Date.now() - startedAt} ms |
| 错误 | ${result.error || "无"} |

## 环境变量状态

| 变量 | 状态 |
| --- | --- |
${result.env.map((item) => `| ${item.key} | ${item.value} |`).join("\n")}

## 字段要求

飞书表格首行需包含以下字段之一：

| 目标字段 | 支持表头 |
| --- | --- |
| 小说名称 | \`小说名称\`、\`小说名\`、\`novelName\`、\`novel_name\` |
| 短剧/漫剧名称 | \`短剧/漫剧名称\`、\`短剧名称\`、\`漫剧名称\`、\`剧名\`、\`dramaTitle\`、\`drama_title\` |
| 关系类型 | \`关系类型\`、\`对应关系\`、\`relationType\`、\`relation_type\` |
| 来源标识 | \`来源\`、\`来源标识\`、\`sourceRef\`、\`source_ref\` |

## 下一步

${renderNextStep(result)}
`;
}

function renderNextStep(result) {
  if (result.ok) {
    return "- 打开 `/novels` 核对导入映射，再回到榜单页查看匹配结果。";
  }

  return `- 如果缺少配置，请在 \`.env.local\` 中补充飞书应用和表格信息。
- 如果只有 Wiki 链接，请先在飞书中打开实际电子表格，复制 spreadsheet token 和 sheet id。
- 也可以继续使用 \`npm run novels:import -- --file ./data/novel-mappings.csv\` 导入飞书导出的 CSV。`;
}

function summarizeEnv() {
  const keys = [
    "FEISHU_APP_ID",
    "FEISHU_APP_SECRET",
    "FEISHU_TENANT_ACCESS_TOKEN",
    "FEISHU_SPREADSHEET_TOKEN",
    "FEISHU_SHEET_ID",
    "FEISHU_RANGE"
  ];

  return keys.map((key) => ({
    key,
    value: process.env[key] ? maskSensitiveValue(process.env[key]) : "未提供"
  }));
}
