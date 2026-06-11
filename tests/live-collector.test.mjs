import assert from "node:assert/strict";
import test from "node:test";

import { collectDataEyeRanking, collectDataEyeRankingDetailed, CollectorUnavailableError } from "../lib/collectors/live.js";

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

test("collectDataEyeRanking maps current DataEye endpoint rows", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    calls.push(parsed);
    assert.equal(parsed.pathname, "/playlet/selectNativePlayletPlayCountListByDate");
    assert.equal(parsed.searchParams.get("pageId"), "1");
    assert.equal(parsed.searchParams.get("pageSize"), "30");
    assert.equal(parsed.searchParams.get("day"), "2026-06-11");

    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletNativeId: "dy-1001",
            playletName: "人心比菜凉",
            playCount: "1.2亿",
            playCountAdd: "7486w",
            tags: []
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({
      rankingDate: "2026-06-11",
      rankType: "103",
      period: "day"
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].rankType, 103);
    assert.equal(rows[0].rankTypeName, "抖音热播");
    assert.equal(rows[0].rankPeriod, "day");
    assert.equal(rows[0].periodValue, "2026-06-11");
    assert.equal(rows[0].rankingDate, "2026-06-11");
    assert.equal(rows[0].rank, 1);
    assert.equal(rows[0].title, "人心比菜凉");
    assert.equal(rows[0].heatValue, "7486w");
    assert.equal(rows[0].dramaType, "");
    const sourceRef = new URL(rows[0].sourceRef);
    assert.equal(sourceRef.pathname, "/playlet/selectNativePlayletPlayCountListByDate");
    assert.equal(sourceRef.searchParams.get("day"), "2026-06-11");
    assert.equal(calls.length, 1);
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking uses hot ranking day offset and period consume field", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    calls.push(parsed);
    assert.equal(parsed.pathname, "/playlet/listHotRanking");
    assert.equal(parsed.searchParams.get("day"), "2026-06-10");

    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletId: "hot-1001",
            playletName: "苏太太高调离婚了",
            totalConsumeNum: 9351000,
            consumeNum: 1034000,
            playletTags: ["都市", "逆袭"]
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({
      rankingDate: "2026-06-11",
      rankType: "101",
      period: "day"
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].rankTypeName, "热力榜");
    assert.equal(rows[0].periodValue, "2026-06-10");
    assert.equal(rows[0].rankingDate, "2026-06-11");
    assert.equal(rows[0].title, "苏太太高调离婚了");
    assert.equal(rows[0].heatValue, "1034000");
    assert.equal(rows[0].dramaType, "都市/逆袭");
    assert.equal(calls.length, 1);
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRanking keeps collection date while storing active endpoint week period value", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    assert.equal(parsed.pathname, "/playlet/selectNativePlayletPlayCountListByDate");
    assert.equal(parsed.searchParams.get("week"), "2026-06-01 ~ 2026-06-07");

    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: "人心比菜凉",
            playCountAdd: "7486w",
            tags: []
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({
      rankingDate: "2026-06-11",
      rankType: "103",
      period: "week"
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0].rankTypeName, "抖音热播");
    assert.equal(rows[0].rankPeriod, "week");
    assert.equal(rows[0].periodValue, "2026-06-01 ~ 2026-06-07");
    assert.equal(rows[0].rankingDate, "2026-06-11");
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

test("collectDataEyeRanking probes active DataEye ranking endpoints", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;
  const paths = [];

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    paths.push(parsed.pathname);
    const itemByPath = {
      "/playlet/getComicsPlayletByDate": {
        ranking: 1,
        playletName: "红果漫剧样例",
        hotValueText: "1.1亿",
        contentTypes: ["漫剧"]
      },
      "/playlet/listHotRanking": {
        ranking: 1,
        playletName: "热力样例",
        consumeNum: 100,
        playletTags: ["热力"]
      },
      "/playlet/selectNativePlayletPlayCountListByDate": {
        ranking: 1,
        playletName: "抖音样例",
        playCountAdd: "90w",
        tags: []
      },
      "/playlet/listHongGuoRanking": {
        ranking: 1,
        playletName: "红果样例",
        hotValue: 80,
        contentTypes: ["红果"]
      }
    };
    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [itemByPath[parsed.pathname]]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const rows = await collectDataEyeRanking({
      rankingDate: "2026-06-11",
      rankType: "all",
      period: "day"
    });

    assert.equal(rows.length, 4);
    assert.deepEqual(
      rows.map((row) => row.rankType),
      [119, 101, 103, 106]
    );
    assert.deepEqual(paths, [
      "/playlet/getComicsPlayletByDate",
      "/playlet/listHotRanking",
      "/playlet/selectNativePlayletPlayCountListByDate",
      "/playlet/listHongGuoRanking"
    ]);
  } finally {
    global.fetch = originalFetch;
    restore();
  }
});

test("collectDataEyeRankingDetailed reports day week month combo summary", async () => {
  const restore = installEnv({
    DATAEYE_AUTHENTICATION: "auth-value",
    DATAEYE_LOGIN_USER_ID: "650985"
  });
  const originalFetch = global.fetch;

  global.fetch = async (url) => {
    const parsed = new URL(String(url));
    if (parsed.pathname === "/playlet/motionComicDate") {
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

    return new Response(
      JSON.stringify({
        statusCode: 200,
        page: { pageId: 1, pageSize: 30, totalRecords: 1 },
        content: [
          {
            ranking: 1,
            playletName: `${parsed.searchParams.get("rankType")}-${parsed.searchParams.get("day") || parsed.searchParams.get("week") || parsed.searchParams.get("month")}`,
            playCountAdd: "1.0亿",
            tags: "[\"测试\"]"
          }
        ]
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };

  try {
    const result = await collectDataEyeRankingDetailed({
      rankingDate: "2026-06-06",
      rankType: "0",
      period: "all"
    });

    assert.equal(result.rows.length, 3);
    assert.equal(result.combos.length, 3);
    assert.deepEqual(
      result.combos.map((combo) => combo.rankPeriod),
      ["day", "week", "month"]
    );
    assert.ok(result.combos.every((combo) => combo.status === "ready"));
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
