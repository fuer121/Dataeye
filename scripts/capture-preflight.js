#!/usr/bin/env node
import net from "node:net";
import os from "node:os";

import {
  describeEnvFile,
  listCaptureFiles,
  maskSensitiveValue,
  readRuntimeEnv,
  rel,
  writeMarkdown
} from "./capture-utils.js";

const args = parseArgs(process.argv.slice(2));
const files = listCaptureFiles();
const env = readRuntimeEnv({ envFile: args.envFile });
const envFileStatus = describeEnvFile(args.envFile);
const networkAddresses = getPrivateIPv4Addresses();
const charles = await checkPort("127.0.0.1", Number(process.env.CHARLES_PORT || 8888));

const output = writeMarkdown(
  "capture-preflight.md",
  renderReport({ files, env, envFileStatus, networkAddresses, charles })
);

console.log(`Capture files: ${files.length}`);
console.log(`Private IPv4 addresses: ${networkAddresses.length}`);
console.log(`Charles port ${charles.port}: ${charles.open ? "open" : "not open"}`);
console.log(`Wrote ${rel(output)}`);

function getPrivateIPv4Addresses() {
  const rows = [];
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      if (address.family !== "IPv4" || address.internal) continue;
      if (!isPrivateIPv4(address.address)) continue;
      rows.push({ name, address: address.address });
    }
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

function isPrivateIPv4(address) {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address);
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: 1200 });
    socket.once("connect", () => {
      socket.destroy();
      resolve({ host, port, open: true, error: "" });
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve({ host, port, open: false, error: "timeout" });
    });
    socket.once("error", (error) => {
      resolve({ host, port, open: false, error: error.code || error.message });
    });
  });
}

function renderReport({ files, env, envFileStatus, networkAddresses, charles }) {
  const now = new Date().toISOString();
  return `# 抓包环境预检

生成时间：${now}

## Charles

| 项 | 状态 |
| --- | --- |
| 本机端口 | ${charles.host}:${charles.port} |
| 是否可连接 | ${charles.open ? "是" : "否"} |
| 错误 | ${charles.error || "无"} |

如果端口不可连接，请确认 Charles 已打开，并检查 Charles 的 Proxy 端口是否为 ${charles.port}。如使用其他端口，可运行：

\`\`\`bash
CHARLES_PORT=<端口> npm run capture:preflight
\`\`\`

## iPhone Wi-Fi 代理可用地址

${renderAddresses(networkAddresses, charles.port)}

## 抓包材料

| 项 | 数量 |
| --- | ---: |
| /captures 文件 | ${files.length} |

${files.length ? files.map((file) => `- \`${rel(file)}\``).join("\n") : "当前没有 HAR、JSON、txt 或 curl 抓包材料。"}

## DataEye 登录态

登录态文件：${envFileStatus.label}

| 变量 | 状态 |
| --- | --- |
| DATAEYE_AUTHENTICATION | ${env.DATAEYE_AUTHENTICATION ? maskSensitiveValue(env.DATAEYE_AUTHENTICATION) : "未提供"} |
| DATAEYE_LOGIN_USER_ID | ${env.DATAEYE_LOGIN_USER_ID ? maskSensitiveValue(env.DATAEYE_LOGIN_USER_ID) : "未提供"} |
| DATAEYE_S | ${env.DATAEYE_S ? maskSensitiveValue(env.DATAEYE_S) : "未提供"} |
| DATAEYE_REFERER | ${env.DATAEYE_REFERER ? "已提供" : "未提供"} |
| DATAEYE_USER_AGENT | ${env.DATAEYE_USER_AGENT ? "已提供" : "未提供"} |
| DATAEYE_COOKIE | ${env.DATAEYE_COOKIE ? maskSensitiveValue(env.DATAEYE_COOKIE) : "未提供"} |
| DATAEYE_AUTHORIZATION | ${env.DATAEYE_AUTHORIZATION ? maskSensitiveValue(env.DATAEYE_AUTHORIZATION) : "未提供"} |
| DATAEYE_TOKEN | ${env.DATAEYE_TOKEN ? maskSensitiveValue(env.DATAEYE_TOKEN) : "未提供"} |

剧查查小程序 live 采集必填 \`DATAEYE_AUTHENTICATION\` 和 \`DATAEYE_LOGIN_USER_ID\`；\`DATAEYE_S\`、\`DATAEYE_REFERER\`、\`DATAEYE_USER_AGENT\` 按抓包请求补充。Cookie、Authorization、Token 仅在目标请求实际包含时需要。

## 下一步

1. 在 iPhone Wi-Fi 代理中填入上面的本机 IP 和 Charles 端口。
2. 安装并信任 Charles Root Certificate。
3. 按 \`docs/dataeye-miniprogram-capture-runbook.md\` 抓剧查查小程序「漫剧热播榜 + 日榜」。
4. 将 HAR 或 cURL 保存到 \`captures/\`。
5. 运行 \`npm run capture:pipeline\`。
`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--login-env-file") {
      parsed.envFile = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function renderAddresses(addresses, port) {
  if (!addresses.length) {
    return "未发现局域网 IPv4 地址。请确认 Mac 已连接到与 iPhone 相同的 Wi-Fi。";
  }

  return `| 网络接口 | iPhone 代理服务器 | 端口 |
| --- | --- | ---: |
${addresses.map((row) => `| ${row.name} | ${row.address} | ${port} |`).join("\n")}`;
}
