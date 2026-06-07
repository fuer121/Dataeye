import { assertCollectedEntries, collectRanking, normalizeCollectRequest } from "./collectors/index.js";
import { nowIso } from "./date.js";
import { insertCollectionRun, upsertRankingEntries } from "./rankings.js";

export async function runCollection(input = {}) {
  const { rankingDate, mode, sources, rankType, period } = normalizeCollectRequest(input);
  const runs = [];

  for (const source of sources) {
    const startedAt = nowIso();
    try {
      const entries = await collectRanking({ source, rankingDate, mode, rankType, period });
      assertCollectedEntries({ entries, mode, source });
      const result = upsertRankingEntries(entries);
      const dimensions = summarizeRunDimensions({ source, rankType, period, entries });
      const run = {
        source,
        rankingDate,
        mode,
        ...dimensions,
        status: "success",
        message: `采集完成：新增 ${result.insertedCount} 条，跳过重复 ${result.skippedCount} 条。`,
        insertedCount: result.insertedCount,
        skippedCount: result.skippedCount,
        startedAt,
        finishedAt: nowIso()
      };
      insertCollectionRun(run);
      runs.push(run);
    } catch (error) {
      const run = {
        source,
        rankingDate,
        mode,
        ...summarizeRunDimensions({ source, rankType, period, entries: [] }),
        status: "failed",
        message: formatCollectionErrorMessage(error),
        insertedCount: 0,
        skippedCount: 0,
        startedAt,
        finishedAt: nowIso()
      };
      insertCollectionRun(run);
      runs.push(run);
    }
  }

  return {
    runs,
    failed: runs.some((run) => run.status === "failed")
  };
}

function formatCollectionErrorMessage(error) {
  const message = error?.message || "采集请求失败";
  if (!error?.action) return message;
  return `${message} 下一步：${error.action}`;
}

function summarizeRunDimensions({ source, rankType, period, entries }) {
  if (source !== "dataeye") return {};
  const firstEntry = entries[0];
  const singleRankType = rankType !== "all";
  const singlePeriod = period !== "all";
  const periodValues = new Set(entries.map((entry) => entry.periodValue).filter(Boolean));

  return {
    rankType: singleRankType ? Number(rankType) : null,
    rankTypeName: singleRankType ? firstEntry?.rankTypeName || null : null,
    rankPeriod: singlePeriod ? period : null,
    periodValue: singlePeriod && periodValues.size === 1 ? [...periodValues][0] : null
  };
}
