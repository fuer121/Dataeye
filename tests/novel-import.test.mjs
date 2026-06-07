import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { resetDbForTests } from "../lib/db.js";
import {
  importNovelMappingsFromFile,
  importNovelMappingsFromText,
  listNovelMappings,
  parseNovelMappingsText,
  deleteNovelMapping,
  updateNovelMapping,
  upsertNovelMappings
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
