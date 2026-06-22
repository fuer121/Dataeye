import DashboardClient from "@/components/DashboardClient";
import { formatShanghaiDate, isValidDateString } from "@/lib/date";
import { DATAEYE_ACTIVE_RANK_TYPES } from "@/lib/dataeye-rankings";
import { getMvpStatus } from "@/lib/mvp-status";
import { getLatestPeriodValue, getLatestRankingDate, listCollectionRuns, listRankingEntries } from "@/lib/rankings";

const SOURCES = new Set(["dataeye", "native"]);
const MATCH_STATUSES = new Set(["all", "matched", "unmatched"]);
const DATA_KINDS = new Set(["all", "sample", "capture", "live"]);
const WATCH_STATUSES = new Set(["all", "pending", "followed", "ignored"]);
const LISTING_STATUSES = new Set(["all", "new", "recurring", "rank_up", "rank_down"]);
const RANK_TYPES = new Set([
  "all",
  ...Array.from({ length: 21 }, (_, index) => String(index)),
  ...DATAEYE_ACTIVE_RANK_TYPES.map((rankType) => String(rankType))
]);
const RANK_PERIODS = new Set(["day", "week", "month"]);

export default async function HomePage({ searchParams }) {
  const params = (await searchParams) || {};
  const initialSource = getAllowed(params.source, SOURCES, "native");
  const fallbackDate = getLatestRankingDate() || formatShanghaiDate(new Date());
  const requestedDate = getValidDate(params.date);
  const initialMatch = getAllowed(params.match, MATCH_STATUSES, "all");
  const initialDataKind = getAllowed(params.dataKind, DATA_KINDS, "all");
  const initialRankType = getAllowed(params.rankType, RANK_TYPES, "all");
  const initialRankPeriod = getAllowed(params.rankPeriod, RANK_PERIODS, "day");
  const initialWatchStatus = getAllowed(params.watchStatus, WATCH_STATUSES, "all");
  const initialListingStatus = getAllowed(params.listingStatus, LISTING_STATUSES, "all");
  const showDataEyeLoginRefresh =
    getString(params.showDataEyeLoginRefresh) === "1" || getString(params.refreshLogin) === "1";
  const latestNativePeriodValue =
    initialSource === "native"
      ? getLatestPeriodValue({
          source: "native",
          rankPeriod: initialRankPeriod,
          dataKind: initialDataKind
        })
      : "";
  const initialPeriodValue = getString(params.periodValue) || (initialSource === "native" ? latestNativePeriodValue : "");
  const initialDate = initialSource === "native" && initialPeriodValue ? initialPeriodValue : requestedDate || fallbackDate;
  const initialRankingFilters = {
    date: initialSource === "native" ? "" : initialDate,
    source: initialSource,
    dataKind: initialDataKind,
    rankType: initialRankType,
    rankPeriod: initialRankPeriod,
    periodValue: initialSource === "native" ? initialPeriodValue || initialDate : initialPeriodValue
  };
  const initialItems = listRankingEntries({
    ...initialRankingFilters,
    match: initialMatch,
    watchStatus: initialWatchStatus,
    listingStatus: initialListingStatus
  });
  const initialRuns = listCollectionRuns({
    date: initialSource === "native" ? initialPeriodValue || initialDate : initialDate,
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
      initialWatchStatus={initialWatchStatus}
      initialListingStatus={initialListingStatus}
      initialItems={initialItems}
      initialRuns={initialRuns}
      initialMvpStatus={initialMvpStatus}
      showDataEyeLoginRefresh={showDataEyeLoginRefresh}
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
