import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { importFeishuNovelMappings } from "../lib/feishu-novel-import.js";

const ENV_KEYS = [
  "FEISHU_APP_ID",
  "FEISHU_APP_SECRET",
  "FEISHU_TENANT_ACCESS_TOKEN",
  "FEISHU_SPREADSHEET_TOKEN",
  "FEISHU_SHEET_ID",
  "FEISHU_RANGE"
];

test("Feishu novel import service reports missing spreadsheet token", async () => {
  const restore = clearEnv();

  try {
    await assert.rejects(() => importFeishuNovelMappings(), /FEISHU_SPREADSHEET_TOKEN/);
  } finally {
    restore();
  }
});

test("Feishu novel import service rejects sheets without mappable rows", async () => {
  const fetchImpl = async (url) => {
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
              ["作品", "备注"],
              ["只有短剧名", "缺少小说名称和短剧/漫剧名称表头"]
            ]
          }
        }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  await assert.rejects(
    () =>
      importFeishuNovelMappings({
        env: {
          FEISHU_APP_ID: "app-id",
          FEISHU_APP_SECRET: "app-secret",
          FEISHU_SPREADSHEET_TOKEN: "spreadsheet-token",
          FEISHU_SHEET_ID: "sheet-id",
          FEISHU_RANGE: "A:D"
        },
        fetchImpl
      }),
    /没有可导入的小说映射/
  );
});

test("novel API exposes manual update and delete endpoints", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/novels/route.js"), "utf8");

  assert.match(source, /export async function PATCH/);
  assert.match(source, /updateNovelMapping/);
  assert.match(source, /export async function DELETE/);
  assert.match(source, /deleteNovelMapping/);
  assert.match(source, /SQLITE_CONSTRAINT/);
});

function clearEnv() {
  const previous = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    delete process.env[key];
  }

  return () => {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  };
}
