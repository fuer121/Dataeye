import assert from "node:assert/strict";
import test from "node:test";

import { collectDataEyeRanking, CollectorUnavailableError } from "../lib/collectors/live.js";

const ENV_KEYS = [
  "DATAEYE_AUTHENTICATION",
  "DATAEYE_LOGIN_USER_ID",
  "DATAEYE_S",
  "DATAEYE_REFERER",
  "DATAEYE_USER_AGENT",
  "DATAEYE_COOKIE",
  "DATAEYE_AUTHORIZATION",
  "DATAEYE_TOKEN"
];

test("collectDataEyeRanking maps verified motionComic rows", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985",
    DATAEYE_S: "s-value",
    DATAEYE_REFERER: "https://servicewechat.com/test/page-frame.html",
    DATAEYE_USER_AGENT: "MicroMessenger"
  });
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "弃子逆袭，从烂瓦房到商界大佬",
            playCount: "1.4亿",
            tags: "[\"种田\",\"逆袭\",\"乡村\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({ rankingDate: "2026-06-05" });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].source, "dataeye");
    assert.equal(rows[0].rankingDate, "2026-06-05");
    assert.equal(rows[0].rank, 1);
    assert.equal(rows[0].title, "弃子逆袭，从烂瓦房到商界大佬");
    assert.equal(rows[0].heatValue, "1.4亿");
    assert.equal(rows[0].dramaType, "种田/逆袭/乡村");
    const sourceRef = new URL(rows[0].sourceRef);
    assert.equal(sourceRef.pathname, "/playlet/motionComic");
    assert.equal(sourceRef.searchParams.get("pageId"), "1");
    assert.equal(sourceRef.searchParams.get("day"), "2026-06-05");
    assert.equal(sourceRef.searchParams.get("rankType"), "0");

    assert.equal(calls.length, 1);
    const url = new URL(calls[0].url);
    assert.equal(url.pathname, "/playlet/motionComic");
    assert.equal(url.searchParams.get("day"), "2026-06-05");
    assert.equal(url.searchParams.get("rankType"), "0");
    assert.equal(url.searchParams.get("pageId"), "1");
    assert.equal(calls[0].init.headers.authentication, "auth-value");
    assert.equal(calls[0].init.headers.loginUserId, "650985");
    assert.equal(calls[0].init.headers.S, "s-value");
    assert.equal(calls[0].init.headers.referer, "https://servicewechat.com/test/page-frame.html");
    assert.equal(calls[0].init.headers["user-agent"], "MicroMessenger");
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking prefers period play count add for heat value", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "烬九州",
            playCount: "3.8亿",
            playCountAdd: "2.5亿",
            tags: "[\"古代\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    const rows = await collectDataEyeRanking({ rankingDate: "2026-06-07" });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].title, "烬九州");
    assert.equal(rows[0].heatValue, "2.5亿");
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking allows rows with empty tag arrays", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 5,
            playletName: "桥可以再修，人心变了修不了",
            playCount: "6254w",
            tags: "[]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    const rows = await collectDataEyeRanking({ rankingDate: "2026-06-05" });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].rank, 5);
    assert.equal(rows[0].title, "桥可以再修，人心变了修不了");
    assert.equal(rows[0].dramaType, "");
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking fetches period values and maps explicit rank type period rows", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    calls.push(parsed);

    if (parsed.pathname === "/playlet/motionComicDate") {
      assert.equal(parsed.searchParams.get("rankType"), "1");
      return new Response(
        JSON.stringify({
          statusCode: 200,
          content: {
            day: "2026-06-06",
            week: "2026-06-01 ~ 2026-06-07",
            month: "2026-06"
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    assert.equal(parsed.pathname, "/playlet/motionComic");
    assert.equal(parsed.searchParams.get("rankType"), "1");
    assert.equal(parsed.searchParams.get("week"), "2026-06-01 ~ 2026-06-07");
    assert.equal(parsed.searchParams.get("day"), null);
    assert.equal(parsed.searchParams.get("month"), null);
    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "烬九州",
            playCount: "1.2亿",
            tags: "[\"玄幻\",\"热血\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({
      rankingDate: "2026-06-06",
      rankType: "1",
      period: "week"
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].rankType, 1);
    assert.equal(rows[0].rankTypeName, "动态漫榜");
    assert.equal(rows[0].rankPeriod, "week");
    assert.equal(rows[0].periodValue, "2026-06-01 ~ 2026-06-07");
    assert.equal(rows[0].title, "烬九州");
    const sourceRef = new URL(rows[0].sourceRef);
    assert.equal(sourceRef.searchParams.get("rankType"), "1");
    assert.equal(sourceRef.searchParams.get("week"), "2026-06-01 ~ 2026-06-07");
    assert.equal(calls.length, 2);
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking probes all rank types and skips unsupported ones", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  const dateRankTypes = [];

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    const rankType = parsed.searchParams.get("rankType");

    if (parsed.pathname === "/playlet/motionComicDate") {
      dateRankTypes.push(Number(rankType));
      if (rankType !== "0") {
        return new Response(JSON.stringify({ statusCode: 404, message: "未开放榜单" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }

      return new Response(
        JSON.stringify({
          statusCode: 200,
          content: { day: "2026-06-06", week: "2026-06-01 ~ 2026-06-07", month: "2026-06" }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    assert.equal(rankType, "0");
    assert.equal(parsed.searchParams.get("day"), "2026-06-06");
    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "全家一起搬，商圈大换血",
            playCount: "1.9亿",
            tags: "[\"战神归来\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({
      rankingDate: "2026-06-06",
      rankType: "all",
      period: "day"
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].rankType, 0);
    assert.equal(rows[0].rankTypeName, "漫剧热播榜");
    assert.equal(dateRankTypes.length, 21);
    assert.equal(dateRankTypes[0], 0);
    assert.equal(dateRankTypes[20], 20);
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking stops when later pages repeat the same rows", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  const calls = [];
  const repeatedContent = Array.from({ length: 30 }, (_, index) => ({
    playletId: 9000 + index,
    ranking: index + 1,
    playletName: `重复作品 ${index + 1}`,
    playCount: `${index + 1}w`,
    tags: "[]"
  }));

  global.fetch = async (url) => {
    calls.push(String(url));
    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: calls.length, pageSize: 30, totalRecords: 120 },
        content: repeatedContent
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({ rankingDate: "2026-06-05" });

    assert.equal(rows.length, 30);
    assert.equal(calls.length, 2);
    assert.equal(new URL(calls[0]).searchParams.get("pageId"), "1");
    assert.equal(new URL(calls[1]).searchParams.get("pageId"), "2");
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking rejects empty live ranking arrays", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 0 },
        content: []
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  try {
    await assert.rejects(
      () => collectDataEyeRanking({ rankingDate: "2026-06-05" }),
      (error) => error instanceof CollectorUnavailableError && /未返回任何榜单/.test(error.message)
    );
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking marks expired DataEye login state", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "expired-auth",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async () =>
    new Response(JSON.stringify({ statusCode: 401, message: "登录态已失效，请重新登录" }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });

  try {
    await assert.rejects(
      () => collectDataEyeRanking({ rankingDate: "2026-06-07" }),
      (error) =>
        error instanceof CollectorUnavailableError &&
        error.code === "DATAEYE_AUTH_EXPIRED" &&
        /登录态已失效/.test(error.message) &&
        /Charles\/Proxyman/.test(error.action)
    );
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking requires verified mini-program login headers", async () => {
  const restore = installEnv({});

  try {
    await assert.rejects(
      () => collectDataEyeRanking({ rankingDate: "2026-06-05" }),
      (error) =>
        error instanceof CollectorUnavailableError &&
        /DATAEYE_AUTHENTICATION/.test(error.message) &&
        /DATAEYE_LOGIN_USER_ID/.test(error.message)
    );
  } finally {
    restore();
  }
});

function installEnv(values) {
  const previous = {};
  for (const key of ENV_KEYS) {
    previous[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, values);

  return () => {
    for (const key of ENV_KEYS) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  };
}
