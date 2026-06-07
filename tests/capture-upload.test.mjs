import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { saveCaptureUpload, saveCaptureUploadWithAnalysis } from "../lib/capture-upload.js";

test("saveCaptureUpload stores supported capture files with a safe name", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-upload-"));
  const capturesDir = path.join(tempRoot, "captures");

  const result = saveCaptureUpload({
    fileName: "../Charles DataEye.har",
    content: "{\"log\":{\"entries\":[]}}",
    capturesDir
  });

  assert.equal(result.ok, true);
  assert.equal(result.fileName, "Charles-DataEye.har");
  assert.equal(path.dirname(result.filePath), capturesDir);
  assert.equal(fs.readFileSync(result.filePath, "utf8"), "{\"log\":{\"entries\":[]}}");
});

test("saveCaptureUpload rejects unsupported or empty capture files", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-upload-reject-"));
  const capturesDir = path.join(tempRoot, "captures");

  assert.throws(
    () => saveCaptureUpload({ fileName: "bad.exe", content: "x", capturesDir }),
    /仅支持/
  );
  assert.throws(
    () => saveCaptureUpload({ fileName: "empty.har", content: "", capturesDir }),
    /不能为空/
  );
});

test("saveCaptureUploadWithAnalysis stores the file and returns a safe DataEye pipeline summary", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "capture-upload-analysis-"));
  const capturesDir = path.join(tempRoot, "captures");

  const result = saveCaptureUploadWithAnalysis({
    fileName: "fresh.har",
    content: JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "GET",
              url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-07&rankType=0",
              headers: [{ name: "authentication", value: "abcdefghijklmnopqrstuvwxyz1234567890" }]
            },
            response: {
              status: 200,
              content: {
                mimeType: "application/json",
                text: JSON.stringify({
                  statusCode: 200,
                  content: [
                    {
                      ranking: 1,
                      playletName: "全家一起搬，商圈大换血",
                      playCount: "1.9亿",
                      tags: "[\"都市日常\"]"
                    }
                  ]
                })
              }
            }
          }
        ]
      }
    }),
    capturesDir,
    rootDir: tempRoot
  });

  assert.equal(result.ok, true);
  assert.equal(result.fileName, "fresh.har");
  assert.equal(result.pipeline.ok, true);
  assert.equal(result.pipeline.source, "dataeye");
  assert.equal(result.pipeline.reportPath, "docs/capture-pipeline.md");
  assert.equal(fs.existsSync(path.join(tempRoot, "docs/capture-pipeline.md")), true);
  assert.equal("stdout" in result.pipeline, false);
  assert.equal("stderr" in result.pipeline, false);
});
