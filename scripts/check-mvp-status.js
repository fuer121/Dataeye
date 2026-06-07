#!/usr/bin/env node
import { getMvpStatus, renderMvpStatusReport } from "../lib/mvp-status.js";
import { rel, writeMarkdown } from "./capture-utils.js";

const status = getMvpStatus();
const output = writeMarkdown("mvp-status.md", renderMvpStatusReport(status));

console.log(`Status: ${status.overall}`);
console.log(`DataEye live rows: ${status.dataeye.liveCount}`);
console.log(`DataEye live rank types: ${status.dataeye.liveRankTypeCount}`);
console.log(`DataEye live periods: ${status.dataeye.livePeriodCount}`);
console.log(`Novel mappings: ${status.novels.mappingCount}`);
console.log(`Wrote ${rel(output)}`);
