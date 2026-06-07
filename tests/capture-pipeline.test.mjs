import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("run-capture-pipeline creates reports from a valid HAR", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-pipeline-"));
  const capturesDir = path.join(tempRoot, "captures");
  const envPath = path.join(tempRoot, ".env.local.dataeye");
  fs.mkdirSync(capturesDir, { recursive: true });
  fs.writeFileSync(envPath, "DATAEYE_AUTHENTICATION=auth-file-value\nDATAEYE_LOGIN_USER_ID=650985\n");

  const response = {
    data: {
      list: [
        {
          ranking: 1,
          playletName: "弃子逆袭，从烂瓦房到商界大佬",
          hotValue: "1.4亿",
          contentTypes: "种田/逆袭/乡村"
        }
      ]
    }
  };

  fs.writeFileSync(
    path.join(capturesDir, "dataeye-pipeline.har"),
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "POST",
              url: "http://127.0.0.1:9/api/ranking/list",
              headers: [{ name: "content-type", value: "application/json" }],
              postData: {
                mimeType: "application/json",
                text: JSON.stringify({ day: "2026-06-05", pageId: 1 })
              }
            },
            startedDateTime: "2026-06-06T17:45:30.609+08:00",
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

  const result = spawnSync(
    "node",
    [path.join(root, "scripts/run-capture-pipeline.js"), "--login-env-file", envPath],
    {
      cwd: tempRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const pipeline = fs.readFileSync(path.join(tempRoot, "docs/capture-pipeline.md"), "utf8");
  const preview = fs.readFileSync(path.join(tempRoot, "docs/ranking-preview.md"), "utf8");
  const spec = fs.readFileSync(path.join(tempRoot, "docs/api-spec.md"), "utf8");
  const audit = fs.readFileSync(path.join(tempRoot, "docs/capture-material-audit.md"), "utf8");
  const preflight = fs.readFileSync(path.join(tempRoot, "docs/capture-preflight.md"), "utf8");
  const validation = fs.readFileSync(path.join(tempRoot, "docs/request-validation.md"), "utf8");

  assert.match(pipeline, /已识别抓包响应中的可映射榜单候选/);
  assert.match(pipeline, /抓包新鲜度/);
  assert.match(pipeline, /登录态文件/);
  assert.match(pipeline, /\.env\.local\.dataeye.*存在/);
  assert.match(pipeline, /捕获时间/);
  assert.match(pipeline, /重新抓取新鲜 HAR/);
  assert.doesNotMatch(pipeline, /确认 HTTP 复现是否 2xx/);
  assert.match(preview, /弃子逆袭，从烂瓦房到商界大佬/);
  assert.match(spec, /playletName/);
  assert.match(spec, /业务响应包含榜单数组/);
  assert.match(spec, /字段映射就绪/);
  assert.match(spec, /--confirmed-preview/);
  assert.match(spec, /confirmedPreview=true/);
  assert.match(audit, /抓包材料结构审计通过/);
  assert.match(audit, /抓包新鲜度/);
  assert.match(preflight, /\.env\.local\.dataeye.*存在/);
  assert.match(validation, /\.env\.local\.dataeye.*存在/);
});
