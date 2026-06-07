import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { buildFeishuConfig, fetchFeishuNovelRows, valuesToObjects } from "../lib/feishu.js";
import { resetDbForTests } from "../lib/db.js";
import { importNovelMappingsFromRows, listNovelMappings } from "../lib/novels.js";

test("valuesToObjects maps Feishu sheet values by header row", () => {
  const rows = valuesToObjects([
    ["小说名称", "短剧/漫剧名称", "关系类型", "来源"],
    ["玄门小祖宗下山了", "玄门小祖宗", "exact", "feishu"]
  ]);

  assert.deepEqual(rows, [
    {
      小说名称: "玄门小祖宗下山了",
      "短剧/漫剧名称": "玄门小祖宗",
      关系类型: "exact",
      来源: "feishu"
    }
  ]);
});

test("fetchFeishuNovelRows reads sheet values and imports mappings", async () => {
  resetDbForTests(path.join(os.tmpdir(), `feishu-import-${Date.now()}-${Math.random()}.sqlite`));
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("/auth/v3/tenant_access_token/internal")) {
      return new Response(JSON.stringify({ code: 0, tenant_access_token: "tenant-token" }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    return new Response(
      JSON.stringify({
        code: 0,
        data: {
          valueRange: {
            values: [
              ["小说名称", "短剧/漫剧名称", "关系类型", "来源"],
              ["玄门小祖宗下山了", "玄门小祖宗", "exact", "feishu-api"]
            ]
          }
        }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };
  const config = buildFeishuConfig({
    FEISHU_APP_ID: "app-id",
    FEISHU_APP_SECRET: "app-secret",
    FEISHU_SPREADSHEET_TOKEN: "spreadsheet-token",
    FEISHU_SHEET_ID: "sheet-id",
    FEISHU_RANGE: "A:D"
  });

  const rows = await fetchFeishuNovelRows(config, fetchImpl);
  const changedCount = importNovelMappingsFromRows(rows);

  assert.equal(changedCount, 1);
  assert.equal(calls.length, 2);
  assert.match(calls[1].url, /\/sheets\/v2\/spreadsheets\/spreadsheet-token\/values\/sheet-id!A%3AD$/);
  const mappings = listNovelMappings("玄门");
  assert.equal(mappings.length, 1);
  assert.equal(mappings[0].novelName, "玄门小祖宗下山了");
  assert.equal(mappings[0].dramaTitle, "玄门小祖宗");
});

test("import-feishu CLI reports missing config without inserting mappings", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "feishu-import-cli-"));
  const env = { ...process.env };
  for (const key of [
    "FEISHU_APP_ID",
    "FEISHU_APP_SECRET",
    "FEISHU_TENANT_ACCESS_TOKEN",
    "FEISHU_SPREADSHEET_TOKEN",
    "FEISHU_SHEET_ID",
    "FEISHU_RANGE",
    "SQLITE_PATH"
  ]) {
    delete env[key];
  }

  const result = spawnSync("node", [path.join(root, "scripts/import-feishu-novel-mappings.js")], {
    cwd: tempRoot,
    env,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: failed/);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/feishu-novel-import.md"), "utf8");
  assert.match(markdown, /FEISHU_SPREADSHEET_TOKEN/);
  assert.match(markdown, /Wiki 链接不能直接替代表格 token/);
  assert.match(markdown, /可映射行数/);

  const dbPath = path.join(tempRoot, "data/ju-chacha.sqlite");
  assert.equal(fs.existsSync(dbPath), false);
});
