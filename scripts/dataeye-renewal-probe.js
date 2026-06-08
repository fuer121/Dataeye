#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";

import { inspectDataEyeRenewalReadiness, renderDataEyeRenewalProbeReport } from "../lib/dataeye-renewal-probe.js";
import {
  listCaptureFiles,
  matchesRequestSource,
  parseCaptureFiles,
  rel,
  writeMarkdown
} from "./capture-utils.js";
import { compareDataEyeMotionComicRequests, isDataEyeMotionComicRequest } from "../lib/dataeye-capture-target.js";

const charles = await inspectCharles();
const wechat = inspectMacWeChat();
const targetRequest = findDataEyeTargetRequest();
const result = inspectDataEyeRenewalReadiness({ charles, wechat, targetRequest });
const output = writeMarkdown("dataeye-renewal-probe.md", renderDataEyeRenewalProbeReport({ result }));

console.log(`Status: ${result.status}`);
console.log(`Can refresh login: ${result.canRefreshLogin ? "yes" : "no"}`);
console.log(`Wrote ${rel(output)}`);

async function inspectCharles() {
  const port = Number(process.env.CHARLES_PORT || 8888);
  const portStatus = await checkPort("127.0.0.1", port);
  const cliAvailable = fs.existsSync("/Applications/Charles.app/Contents/MacOS/Charles");
  return {
    port,
    open: portStatus.open,
    cliAvailable,
    error: portStatus.error
  };
}

function inspectMacWeChat() {
  let output = "";
  try {
    output = execFileSync("ps", ["-axo", "comm,args"], { encoding: "utf8" });
  } catch {
    output = "";
  }

  const lines = output
    .split(/\r?\n/)
    .filter((line) => /WeChat|WeChatAppEx|WeApp/.test(line) && !/wechatwebdevtools/i.test(line));
  return {
    running: lines.length > 0,
    processCount: lines.length
  };
}

function findDataEyeTargetRequest() {
  const files = listCaptureFiles();
  const { requests } = parseCaptureFiles(files);
  return (
    requests
      .filter((request) => matchesRequestSource(request, "dataeye") && isDataEyeMotionComicRequest(request))
      .sort(compareDataEyeMotionComicRequests)[0] || null
  );
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 1000 });
    socket.once("connect", () => {
      socket.destroy();
      resolve({ open: true, error: "" });
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve({ open: false, error: "timeout" });
    });
    socket.once("error", (error) => {
      resolve({ open: false, error: error.code || error.message });
    });
  });
}
