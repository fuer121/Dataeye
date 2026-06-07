import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("extract-ranking-preview writes normalized ranking rows from HAR", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ranking-preview-"));
  const capturesDir = path.join(tempRoot, "captures");
  fs.mkdirSync(capturesDir, { recursive: true });

  const response = {
    data: {
      list: [
        {
          ranking: 1,
          playletName: "弃子逆袭，从烂瓦房到商界大佬",
          hotValue: "1.4亿",
          tags: "[\"种田\",\"逆袭\",\"乡村\"]"
        }
      ]
    }
  };

  fs.writeFileSync(
    path.join(capturesDir, "dataeye-preview.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "POST",
              url: "https://example.com/api/ranking/list",
              headers: [{ name: "content-type", value: "application/json" }]
            },
            response: {
              status: 200,
              headers: [{ name: "content-type", value: "application/json" }],
              content: {
                mimeType: "application/json",
                text: JSON.stringify(response)
              }
            }
          }
        ]
      }
    })
  );

  const result = spawnSync("node", [path.join(root, "scripts/extract-ranking-preview.js")], {
    cwd: tempRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr);
  const markdown = fs.readFileSync(path.join(tempRoot, "docs/ranking-preview.md"), "utf8");
  assert.match(markdown, /弃子逆袭，从烂瓦房到商界大佬/);
  assert.match(markdown, /1\.4亿/);
  assert.match(markdown, /种田\/逆袭\/乡村/);
});
