#!/usr/bin/env node
import { importNativeRankings } from "../lib/native-rankings.js";

const args = parseArgs(process.argv.slice(2));

try {
  const result = importNativeRankings({
    exportDate: args.exportDate,
    rankingDate: args.date,
    baseDir: args.baseDir
  });

  console.log("Status: success");
  console.log(`Source: ${result.source}`);
  console.log(`Export date: ${result.exportDate}`);
  console.log(`Ranking date: ${result.rankingDate}`);
  console.log(`Inserted: ${result.insertedCount}`);
  console.log(`Skipped: ${result.skippedCount}`);
  for (const item of result.periods) {
    console.log(`${item.period}: ${item.rowCount}`);
  }
} catch (error) {
  console.log("Status: failed");
  console.log(`Error: ${error.message}`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--export-date") {
      parsed.exportDate = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--date") {
      parsed.date = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--base-dir") {
      parsed.baseDir = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}
