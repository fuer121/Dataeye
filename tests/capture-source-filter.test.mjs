import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

test("capture pipeline can focus reports on one source", () => {
  const root = process.cwd();
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-source-filter-"));
  const capturesDir = path.join(tempRoot, "captures");
  const envPath = path.join(tempRoot, ".env.local.hongguo");
  fs.mkdirSync(capturesDir, { recursive: true });
  fs.writeFileSync(envPath, "HONGGUO_SESSION=hongguo-session-value\nHONGGUO_COOKIE=hongguo-cookie-value\n");

  writeHar(path.join(capturesDir, "dataeye-daily.har"), {
    url: "http://127.0.0.1:9/dataeye/ranking/list?day=2026-06-05",
    title: "DataEye 作品",
    sourceHeader: "dataeye-session"
  });
  writeHar(path.join(capturesDir, "hongguo-daily.har"), {
    url: "http://127.0.0.1:9/hongguo/ranking/list?day=2026-06-05",
    title: "红果作品",
    sourceHeader: "<redacted>"
  });

  const result = spawnSync(
    "node",
    [
      path.join(root, "scripts/run-capture-pipeline.js"),
      "--source",
      "hongguo",
      "--login-env-file",
      envPath
    ],
    {
      cwd: tempRoot,
      encoding: "utf8"
    }
  );

  assert.equal(result.status, 0, result.stderr);

  const analysis = fs.readFileSync(path.join(tempRoot, "docs/request-analysis.md"), "utf8");
  const validation = fs.readFileSync(path.join(tempRoot, "docs/request-validation.md"), "utf8");
  const preview = fs.readFileSync(path.join(tempRoot, "docs/ranking-preview.md"), "utf8");
  const spec = fs.readFileSync(path.join(tempRoot, "docs/api-spec.md"), "utf8");
  const pipeline = fs.readFileSync(path.join(tempRoot, "docs/capture-pipeline.md"), "utf8");

  for (const markdown of [analysis, validation, preview, spec, pipeline]) {
    assert.match(markdown, /来源过滤[\s\S]*hongguo/);
  }

  assert.match(validation, /HONGGUO_SESSION \| hong\.\.\.alue/);
  assert.match(validation, /http:\/\/127\.0\.0\.1:9\/hongguo\/ranking\/list/);
  assert.doesNotMatch(validation, /http:\/\/127\.0\.0\.1:9\/dataeye\/ranking\/list/);
  assert.match(preview, /红果作品/);
  assert.doesNotMatch(preview, /DataEye 作品/);
  assert.match(spec, /识别来源 \| hongguo/);
  assert.match(pipeline, /validate-request\.js .*--source hongguo/);
});

function writeHar(filePath, { url, title, sourceHeader }) {
  fs.writeFileSync(
    filePath,
    JSON.stringify({
      log: {
        entries: [
          {
            startedDateTime: new Date().toISOString(),
            request: {
              method: "GET",
              url,
              headers: [
                { name: "accept", value: "application/json" },
                { name: "session", value: sourceHeader }
              ]
            },
            response: {
              status: 200,
              headers: [{ name: "content-type", value: "application/json" }],
              content: {
                mimeType: "application/json",
                text: JSON.stringify({
                  data: {
                    list: [
                      {
                        rank: 1,
                        title,
                        heatValue: "9999w",
                        dramaType: "都市/逆袭"
                      }
                    ]
                  }
                })
              }
            }
          }
        ]
      }
    })
  );
}
