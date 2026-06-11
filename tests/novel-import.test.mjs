import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as XLSX from "xlsx";

import { resetDbForTests } from "../lib/db.js";
import {
  importNovelLibraryFromBuffer,
  importNovelLibraryFromText,
  importNovelMappingsWorkbookFromBuffer,
  importNovelMappingsFromFile,
  importNovelMappingsFromText,
  listNovels,
  listNovelMappings,
  parseNovelMappingsText,
  deleteNovelMapping,
  updateNovelMapping,
  upsertNovelMappings,
  upsertNovels
} from "../lib/novels.js";
import { listRankingEntries, upsertRankingEntries } from "../lib/rankings.js";

function useTempDb(name) {
  resetDbForTests(path.join(os.tmpdir(), `${name}-${Date.now()}-${Math.random()}.sqlite`));
}

test("parseNovelMappingsText reads Feishu-style CSV headers", () => {
  const rows = parseNovelMappingsText(
    "小说名称,短剧/漫剧名称,关系类型\n《逆袭小说》,\"弃子逆袭，从烂瓦房到商界大佬\",exact\n",
    "csv"
  );

  assert.deepEqual(rows, [
    {
      novelName: "逆袭小说",
      dramaTitle: "弃子逆袭，从烂瓦房到商界大佬",
      relationType: "exact",
      sourceRef: "file-import"
    }
  ]);
});

test("importNovelMappingsFromFile imports JSON mappings and enables exact matching", () => {
  useTempDb("novel-import");
  const filePath = path.join(os.tmpdir(), `novel-mappings-${Date.now()}.json`);
  fs.writeFileSync(
    filePath,
    JSON.stringify([
      {
        novelName: "逆袭小说",
        dramaTitle: "弃子逆袭，从烂瓦房到商界大佬",
        relationType: "exact"
      }
    ])
  );

  assert.equal(importNovelMappingsFromFile(filePath), 1);
  assert.equal(listNovelMappings("逆袭").length, 1);

  upsertRankingEntries([
    {
      source: "dataeye",
      rankingDate: "2026-06-05",
      rank: 1,
      title: "弃子逆袭，从烂瓦房到商界大佬",
      heatValue: "1.4亿",
      dramaType: "种田/逆袭/乡村",
      sourceRef: "test"
    }
  ]);

  const rows = listRankingEntries({ date: "2026-06-05", source: "dataeye" });
  assert.equal(rows[0].matchStatus, "matched");
  assert.equal(rows[0].matchedNovelNames, "逆袭小说");
});

test("importNovelMappingsFromText imports uploaded CSV content", () => {
  useTempDb("novel-import-api");
  const changedCount = importNovelMappingsFromText(
    "小说名称,短剧/漫剧名称,关系类型\n逆袭小说,\"弃子逆袭，从烂瓦房到商界大佬\",exact\n",
    "csv"
  );

  assert.equal(changedCount, 1);
  assert.equal(listNovelMappings("逆袭").length, 1);
});

test("importNovelLibraryFromText imports the local book library CSV format", () => {
  useTempDb("novel-library-csv");

  const result = importNovelLibraryFromText(
    [
      "平台ID,书库ID,书名,作者,一级分类,二级分类,阅读偏好",
      "195631,1620893,太荒吞天诀,铁马飞桥,玄幻奇幻,东方玄幻,男生",
      "143170,1512067,剑来,烽火诸侯,武侠仙侠,古典仙侠,男生",
      "1,, ,作者,分类,分类,偏好"
    ].join("\n"),
    "csv",
    "unit-test"
  );

  assert.equal(result.insertedCount, 2);
  assert.equal(result.updatedCount, 0);
  assert.equal(result.skippedCount, 1);
  assert.equal(result.mappingChangedCount, 0);

  const rows = listNovels("太荒");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].platformId, "195631");
  assert.equal(rows[0].bookId, "1620893");
  assert.equal(rows[0].novelName, "太荒吞天诀");
  assert.equal(rows[0].author, "铁马飞桥");
  assert.equal(rows[0].categoryLevel1, "玄幻奇幻");
  assert.equal(rows[0].categoryLevel2, "东方玄幻");
  assert.equal(rows[0].readerPreference, "男生");
});

test("importNovelLibraryFromText updates existing novels by book id", () => {
  useTempDb("novel-library-update");

  importNovelLibraryFromText("书库ID,书名,作者\n1620893,太荒吞天诀,旧作者\n", "csv", "first");
  const result = importNovelLibraryFromText("书库ID,书名,作者\n1620893,太荒吞天诀,铁马飞桥\n", "csv", "second");

  assert.equal(result.insertedCount, 0);
  assert.equal(result.updatedCount, 1);

  const rows = listNovels("太荒");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].author, "铁马飞桥");
});

test("importNovelLibraryFromBuffer imports the first Excel worksheet", () => {
  useTempDb("novel-library-xlsx");

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([
    {
      平台ID: "195631",
      书库ID: "1620893",
      书名: "太荒吞天诀",
      作者: "铁马飞桥",
      一级分类: "玄幻奇幻",
      二级分类: "东方玄幻",
      阅读偏好: "男生"
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "书籍数据");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const result = importNovelLibraryFromBuffer(buffer, "books.xlsx", "xlsx-unit-test");

  assert.equal(result.insertedCount, 1);
  assert.equal(listNovels("太荒")[0].bookId, "1620893");
});

test("importNovelLibraryFromText writes mappings when drama title is present", () => {
  useTempDb("novel-library-with-mapping");

  const result = importNovelLibraryFromText(
    "书库ID,书名,短剧/漫剧名称\nb-1,商圈换血原著,全家一起搬，商圈大换血\n",
    "csv",
    "mapping-import"
  );

  assert.equal(result.insertedCount, 1);
  assert.equal(result.mappingChangedCount, 1);
  assert.equal(listNovelMappings("商圈换血").length, 1);
});

test("listNovels returns mapped drama titles for each master novel", () => {
  useTempDb("novel-library-mapped-titles");

  upsertNovels([
    {
      bookId: "b-1",
      novelName: "商圈换血原著",
      author: "作者"
    }
  ]);
  upsertNovelMappings([
    {
      novelName: "商圈换血原著",
      dramaTitle: "全家一起搬，商圈大换血",
      relationType: "manual",
      sourceRef: "manual"
    }
  ]);

  const rows = listNovels("商圈");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].mappingCount, 1);
  assert.equal(rows[0].mappingMatched, true);
  assert.deepEqual(rows[0].dramaTitles, ["全家一起搬，商圈大换血"]);
});

test("importNovelMappingsWorkbookFromBuffer creates missing novels and mappings from attachment headers", () => {
  useTempDb("novel-mapping-workbook-create");

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([
    {
      小说名称: "我开养老院爆火后，全家火葬场",
      "短剧/漫剧名称": "我的养老院，个个是大佬"
    },
    {
      小说名称: "",
      "短剧/漫剧名称": "缺小说名"
    },
    {
      小说名称: "缺短剧名",
      "短剧/漫剧名称": ""
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const result = importNovelMappingsWorkbookFromBuffer(buffer, "小说短剧漫剧映射.xlsx");

  assert.equal(result.totalRows, 3);
  assert.equal(result.validRows, 1);
  assert.equal(result.createdNovelCount, 1);
  assert.equal(result.existingNovelCount, 0);
  assert.equal(result.mappingChangedCount, 1);
  assert.equal(result.skippedCount, 2);

  const rows = listNovels("养老院");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].novelName, "我开养老院爆火后，全家火葬场");
  assert.equal(rows[0].mappingMatched, true);
  assert.deepEqual(rows[0].dramaTitles, ["我的养老院，个个是大佬"]);
});

test("importNovelMappingsWorkbookFromBuffer does not blank existing novel metadata", () => {
  useTempDb("novel-mapping-workbook-existing");

  upsertNovels([
    {
      platformId: "p-1",
      bookId: "b-1",
      novelName: "京婚浓瘾",
      author: "不绿兔",
      categoryLevel1: "现代言情",
      categoryLevel2: "豪门总裁",
      readerPreference: "女生"
    }
  ]);

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet([
    {
      小说名称: "京婚浓瘾",
      "短剧/漫剧名称": "攀枝"
    }
  ]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const result = importNovelMappingsWorkbookFromBuffer(buffer, "mapping.xlsx");

  assert.equal(result.createdNovelCount, 0);
  assert.equal(result.existingNovelCount, 1);
  assert.equal(result.mappingChangedCount, 1);

  const rows = listNovels("京婚");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].platformId, "p-1");
  assert.equal(rows[0].bookId, "b-1");
  assert.equal(rows[0].author, "不绿兔");
  assert.equal(rows[0].categoryLevel1, "现代言情");
  assert.equal(rows[0].categoryLevel2, "豪门总裁");
  assert.equal(rows[0].readerPreference, "女生");
  assert.deepEqual(rows[0].dramaTitles, ["攀枝"]);
});

test("listNovels sorts mapped novels before unmapped novels", () => {
  useTempDb("novel-library-mapped-first");

  upsertNovels([
    {
      novelName: "未映射小说"
    },
    {
      novelName: "已映射小说"
    }
  ]);
  upsertNovelMappings([
    {
      novelName: "已映射小说",
      dramaTitle: "已映射短剧",
      relationType: "manual",
      sourceRef: "manual"
    }
  ]);

  const rows = listNovels("");
  assert.equal(rows[0].novelName, "已映射小说");
  assert.equal(rows[0].mappingMatched, true);
  assert.equal(rows[1].novelName, "未映射小说");
  assert.equal(rows[1].mappingMatched, false);
});

test("listNovels filters by novel name or mapped drama title", () => {
  useTempDb("novel-library-fuzzy-filter");

  upsertNovels([
    {
      novelName: "京婚浓瘾"
    },
    {
      novelName: "未命中小说"
    }
  ]);
  upsertNovelMappings([
    {
      novelName: "京婚浓瘾",
      dramaTitle: "攀枝",
      relationType: "manual",
      sourceRef: "manual"
    }
  ]);

  assert.deepEqual(
    listNovels("京婚").map((row) => row.novelName),
    ["京婚浓瘾"]
  );
  assert.deepEqual(
    listNovels("攀枝").map((row) => row.novelName),
    ["京婚浓瘾"]
  );
});

test("listNovels pushes search and mapping filters into SQLite before enrichment", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/novels.js"), "utf8");

  assert.match(source, /const where = \[\];/);
  assert.match(source, /EXISTS \(/);
  assert.match(source, /WHERE \$\{whereSql\}/);
  assert.match(source, /novel_name IN/);
});

test("listNovels filters by mapping matched state", () => {
  useTempDb("novel-library-match-filter");

  upsertNovels([
    {
      novelName: "已映射小说"
    },
    {
      novelName: "未映射小说"
    }
  ]);
  upsertNovelMappings([
    {
      novelName: "已映射小说",
      dramaTitle: "已映射短剧",
      relationType: "manual",
      sourceRef: "manual"
    }
  ]);

  assert.deepEqual(
    listNovels("", { match: "matched" }).map((row) => row.novelName),
    ["已映射小说"]
  );
  assert.deepEqual(
    listNovels("", { match: "unmatched" }).map((row) => row.novelName),
    ["未映射小说"]
  );
});

test("listNovels returns an empty list for an empty library", () => {
  useTempDb("novel-library-empty");

  assert.deepEqual(listNovels(""), []);
});

test("upsertNovelMappings updates an existing manual mapping", () => {
  useTempDb("novel-manual-upsert");

  assert.equal(
    upsertNovelMappings([
      {
        novelName: "逆袭小说",
        dramaTitle: "弃子逆袭，从烂瓦房到商界大佬",
        relationType: "exact",
        sourceRef: "manual"
      }
    ]),
    1
  );
  assert.equal(
    upsertNovelMappings([
      {
        novelName: "逆袭小说",
        dramaTitle: "弃子逆袭，从烂瓦房到商界大佬",
        relationType: "manual",
        sourceRef: "manual-form"
      }
    ]),
    1
  );

  const rows = listNovelMappings("逆袭小说");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].relationType, "manual");
  assert.equal(rows[0].sourceRef, "manual-form");
});

test("upsertNovelMappings cleans manual titles and matches live DataEye rows", () => {
  useTempDb("novel-manual-clean-title");

  assert.equal(
    upsertNovelMappings([
      {
        novelName: "《商圈换血原著》",
        dramaTitle: "《全家一起搬，商圈大换血》",
        relationType: "manual",
        sourceRef: "manual-form"
      }
    ]),
    1
  );
  upsertRankingEntries([
    {
      source: "dataeye",
      dataKind: "live",
      rankingDate: "2026-06-06",
      rank: 1,
      title: "全家一起搬，商圈大换血",
      heatValue: "1.9亿",
      dramaType: "都市日常/现代/逆袭/剧情",
      sourceRef: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-06&rankType=0"
    }
  ]);

  const mappings = listNovelMappings("商圈换血");
  assert.equal(mappings.length, 1);
  assert.equal(mappings[0].novelName, "商圈换血原著");
  assert.equal(mappings[0].dramaTitle, "全家一起搬，商圈大换血");

  const rows = listRankingEntries({ date: "2026-06-06", source: "dataeye", dataKind: "live" });
  assert.equal(rows[0].matchStatus, "matched");
  assert.equal(rows[0].matchedNovelNames, "商圈换血原著");
});

test("manual novel mappings can be updated and deleted by id", () => {
  useTempDb("novel-manual-maintenance");

  upsertNovelMappings([
    {
      novelName: "旧小说",
      dramaTitle: "全家一起搬，商圈大换血",
      relationType: "manual",
      sourceRef: "manual-form"
    }
  ]);
  upsertRankingEntries([
    {
      source: "dataeye",
      dataKind: "live",
      rankingDate: "2026-06-06",
      rank: 1,
      title: "全家一起搬，商圈大换血",
      heatValue: "1.9亿",
      dramaType: "都市日常/现代/逆袭/剧情",
      sourceRef: "test"
    }
  ]);

  const inserted = listNovelMappings("商圈")[0];
  assert.equal(
    updateNovelMapping(inserted.id, {
      novelName: "《商圈换血原著》",
      dramaTitle: "《全家一起搬，商圈大换血》",
      relationType: "manual"
    }),
    1
  );

  let rows = listRankingEntries({ date: "2026-06-06", source: "dataeye", dataKind: "live" });
  assert.equal(rows[0].matchStatus, "matched");
  assert.equal(rows[0].matchedNovelNames, "商圈换血原著");

  assert.equal(deleteNovelMapping(inserted.id), 1);
  rows = listRankingEntries({ date: "2026-06-06", source: "dataeye", dataKind: "live" });
  assert.equal(rows[0].matchStatus, "unmatched");
  assert.equal(rows[0].matchedNovelNames, "未匹配");
});
