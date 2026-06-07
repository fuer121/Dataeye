import fs from "node:fs";
import path from "node:path";

import { CAPTURES_DIR, isCaptureFileName } from "../scripts/capture-utils.js";
import { runCapturePipeline, toSafeCapturePipelinePayload } from "./capture-pipeline-runner.js";

export function saveCaptureUpload({ fileName, content, capturesDir = CAPTURES_DIR }) {
  const safeName = sanitizeCaptureFileName(fileName);
  const text = String(content ?? "");

  if (!isCaptureFileName(safeName)) {
    throw new Error("仅支持 .har / .json / .txt / .curl 抓包文件。");
  }

  if (!text.trim()) {
    throw new Error("抓包文件内容不能为空。");
  }

  fs.mkdirSync(capturesDir, { recursive: true });
  const filePath = nextAvailablePath(path.join(capturesDir, safeName));
  fs.writeFileSync(filePath, text, { mode: 0o600 });

  return {
    ok: true,
    fileName: path.basename(filePath),
    filePath,
    size: Buffer.byteLength(text)
  };
}

export function saveCaptureUploadWithAnalysis({ fileName, content, capturesDir = CAPTURES_DIR, rootDir } = {}) {
  const upload = saveCaptureUpload({ fileName, content, capturesDir });
  const pipeline = runCapturePipeline({
    rootDir,
    source: "dataeye",
    loginEnvFile: ".env.local.dataeye"
  });

  return {
    ...upload,
    pipeline: toSafeCapturePipelinePayload(pipeline)
  };
}

function sanitizeCaptureFileName(fileName) {
  const parsed = path.parse(path.basename(String(fileName || "capture.har")));
  const base = parsed.name
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const ext = parsed.ext.toLowerCase();
  return `${base || "capture"}${ext}`;
}

function nextAvailablePath(initialPath) {
  if (!fs.existsSync(initialPath)) return initialPath;

  const parsed = path.parse(initialPath);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(parsed.dir, `${parsed.name}-${stamp}${parsed.ext}`);
}
