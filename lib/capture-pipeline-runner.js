import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ROOT_DIR } from "../scripts/capture-utils.js";

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(MODULE_DIR, "../scripts/run-capture-pipeline.js");

export function runCapturePipeline({
  rootDir = ROOT_DIR,
  source = "dataeye",
  loginEnvFile = ".env.local.dataeye"
} = {}) {
  const startedAt = Date.now();
  const args = [SCRIPT_PATH];

  if (source) args.push("--source", source);
  if (loginEnvFile) args.push("--login-env-file", loginEnvFile);

  const child = spawnSync(process.execPath, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  return {
    ok: child.status === 0,
    status: child.status ?? 1,
    source,
    loginEnvFile,
    stdout: child.stdout || "",
    stderr: child.stderr || "",
    durationMs: Date.now() - startedAt
  };
}

export function toSafeCapturePipelinePayload(result) {
  const ok = result.status === 0;

  return {
    ok,
    status: result.status,
    source: result.source || "dataeye",
    loginEnvFile: result.loginEnvFile || ".env.local.dataeye",
    reportPath: "docs/capture-pipeline.md",
    message: ok
      ? "DataEye 抓包流水线已完成，请查看 docs/capture-pipeline.md。"
      : "DataEye 抓包流水线执行失败，请查看 docs/capture-pipeline.md 和终端日志。",
    durationMs: result.durationMs
  };
}
