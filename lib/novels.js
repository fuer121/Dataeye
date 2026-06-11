import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";

import { getDb } from "./db.js";
import { normalizeTitle } from "./matching.js";

export const sampleNovelMappings = [
  {
    novelName: "重生后我成了漫画女主",
    dramaTitle: "重生后我成了漫画女主",
    relationType: "exact",
    sourceRef: "sample"
  },
  {
    novelName: "开局捡到战神夫君",
    dramaTitle: "捡到战神夫君后我爆红了",
    relationType: "exact",
    sourceRef: "sample"
  },
  {
    novelName: "玄门小祖宗下山了",
    dramaTitle: "玄门小祖宗",
    relationType: "exact",
    sourceRef: "sample"
  },
  {
    novelName: "总裁夫人她会读心",
    dramaTitle: "读心夫人不好惹",
    relationType: "exact",
    sourceRef: "sample"
  }
];

export function upsertNovelMappings(mappings) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO novel_mappings (
      novel_name, drama_title, normalized_drama_title, relation_type, source_ref, updated_at
    )
    VALUES (
      @novelName, @dramaTitle, @normalizedDramaTitle, @relationType, @sourceRef, CURRENT_TIMESTAMP
    )
    ON CONFLICT(normalized_drama_title, novel_name) DO UPDATE SET
      drama_title = excluded.drama_title,
      relation_type = excluded.relation_type,
      source_ref = excluded.source_ref,
      updated_at = CURRENT_TIMESTAMP
  `);

  const run = db.transaction((rows) => {
    let changedCount = 0;
    for (const row of rows) {
      const novelName = cleanTitle(row.novelName);
      const dramaTitle = cleanTitle(row.dramaTitle);
      const result = insert.run({
        novelName,
        dramaTitle,
        normalizedDramaTitle: normalizeTitle(dramaTitle),
        relationType: row.relationType || "exact",
        sourceRef: row.sourceRef || "manual"
      });
      changedCount += result.changes;
    }
    return changedCount;
  });

  return run(mappings);
}

export function upsertNovels(novels) {
  const normalized = normalizeNovelRows(novels);
  const db = getDb();
  const findByBookId = db.prepare("SELECT id FROM novels WHERE book_id = ?");
  const findByNormalizedName = db.prepare("SELECT id FROM novels WHERE normalized_novel_name = ?");
  const insert = db.prepare(`
    INSERT INTO novels (
      platform_id, book_id, novel_name, normalized_novel_name,
      author, category_level1, category_level2, reader_preference, source_ref,
      updated_at
    )
    VALUES (
      @platformId, @bookId, @novelName, @normalizedNovelName,
      @author, @categoryLevel1, @categoryLevel2, @readerPreference, @sourceRef,
      CURRENT_TIMESTAMP
    )
  `);
  const update = db.prepare(`
    UPDATE novels
    SET
      platform_id = @platformId,
      book_id = COALESCE(@bookId, book_id),
      novel_name = @novelName,
      normalized_novel_name = @normalizedNovelName,
      author = @author,
      category_level1 = @categoryLevel1,
      category_level2 = @categoryLevel2,
      reader_preference = @readerPreference,
      source_ref = @sourceRef,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);

  const run = db.transaction((rows) => {
    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of rows) {
      const params = toNovelDbParams(row);
      const existing =
        (params.bookId ? findByBookId.get(params.bookId) : null) ||
        findByNormalizedName.get(params.normalizedNovelName);

      if (existing) {
        update.run({ ...params, id: existing.id });
        updatedCount += 1;
      } else {
        insert.run(params);
        insertedCount += 1;
      }
    }

    return { insertedCount, updatedCount, skippedCount: 0 };
  });

  return { ...run(normalized.rows), skippedCount: normalized.skippedCount };
}

export function updateNovelMapping(id, mapping) {
  const db = getDb();
  const novelName = cleanTitle(mapping.novelName);
  const dramaTitle = cleanTitle(mapping.dramaTitle);

  const result = db
    .prepare(`
      UPDATE novel_mappings
      SET
        novel_name = @novelName,
        drama_title = @dramaTitle,
        normalized_drama_title = @normalizedDramaTitle,
        relation_type = @relationType,
        source_ref = @sourceRef,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `)
    .run({
      id,
      novelName,
      dramaTitle,
      normalizedDramaTitle: normalizeTitle(dramaTitle),
      relationType: mapping.relationType || "manual",
      sourceRef: mapping.sourceRef || "manual-form"
    });

  return result.changes;
}

export function deleteNovelMapping(id) {
  const db = getDb();
  return db.prepare("DELETE FROM novel_mappings WHERE id = ?").run(id).changes;
}

export function importSampleNovelMappings() {
  return upsertNovelMappings(sampleNovelMappings);
}

export function importNovelMappingsFromFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const format = path.extname(filePath).toLowerCase() === ".json" ? "json" : "csv";
  return importNovelMappingsFromText(text, format);
}

export function importNovelMappingsFromText(text, format = "csv") {
  const mappings = parseNovelMappingsText(text, format);
  return upsertNovelMappings(mappings);
}

export function importNovelMappingsFromRows(rows) {
  return upsertNovelMappings(normalizeNovelMappingRows(rows));
}

export function importNovelMappingsWorkbookFromBuffer(
  buffer,
  fileName = "novel-mappings.xlsx",
  sourceRef = `mapping-import:${fileName}`
) {
  const workbook = XLSX.read(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer), {
    type: "buffer",
    cellDates: false
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return emptyNovelMappingImportResult();
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false
  });
  return importNovelMappingsWorkbookFromRows(rows, sourceRef);
}

export function importNovelMappingsWorkbookFromRows(rows, sourceRef = "mapping-import") {
  const mappingRows = normalizeNovelMappingRows(rows).map((row) => ({
    ...row,
    sourceRef: row.sourceRef === "file-import" ? sourceRef : row.sourceRef || sourceRef
  }));
  const novelResult = ensureNovelsForMappings(mappingRows, sourceRef);
  const mappingChangedCount = mappingRows.length ? upsertNovelMappings(mappingRows) : 0;

  return {
    totalRows: Array.isArray(rows) ? rows.length : 0,
    validRows: mappingRows.length,
    createdNovelCount: novelResult.createdNovelCount,
    existingNovelCount: novelResult.existingNovelCount,
    mappingChangedCount,
    skippedCount: Math.max((Array.isArray(rows) ? rows.length : 0) - mappingRows.length, 0),
    errors: []
  };
}

export function importNovelLibraryFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const sourceRef = `file-import:${path.basename(filePath)}`;
  if (ext === ".xlsx" || ext === ".xls") {
    return importNovelLibraryFromBuffer(fs.readFileSync(filePath), path.basename(filePath), sourceRef);
  }
  const format = ext === ".json" ? "json" : "csv";
  return importNovelLibraryFromText(fs.readFileSync(filePath, "utf8"), format, sourceRef);
}

export function importNovelLibraryFromBuffer(buffer, fileName = "novels.xlsx", sourceRef = `file-import:${fileName}`) {
  const workbook = XLSX.read(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer), {
    type: "buffer",
    cellDates: false
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return emptyNovelImportResult();
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    defval: "",
    raw: false
  });
  return importNovelLibraryFromRows(rows, sourceRef);
}

export function importNovelLibraryFromText(text, format = "csv", sourceRef = "file-import") {
  const rows = parseNovelLibraryText(text, format);
  return importNovelLibraryFromRows(rows, sourceRef);
}

export function importNovelLibraryFromRows(rows, sourceRef = "file-import") {
  const normalized = normalizeNovelRows(rows, sourceRef);
  const novelResult = upsertNovels(normalized.rows);
  const mappingRows = normalizeNovelMappingRows(rows).map((row) => ({
    ...row,
    sourceRef: row.sourceRef || sourceRef
  }));
  const mappingChangedCount = mappingRows.length ? upsertNovelMappings(mappingRows) : 0;

  return {
    insertedCount: novelResult.insertedCount,
    updatedCount: novelResult.updatedCount,
    skippedCount: normalized.skippedCount,
    mappingChangedCount,
    totalRows: Array.isArray(rows) ? rows.length : 0
  };
}

export function parseNovelMappingsText(text, format = "csv") {
  if (format === "json") {
    return normalizeNovelMappingRows(JSON.parse(text));
  }

  return normalizeNovelMappingRows(parseCsv(text));
}

export function listNovelMappings(query = "") {
  const db = getDb();
  const trimmed = query.trim();
  const params = {};
  let whereSql = "";

  if (trimmed) {
    whereSql = "WHERE novel_name LIKE @query OR drama_title LIKE @query";
    params.query = `%${trimmed}%`;
  }

  return db
    .prepare(`
      SELECT
        id,
        novel_name AS novelName,
        drama_title AS dramaTitle,
        relation_type AS relationType,
        source_ref AS sourceRef,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM novel_mappings
      ${whereSql}
      ORDER BY updated_at DESC, id DESC
    `)
    .all(params);
}

export function listNovels(query = "") {
  const db = getDb();
  const trimmed = query.trim();
  const params = {};
  let whereSql = "";

  if (trimmed) {
    whereSql = "WHERE novel_name LIKE @query OR book_id LIKE @query OR author LIKE @query";
    params.query = `%${trimmed}%`;
  }

  const rows = db
    .prepare(`
      SELECT
        id,
        platform_id AS platformId,
        book_id AS bookId,
        novel_name AS novelName,
        author,
        category_level1 AS categoryLevel1,
        category_level2 AS categoryLevel2,
        reader_preference AS readerPreference,
        source_ref AS sourceRef,
        created_at AS createdAt,
        updated_at AS updatedAt,
        normalized_novel_name AS normalizedNovelName
      FROM novels
      ${whereSql}
      ORDER BY updated_at DESC, id DESC
    `)
    .all(params);

  if (!rows.length) return [];

  const mappings = db
    .prepare(`
      SELECT novel_name AS novelName, drama_title AS dramaTitle
      FROM novel_mappings
      ORDER BY id ASC
    `)
    .all();
  const mappedByNovel = new Map();
  for (const mapping of mappings) {
    const novelName = cleanTitle(mapping.novelName);
    if (!novelName) continue;
    if (!mappedByNovel.has(novelName)) mappedByNovel.set(novelName, []);
    mappedByNovel.get(novelName).push(mapping.dramaTitle);
  }

  return rows
    .map((row) => {
      const dramaTitles = mappedByNovel.get(cleanTitle(row.novelName)) || [];
      return {
        ...row,
        mappingCount: dramaTitles.length,
        mappingMatched: dramaTitles.length > 0,
        dramaTitles
      };
    })
    .sort((left, right) => {
      const matchedDelta = Number(right.mappingMatched) - Number(left.mappingMatched);
      if (matchedDelta) return matchedDelta;
      const updatedDelta = String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
      if (updatedDelta) return updatedDelta;
      return Number(right.id || 0) - Number(left.id || 0);
    });
}

export const listNovelLibrary = listNovels;

export function normalizeNovelRows(rows, sourceRef = "file-import") {
  if (!Array.isArray(rows)) return { rows: [], skippedCount: 0 };

  const novels = [];
  let skippedCount = 0;
  for (const row of rows) {
    const novelName = cleanTitle(readField(row, ["novelName", "novel_name", "书名", "小说名称", "小说名"]));
    if (!novelName) {
      skippedCount += 1;
      continue;
    }

    novels.push({
      platformId: cleanText(readField(row, ["platformId", "platform_id", "平台ID"])),
      bookId: cleanText(readField(row, ["bookId", "book_id", "书库ID", "书籍ID"])),
      novelName,
      normalizedNovelName: normalizeTitle(novelName),
      author: cleanText(readField(row, ["author", "作者"])),
      categoryLevel1: cleanText(readField(row, ["categoryLevel1", "category_level1", "一级分类"])),
      categoryLevel2: cleanText(readField(row, ["categoryLevel2", "category_level2", "二级分类"])),
      readerPreference: cleanText(readField(row, ["readerPreference", "reader_preference", "阅读偏好"])),
      sourceRef: cleanText(readField(row, ["sourceRef", "source_ref", "来源", "来源标识"])) || sourceRef
    });
  }

  return { rows: novels, skippedCount };
}

export function normalizeNovelMappingRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const novelName = cleanTitle(readField(row, ["novelName", "novel_name", "书名", "小说名称", "小说名"]));
      const dramaTitle = cleanTitle(
        readField(row, ["dramaTitle", "drama_title", "短剧/漫剧名称", "短剧/漫剧名", "短剧名称", "漫剧名称", "剧名"])
      );
      if (!novelName || !dramaTitle) return null;

      return {
        novelName,
        dramaTitle,
        relationType: readField(row, ["relationType", "relation_type", "关系类型", "对应关系"]) || "exact",
        sourceRef: readField(row, ["sourceRef", "source_ref", "来源", "来源标识"]) || "file-import"
      };
    })
    .filter(Boolean);
}

function parseNovelLibraryText(text, format = "csv") {
  if (format === "json") {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  }

  return parseCsv(text);
}

function toNovelDbParams(row) {
  return {
    platformId: row.platformId || null,
    bookId: row.bookId || null,
    novelName: row.novelName,
    normalizedNovelName: row.normalizedNovelName || normalizeTitle(row.novelName),
    author: row.author || "",
    categoryLevel1: row.categoryLevel1 || "",
    categoryLevel2: row.categoryLevel2 || "",
    readerPreference: row.readerPreference || "",
    sourceRef: row.sourceRef || "file-import"
  };
}

function ensureNovelsForMappings(mappings, sourceRef = "mapping-import") {
  const db = getDb();
  const findByNormalizedName = db.prepare("SELECT id FROM novels WHERE normalized_novel_name = ?");
  const insert = db.prepare(`
    INSERT INTO novels (
      novel_name, normalized_novel_name, source_ref, updated_at
    )
    VALUES (
      @novelName, @normalizedNovelName, @sourceRef, CURRENT_TIMESTAMP
    )
  `);

  const run = db.transaction((rows) => {
    let createdNovelCount = 0;
    let existingNovelCount = 0;
    const seen = new Set();

    for (const row of rows) {
      const novelName = cleanTitle(row.novelName);
      const normalizedNovelName = normalizeTitle(novelName);
      if (!novelName || !normalizedNovelName || seen.has(normalizedNovelName)) continue;
      seen.add(normalizedNovelName);

      const existing = findByNormalizedName.get(normalizedNovelName);
      if (existing) {
        existingNovelCount += 1;
      } else {
        insert.run({
          novelName,
          normalizedNovelName,
          sourceRef
        });
        createdNovelCount += 1;
      }
    }

    return { createdNovelCount, existingNovelCount };
  });

  return run(mappings);
}

function emptyNovelImportResult() {
  return {
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    mappingChangedCount: 0,
    totalRows: 0
  };
}

function emptyNovelMappingImportResult() {
  return {
    totalRows: 0,
    validRows: 0,
    createdNovelCount: 0,
    existingNovelCount: 0,
    mappingChangedCount: 0,
    skippedCount: 0,
    errors: []
  };
}

function readField(row, names) {
  for (const name of names) {
    if (row[name] != null && String(row[name]).trim()) return String(row[name]).trim();
  }
  return "";
}

function cleanTitle(value) {
  return String(value || "")
    .trim()
    .replace(/^《(.+)》$/, "$1");
}

function cleanText(value) {
  return String(value || "").trim();
}

function parseCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length < 2) return [];

  const headers = rows[0].map((cell, index) => (index === 0 ? stripBom(cell) : cell).trim());
  return rows.slice(1).map((row) =>
    headers.reduce((acc, header, index) => {
      acc[header] = row[index] ?? "";
      return acc;
    }, {})
  );
}

function stripBom(value) {
  return String(value || "").replace(/^\uFEFF/, "");
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}
