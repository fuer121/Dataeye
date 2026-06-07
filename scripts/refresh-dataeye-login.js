#!/usr/bin/env node
import { refreshDataEyeLogin } from "../lib/dataeye-login-refresh.js";
import { rel } from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const result = refreshDataEyeLogin({
  date: args.date,
  skipPreview: args.skipPreview,
  allowStaleCapture: args.allowStaleCapture,
  echoPreview: true
});

console.log(`Status: ${result.status}`);
console.log(`Capture files: ${result.files.length}`);
console.log(`Wrote ${rel(result.reportPath)}`);
if (result.localEnvPath) console.log(`Wrote ${rel(result.localEnvPath)} with sensitive local values`);
if (!result.ok) process.exitCode = 1;

function parseArgs(argv) {
  const parsed = { skipPreview: false, allowStaleCapture: false, date: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--skip-preview") {
      parsed.skipPreview = true;
    } else if (item === "--allow-stale-capture") {
      parsed.allowStaleCapture = true;
    } else if (item === "--date") {
      parsed.date = argv[index + 1] || "";
      index += 1;
    }
  }
  return parsed;
}
