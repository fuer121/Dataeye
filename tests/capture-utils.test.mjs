import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  assessRankingReadiness,
  auditCaptureMaterial,
  describeEnvFile,
  isCaptureFileName,
  getRequestDate,
  parseCaptureFiles,
  readEnvFile,
  readRuntimeEnv,
  sanitizeForDisplay,
  minimalHeaders,
  summarizeCaptureFreshness,
  summarizeHeaders,
  sortRankingCandidates
} from "../scripts/capture-utils.js";

test("assessRankingReadiness detects rank title heat and type fields", () => {
  const response = JSON.stringify({
    data: {
      list: [
        {
          ranking: 1,
          playletName: "弃子逆袭，从烂瓦房到商界大佬",
          hotValue: "1.4亿",
          contentTypes: "种田/逆袭/乡村"
        }
      ]
    }
  });

  const readiness = assessRankingReadiness(response);

  assert.equal(readiness.ready, true);
  assert.equal(readiness.rankingCount, 1);
  assert.equal(readiness.fields.rank.key, "ranking");
  assert.equal(readiness.fields.title.key, "playletName");
  assert.equal(readiness.fields.heatValue.key, "hotValue");
  assert.equal(readiness.fields.dramaType.key, "contentTypes");
});

test("assessRankingReadiness reports missing fields", () => {
  const response = JSON.stringify({
    data: {
      list: [
        {
          ranking: 1,
          playletName: "弃子逆袭，从烂瓦房到商界大佬"
        }
      ]
    }
  });

  const readiness = assessRankingReadiness(response);

  assert.equal(readiness.ready, false);
  assert.deepEqual(readiness.missing, ["heatValue", "dramaType"]);
});

test("parseCaptureFiles decodes base64 HAR response bodies", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-har-"));
  const filePath = path.join(dir, "charles-dataeye.har");
  const response = JSON.stringify({
    data: {
      list: [
        {
          ranking: 1,
          playletName: "弃子逆袭，从烂瓦房到商界大佬",
          hotValue: "1.4亿",
          contentTypes: "种田/逆袭/乡村"
        }
      ]
    }
  });

  fs.writeFileSync(
    filePath,
    JSON.stringify({
      log: {
        entries: [
          {
            request: {
              method: "POST",
              url: "https://example.com/api/ranking/list",
              headers: [{ name: "content-type", value: "application/json" }]
            },
            startedDateTime: "2026-06-06T17:45:30.609+08:00",
            response: {
              status: 200,
              headers: [{ name: "content-type", value: "application/json" }],
              content: {
                mimeType: "application/json",
                encoding: "base64",
                text: Buffer.from(response, "utf8").toString("base64")
              }
            }
          }
        ]
      }
    })
  );

  const { requests, errors } = parseCaptureFiles([filePath]);

  assert.equal(errors.length, 0);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].hasLikelyRankingArray, true);
  assert.equal(requests[0].capturedAt, "2026-06-06T09:45:30.609Z");
  assert.equal(requests[0].capturedAtSource, "har");
  assert.equal(assessRankingReadiness(requests[0].responseBody).ready, true);
});

test("summarizeCaptureFreshness labels old captures as stale", () => {
  const freshness = summarizeCaptureFreshness(
    { capturedAt: "2026-06-06T09:45:30.609Z" },
    new Date("2026-06-07T12:00:00.000Z")
  );

  assert.equal(freshness.status, "stale");
  assert.equal(freshness.note, "建议重新抓取");
});

test("auditCaptureMaterial reports missing files", () => {
  const audit = auditCaptureMaterial({ files: [], requests: [], errors: [] });

  assert.equal(audit.ok, false);
  assert.equal(audit.issues[0].code, "missing_files");
});

test("assessRankingReadiness ignores arrays with null items", () => {
  const response = JSON.stringify({
    data: {
      emptyLike: [null],
      list: [
        {
          ranking: 1,
          playletName: "弃子逆袭，从烂瓦房到商界大佬",
          hotValue: "1.4亿",
          contentTypes: "种田/逆袭/乡村"
        }
      ]
    }
  });

  const readiness = assessRankingReadiness(response);

  assert.equal(readiness.ready, true);
  assert.equal(readiness.rankingCount, 1);
});

test("auditCaptureMaterial flags forbidden request redaction", () => {
  const request = {
    id: "sample#0",
    url: "https://example.com/api/ranking/list",
    method: "POST",
    payload: "day=<已脱敏>&pageId=1&sign=<已脱敏>",
    responseBody: JSON.stringify({
      data: {
        list: [
          {
            ranking: 1,
            playletName: "弃子逆袭，从烂瓦房到商界大佬",
            hotValue: "1.4亿",
            contentTypes: "种田/逆袭/乡村"
          }
        ]
      }
    }),
    isLikelyRanking: true
  };

  const audit = auditCaptureMaterial({ files: ["/tmp/sample.curl"], requests: [request], errors: [] });

  assert.equal(audit.ok, false);
  assert.ok(audit.issues.some((item) => item.code === "redacted_request_params"));
});

test("isCaptureFileName only accepts supported capture extensions", () => {
  assert.equal(isCaptureFileName("ranking.har"), true);
  assert.equal(isCaptureFileName("ranking.json"), true);
  assert.equal(isCaptureFileName("ranking.txt"), true);
  assert.equal(isCaptureFileName("ranking.curl"), true);
  assert.equal(isCaptureFileName(".gitkeep"), false);
  assert.equal(isCaptureFileName("charles.chls"), false);
});

test("sortRankingCandidates prioritizes DataEye motion comic daily hot list", () => {
  const requests = [
    {
      id: "hongguo#1",
      url: "https://playlet-applet.dataeye.com/playlet/listHongGuoRanking?pageId=1&pageSize=30&day=2026-06-05",
      score: 30
    },
    {
      id: "motion#2",
      url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
      score: 20
    }
  ];

  const sorted = sortRankingCandidates(requests);

  assert.equal(sorted[0].id, "motion#2");
});

test("sortRankingCandidates prefers later day for the same target endpoint", () => {
  const requests = [
    {
      id: "motion#20260604",
      url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-04&rankType=0",
      score: 27
    },
    {
      id: "motion#20260605",
      url: "https://playlet-applet.dataeye.com/playlet/motionComic?pageId=1&pageSize=30&day=2026-06-05&rankType=0",
      score: 27
    }
  ];

  const sorted = sortRankingCandidates(requests);

  assert.equal(sorted[0].id, "motion#20260605");
});

test("sanitizeForDisplay redacts response auth keys and embedded user identifiers", () => {
  const sanitized = sanitizeForDisplay({
    cover: "https://example.com/a.jpg?auth_key=1234567890abcdef&x=1",
    playletUser:
      "{\"secUid\":\"SEC_UID_VALUE\",\"userId\":\"USER_ID_VALUE\",\"account\":\"ACCOUNT_ID_VALUE\",\"nickname\":\"云栖剧场\"}"
  });

  assert.equal(sanitized.cover, "https://example.com/a.jpg?auth_key=<redacted>&x=1");
  assert.match(sanitized.playletUser, /"secUid":"SEC_.*ALUE"/);
  assert.match(sanitized.playletUser, /"userId":"USER.*ALUE"/);
  assert.match(sanitized.playletUser, /"account":"ACCO.*ALUE"/);
  assert.doesNotMatch(JSON.stringify(sanitized), /1234567890abcdef/);
  assert.doesNotMatch(JSON.stringify(sanitized), /SEC_UID_VALUE/);
  assert.doesNotMatch(JSON.stringify(sanitized), /USER_ID_VALUE/);
  assert.doesNotMatch(JSON.stringify(sanitized), /ACCOUNT_ID_VALUE/);
});

test("sanitizeForDisplay redacts user identifiers inside escaped JSON strings", () => {
  const sanitized = sanitizeForDisplay(
    '{"playletUser":"[{\\"secUid\\":\\"MS4wLjABAAAAvYCHFsTD8n8xdXxEEm3mGFTvLeMR2c3k4ZPI-fpW-5MX0PHT1Qn04mWHKYjPeY4q\\",\\"userId\\":\\"1319867215779486\\",\\"account\\":\\"31571684031\\"}]"}'
  );

  assert.doesNotMatch(sanitized, /MS4wLjABAAAAvYCH/);
  assert.doesNotMatch(sanitized, /1319867215779486/);
  assert.doesNotMatch(sanitized, /31571684031/);
  assert.match(sanitized, /\\"secUid\\":\\"MS4w\.\.\.eY4q\\"/);
  assert.match(sanitized, /\\"userId\\":\\"1319\.\.\.9486\\"/);
  assert.match(sanitized, /\\"account\\":\\"3157\.\.\.4031\\"/);
});

test("summarizeHeaders masks DataEye login helper headers", () => {
  const rows = summarizeHeaders({
    authentication: "auth-value-1234",
    loginuserid: "650985",
    s: "test-signature-value-1234",
    "content-type": "application/json"
  });

  assert.deepEqual(rows.find((row) => row.name === "content-type"), {
    name: "content-type",
    value: "application/json"
  });
  assert.equal(rows.find((row) => row.name === "authentication").value, "auth...1234");
  assert.equal(rows.find((row) => row.name === "loginuserid").value, "<set>");
  assert.equal(rows.find((row) => row.name === "s").value, "test...1234");
});

test("minimalHeaders applies source-specific session credentials", () => {
  const hongguoHeaders = minimalHeaders(
    {
      url: "https://api.example.com/hongguo/ranking/list",
      sourceFile: "/tmp/hongguo-daily.har",
      headers: {
        accept: "application/json",
        session: "<redacted>",
        cookie: "<redacted>"
      }
    },
    {
      DATAEYE_SESSION: "dataeye-session",
      DATAEYE_COOKIE: "dataeye-cookie",
      HONGGUO_SESSION: "hongguo-session",
      HONGGUO_COOKIE: "hongguo-cookie"
    }
  );

  assert.equal(hongguoHeaders.session, "hongguo-session");
  assert.equal(hongguoHeaders.cookie, "hongguo-cookie");
  assert.equal(hongguoHeaders.accept, "application/json");

  const dataeyeHeaders = minimalHeaders(
    {
      url: "https://playlet-applet.dataeye.com/playlet/motionComic",
      sourceFile: "/tmp/dataeye.har",
      headers: {
        accept: "application/json",
        session: "<redacted>",
        cookie: "<redacted>"
      }
    },
    {
      DATAEYE_SESSION: "dataeye-session",
      DATAEYE_COOKIE: "dataeye-cookie",
      HONGGUO_SESSION: "hongguo-session",
      HONGGUO_COOKIE: "hongguo-cookie"
    }
  );

  assert.equal(dataeyeHeaders.session, "dataeye-session");
  assert.equal(dataeyeHeaders.cookie, "dataeye-cookie");
});

test("getRequestDate reads common query and payload date fields", () => {
  assert.equal(
    getRequestDate({
      url: "https://example.com/ranking?date=2026-06-05",
      payload: ""
    }),
    "2026-06-05"
  );
  assert.equal(
    getRequestDate({
      url: "https://example.com/ranking",
      payload: JSON.stringify({ page: 1, rankingDate: "2026-06-04" })
    }),
    "2026-06-04"
  );
  assert.equal(
    getRequestDate({
      url: "https://example.com/ranking",
      payload: "page=1&rankDate=2026-06-03"
    }),
    "2026-06-03"
  );
  assert.equal(
    getRequestDate({
      url: "https://example.com/ranking?date=20260605",
      payload: ""
    }),
    ""
  );
});

test("readEnvFile parses quoted values and readRuntimeEnv can include explicit env file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capture-env-"));
  const envPath = path.join(dir, ".env.local.dataeye");
  fs.writeFileSync(
    envPath,
    [
      "# local only",
      "DATAEYE_AUTHENTICATION=auth-file-value",
      "DATAEYE_USER_AGENT=\"MicroMessenger/8.0.74 iPhone\"",
      "DATAEYE_EMPTY=",
      ""
    ].join("\n")
  );

  assert.deepEqual(readEnvFile(envPath), {
    DATAEYE_AUTHENTICATION: "auth-file-value",
    DATAEYE_USER_AGENT: "MicroMessenger/8.0.74 iPhone",
    DATAEYE_EMPTY: ""
  });

  const runtime = readRuntimeEnv({ envFile: envPath });
  assert.equal(runtime.DATAEYE_AUTHENTICATION, "auth-file-value");
  assert.equal(runtime.DATAEYE_USER_AGENT, "MicroMessenger/8.0.74 iPhone");
  assert.equal(runtime.__ENV_FILE, envPath);
  assert.equal(runtime.__ENV_FILE_EXISTS, true);
  assert.equal(describeEnvFile(path.join(dir, "missing.env")).exists, false);
});
