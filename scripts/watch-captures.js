#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CAPTURES_DIR,
  describeEnvFile,
  ensureDirs,
  isCaptureFileName,
  listCaptureFiles,
  parseCaptureFiles,
  rel
} from "./capture-utils.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const args = parseArgs(process.argv.slice(2));
const loginEnvArgs = args.envFile ? ["--login-env-file", args.envFile] : [];
const sourceArgs = args.source ? ["--source", args.source] : [];
const envFileStatus = describeEnvFile(args.envFile);
ensureDirs();

let timer;
let running = false;
let queued = false;
let lastStatus = 0;

console.log(`Watching ${rel(CAPTURES_DIR)} for HAR/JSON/txt/curl files.`);
console.log(`Login env file: ${envFileStatus.label}`);
console.log(`Source filter: ${args.source || "all"}`);
console.log(`Auto DataEye login refresh: ${args.autoRefreshLogin ? "enabled" : "disabled"}`);
console.log(`Auto DataEye daily: ${args.autoDaily ? "enabled" : "disabled"}`);
console.log("Press Ctrl+C to stop.");

const existingFiles = listCaptureFiles();
if (existingFiles.length > 0) {
  console.log(`Found ${existingFiles.length} existing capture file(s). Running pipeline once.`);
  runPipeline();
} else {
  console.log("No capture files yet. Waiting for export...");
}

if (process.env.CAPTURE_WATCH_ONCE === "1") {
  process.exit(lastStatus);
}

const watcher = fs.watch(CAPTURES_DIR, (eventType, fileName) => {
  if (!fileName || !isCaptureFileName(fileName)) return;
  console.log(`Detected ${eventType}: ${fileName}`);
  schedulePipeline();
});

process.on("SIGINT", () => {
  watcher.close();
  console.log("\nStopped watching captures.");
  process.exit(0);
});

function schedulePipeline() {
  clearTimeout(timer);
  timer = setTimeout(runPipeline, Number(process.env.CAPTURE_WATCH_DEBOUNCE_MS || 1200));
}

function runPipeline() {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  queued = false;

  console.log("Running capture pipeline...");
  const result = spawnSync("node", [path.join(SCRIPT_DIR, "run-capture-pipeline.js"), ...loginEnvArgs, ...sourceArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit"
  });

  running = false;

  if (result.status !== 0) {
    console.log(`Pipeline exited with status ${result.status}.`);
    lastStatus = result.status ?? 1;
  } else {
    console.log("Pipeline finished.");
    runAutoDataEyeSteps();
  }

  if (queued) {
    schedulePipeline();
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--login-env-file") {
      parsed.envFile = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--date") {
      parsed.date = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--auto-refresh-login") {
      parsed.autoRefreshLogin = true;
    } else if (argv[index] === "--auto-daily") {
      parsed.autoDaily = true;
    }
  }
  return parsed;
}

function runAutoDataEyeSteps() {
  if (!args.autoRefreshLogin) return;

  if (args.source && args.source !== "dataeye") {
    console.log(`Auto DataEye login refresh skipped: source filter is ${args.source}.`);
    return;
  }

  const rankingDate = args.date || inferLatestDataEyeRankingDate();
  const refreshArgs = rankingDate ? ["--date", rankingDate] : [];
  const refresh = runNodeScript(resolveScriptPath("CAPTURE_WATCH_REFRESH_SCRIPT", "refresh-dataeye-login.js"), refreshArgs);
  if (refresh.status !== 0) {
    lastStatus = refresh.status ?? 1;
    return;
  }

  if (!args.autoDaily) return;

  const refreshedDate = parseDateFromOutput(refresh.stdout) || rankingDate;
  if (!isReadyOutput(refresh.stdout)) {
    console.log("Auto DataEye daily skipped: login refresh was not ready.");
    return;
  }

  const dailyArgs = [
    ...(refreshedDate ? ["--date", refreshedDate] : []),
    "--source",
    "dataeye",
    ...loginEnvArgs
  ];
  const daily = runNodeScript(resolveScriptPath("CAPTURE_WATCH_DAILY_SCRIPT", "dataeye-daily.js"), dailyArgs);
  if (daily.status !== 0) lastStatus = daily.status ?? 1;
}

function runNodeScript(scriptFile, scriptArgs) {
  const child = spawnSync(process.execPath, [scriptFile, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  process.stdout.write(child.stdout || "");
  process.stderr.write(child.stderr || "");
  return {
    status: child.status ?? 1,
    stdout: child.stdout || "",
    stderr: child.stderr || ""
  };
}

function resolveScriptPath(envKey, fileName) {
  return process.env[envKey] || path.join(SCRIPT_DIR, fileName);
}

function inferLatestDataEyeRankingDate() {
  const { requests } = parseCaptureFiles(listCaptureFiles());
  const candidates = requests
    .filter(isDataEyeMotionComicTarget)
    .map((request) => ({
      day: getRequestDay(request),
      timestamp: Date.parse(request.startedDateTime || request.capturedAt || "")
    }))
    .filter((candidate) => candidate.day)
    .sort((a, b) => (Number.isFinite(b.timestamp) ? b.timestamp : 0) - (Number.isFinite(a.timestamp) ? a.timestamp : 0));

  return candidates[0]?.day || "";
}

function isDataEyeMotionComicTarget(request) {
  try {
    const url = new URL(request.url);
    return (
      url.hostname === "playlet-applet.dataeye.com" &&
      url.pathname === "/playlet/motionComic" &&
      url.searchParams.get("rankType") === "0"
    );
  } catch {
    return false;
  }
}

function getRequestDay(request) {
  try {
    return new URL(request.url).searchParams.get("day") || "";
  } catch {
    return "";
  }
}

function isReadyOutput(output) {
  return /^Status:\s*ready\s*$/m.test(String(output || ""));
}

function parseDateFromOutput(output) {
  const match = String(output || "").match(/^(?:Date|Ranking date):\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  return match?.[1] || "";
}
