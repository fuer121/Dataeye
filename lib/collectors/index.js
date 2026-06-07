import { assertSource } from "../rankings.js";
import { formatShanghaiDate, isValidDateString } from "../date.js";
import { normalizeDataEyePeriodSelection, normalizeDataEyeRankTypeSelection } from "../dataeye-rankings.js";
import { collectDataEyeRanking, collectHongguoRanking } from "./live.js";
import { collectSampleRanking } from "./sample.js";

export const MODES = ["sample", "live"];

export function normalizeCollectRequest(body = {}) {
  const rankingDate = body.date || formatShanghaiDate(new Date());
  const mode = body.mode || "sample";
  const source = body.source || "all";
  const rankType = body.rankType ?? "0";
  const period = body.period || "day";

  if (!isValidDateString(rankingDate)) {
    throw new Error("date 必须是有效的 YYYY-MM-DD 日期。");
  }

  if (!MODES.includes(mode)) {
    throw new Error(`不支持的采集模式：${mode}`);
  }

  if (mode === "live" && source === "all") {
    throw new Error("真实采集需要明确指定 source=dataeye，避免混跑未验证来源。");
  }

  if (mode === "live" && source === "hongguo") {
    throw new Error("红果真实采集已暂停推进；请先完成抓包验证后再启用 live 采集。");
  }

  if (mode === "live" && source === "dataeye") {
    normalizeDataEyeRankTypeSelection(rankType);
    normalizeDataEyePeriodSelection(period);
  }

  const sources = source === "all" ? ["dataeye", "hongguo"] : [source];
  for (const item of sources) assertSource(item);

  return { rankingDate, mode, sources, rankType, period };
}

export function assertCollectedEntries({ entries, mode, source }) {
  if (mode === "live" && entries.length === 0) {
    throw new Error(`${source} 真实采集未返回任何榜单，已停止落库。`);
  }
}

export async function collectRanking({ source, rankingDate, mode = "sample", rankType = "0", period = "day" }) {
  assertSource(source);

  if (mode === "sample") {
    return collectSampleRanking({ source, rankingDate });
  }

  if (mode === "live" && source === "dataeye") {
    return collectDataEyeRanking({ rankingDate, rankType, period });
  }

  if (mode === "live" && source === "hongguo") {
    return collectHongguoRanking({ rankingDate });
  }

  throw new Error(`不支持的采集模式：${mode}`);
}
