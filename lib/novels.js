import fs from "node:fs";
import path from "node:path";

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

export function normalizeNovelMappingRows(rows) {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      const novelName = cleanTitle(readField(row, ["novelName", "novel_name", "小说名称", "小说名"]));
      const dramaTitle = cleanTitle(
        readField(row, ["dramaTitle", "drama_title", "短剧/漫剧名称", "短剧名称", "漫剧名称", "剧名"])
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

function parseCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length < 2) return [];

  const headers = rows[0].map((cell) => cell.trim());
  return rows.slice(1).map((row) =>
    headers.reduce((acc, header, index) => {
      acc[header] = row[index] ?? "";
      return acc;
    }, {})
  );
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
