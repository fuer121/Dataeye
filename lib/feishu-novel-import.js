import { buildFeishuConfig, FeishuImportError, fetchFeishuNovelRows } from "./feishu.js";
import { normalizeNovelMappingRows, upsertNovelMappings } from "./novels.js";

export async function importFeishuNovelMappings({ env = process.env, fetchImpl = fetch } = {}) {
  const rows = await fetchFeishuNovelRows(buildFeishuConfig(env), fetchImpl);
  const mappings = normalizeNovelMappingRows(rows);

  if (mappings.length === 0) {
    throw new FeishuImportError(
      "飞书表格没有可导入的小说映射。请检查 range 是否包含表头：小说名称、短剧/漫剧名称。"
    );
  }

  const changedCount = upsertNovelMappings(mappings);

  return {
    changedCount,
    rowCount: rows.length,
    mappingCount: mappings.length
  };
}
