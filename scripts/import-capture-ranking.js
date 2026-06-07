#!/usr/bin/env node
import { importCaptureRanking } from "../lib/capture-import.js";
import { rel } from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const result = importCaptureRanking({ date: args.date, source: args.source, writeReport: true });

console.log(`Capture files: ${result.files.length}`);
console.log(`Ready ranking candidates: ${result.candidateCount}`);
console.log(`Status: ${result.ok ? "success" : "failed"}`);
console.log(`Inserted: ${result.insertedCount}`);
console.log(`Skipped: ${result.skippedCount}`);
console.log(`Wrote ${rel(result.reportPath)}`);

if (!result.ok) process.exitCode = 1;

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--date") {
      parsed.date = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--source") {
      parsed.source = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}
