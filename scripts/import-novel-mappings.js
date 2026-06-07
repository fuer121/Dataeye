#!/usr/bin/env node
import { importNovelMappingsFromFile } from "../lib/novels.js";

const filePath = parseFileArg(process.argv.slice(2));

if (!filePath) {
  console.error("请提供文件路径，例如：npm run novels:import -- --file data/novel-mappings.csv");
  process.exit(1);
}

try {
  const changedCount = importNovelMappingsFromFile(filePath);
  console.log(`Imported/updated novel mappings: ${changedCount}`);
} catch (error) {
  console.error(`Novel mapping import failed: ${error.message}`);
  process.exit(1);
}

function parseFileArg(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--file") return argv[index + 1];
  }
  return argv[0] || "";
}
