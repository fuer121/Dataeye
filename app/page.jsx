import DashboardClient from "@/components/DashboardClient";
import { formatShanghaiDate, isValidDateString } from "@/lib/date";
import { getMvpStatus } from "@/lib/mvp-status";
import { getLatestRankingDate, listCollectionRuns, listRankingEntries } from "@/lib/rankings";

const SOURCES = new Set(["all", "dataeye", "hongguo"]);
const MATCH_STATUSES = new Set(["all", "matched", "unmatched"]);
const DATA_KINDS = new Set(["all", "sample", "capture", "live"]);
const RANK_TYPES = new Set(["all", ...Array.from({ length: 21 }, (_, index) => String(index))]);
const RANK_PERIODS = new Set(["day", "week", "month"]);

export default async function HomePage({ searchParams }) {
  const params = (await searchParams) || {};
  const fallbackDate = getLatestRankingDate() || formatShanghaiDate(new Date());
  const initialDate = getValidDate(params.date) || fallbackDate;
  const initialSource = getAllowed(params.source, SOURCES, "all");
  const initialMatch = getAllowed(params.match, MATCH_STATUSES, "all");
  const initialDataKind = getAllowed(params.dataKind, DATA_KINDS, "all");
  const initialRankType = getAllowed(params.rankType, RANK_TYPES, "all");
  const initialRankPeriod = getAllowed(params.rankPeriod, RANK_PERIODS, "day");
  const initialPeriodValue = getString(params.periodValue) || "";
  const initialItems = listRankingEntries({
    date: initialDate,
    source: initialSource,
    match: initialMatch,
    dataKind: initialDataKind,
    rankType: initialRankType,
    rankPeriod: initialRankPeriod,
    periodValue: initialPeriodValue
  });
  const initialRuns = listCollectionRuns({
    date: initialDate,
    source: initialSource,
    mode: getRunMode(initialDataKind)
  });
  const initialMvpStatus = getMvpStatus();

  return (
    <DashboardClient
      initialDate={initialDate}
      initialSource={initialSource}
      initialMatch={initialMatch}
      initialDataKind={initialDataKind}
      initialRankType={initialRankType}
      initialRankPeriod={initialRankPeriod}
      initialPeriodValue={initialPeriodValue}
      initialItems={initialItems}
      initialRuns={initialRuns}
      initialMvpStatus={initialMvpStatus}
    />
  );
}

function getString(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getAllowed(value, allowedValues, fallback) {
  const text = getString(value);
  return allowedValues.has(text) ? text : fallback;
}

function getValidDate(value) {
  const text = getString(value);
  return isValidDateString(text) ? text : "";
}

function getRunMode(dataKind) {
  return dataKind === "all" ? "all" : dataKind;
}
