#!/usr/bin/env node
import {
  assessRankingReadiness,
  extractRankingArrays,
  listCaptureFiles,
  matchesRequestSource,
  parseCaptureFiles,
  rel,
  sortRankingCandidates,
  writeMarkdown
} from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const files = listCaptureFiles();
const { requests, errors } = parseCaptureFiles(files);
const readyCandidates = requests
  .map((request) => ({ request, readiness: assessRankingReadiness(request.responseBody) }))
  .filter(({ request, readiness }) => request.isLikelyRanking && readiness.ready && matchesRequestSource(request, args.source))
  .sort(compareReadyCandidates);

const output = writeMarkdown(
  "ranking-preview.md",
  renderPreview({ files, requests, errors, readyCandidates, source: args.source })
);

console.log(`Capture files: ${files.length}`);
console.log(`Parsed requests: ${requests.length}`);
console.log(`Ready ranking candidates: ${readyCandidates.length}`);
console.log(`Wrote ${rel(output)}`);

function renderPreview({ files, requests, errors, readyCandidates, source }) {
  const now = new Date().toISOString();

  if (files.length === 0) {
    return `# 榜单数据预览

生成时间：${now}

## 状态

当前 \`/captures\` 目录下没有 HAR、JSON、txt 或 curl 文件，无法生成榜单预览。

请先放入剧查查小程序「漫剧热播榜 + 日榜」抓包材料，然后运行：

\`\`\`bash
npm run capture:pipeline
\`\`\`
`;
  }

  if (readyCandidates.length === 0) {
    return `# 榜单数据预览

生成时间：${now}

## 状态

未找到可预览的榜单数组。

| 项 | 数量 |
| --- | ---: |
| 输入文件 | ${files.length} |
| 解析请求 | ${requests.length} |
| 解析错误 | ${errors.length} |
| 可映射榜单候选 | 0 |
| 来源过滤 | ${source || "全部"} |

请确认抓包材料包含榜单列表接口响应，且首条数据能映射 \`rank\`、\`title\`、\`heatValue\`、\`dramaType\`。
`;
  }

  const { request, readiness } = readyCandidates[0];
  const rows = normalizeRows(request, readiness).slice(0, 50);

  return `# 榜单数据预览

生成时间：${now}

## 来源

| 项 | 内容 |
| --- | --- |
| 来源文件 | \`${rel(request.sourceFile)}\` |
| 请求 ID | \`${request.id}\` |
| HTTP 方法 | ${request.method} |
| URL | ${request.url} |
| 抓包响应状态 | ${request.responseStatus ?? "未提供"} |
| 榜单条数 | ${readiness.rankingCount} |
| 来源过滤 | ${source || "全部"} |

## 字段映射

| 目标字段 | 响应字段 |
| --- | --- |
| \`rank\` | \`${readiness.fields.rank.key}\` |
| \`title\` | \`${readiness.fields.title.key}\` |
| \`heatValue\` | \`${readiness.fields.heatValue.key}\` |
| \`dramaType\` | \`${readiness.fields.dramaType.key}\` |

## 预览前 ${rows.length} 条

${renderRows(rows)}

## 人工核对项

- 排名是否和小程序页面一致。
- 作品名是否是「漫剧热播榜 + 日榜」对应作品。
- 热度值单位是否保留，例如 \`亿\`、\`w\`。
- 类型/标签是否可直接落库为 \`dramaType\`。
- 日期是否和抓包操作日期一致。
`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function compareReadyCandidates(a, b) {
  const sorted = sortRankingCandidates([a.request, b.request]);
  return sorted.indexOf(a.request) - sorted.indexOf(b.request);
}

function normalizeRows(request, readiness) {
  const rows = extractRankingArrays(request.responseBody)[0] || [];
  return rows.map((item) => ({
    rank: getValueByPath(item, readiness.fields.rank.key),
    title: getValueByPath(item, readiness.fields.title.key),
    heatValue: getValueByPath(item, readiness.fields.heatValue.key),
    dramaType: formatValue(getValueByPath(item, readiness.fields.dramaType.key))
  }));
}

function getValueByPath(value, keyPath) {
  return String(keyPath)
    .split(".")
    .reduce((current, key) => (current && typeof current === "object" ? current[key] : undefined), value);
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join("/");
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).join("/");
    } catch {
      return value;
    }
  }
  return value ?? "";
}

function renderRows(rows) {
  if (!rows.length) return "未提取到榜单行。";

  return `| 排名 | 短剧/漫剧名称 | 热度值 | 类型 |
| ---: | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${escapePipes(row.rank)} | ${escapePipes(row.title)} | ${escapePipes(row.heatValue)} | ${escapePipes(row.dramaType)} |`
  )
  .join("\n")}`;
}

function escapePipes(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, "\\n");
}
