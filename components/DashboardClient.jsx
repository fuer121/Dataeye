"use client";

import { Download } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusMessage from "@/components/StatusMessage";
import { DATAEYE_RANKING_DEFINITIONS, DATAEYE_VISIBLE_RANK_TYPE_OPTIONS } from "@/lib/dataeye-rankings";

const sourceLabels = {
  dataeye: "DataEye / 剧查查",
  native: "站内原生短剧",
  hongguo: "红果（暂停推进）"
};

const sourceTabs = [
  ["native", "站内原生短剧"],
  ["dataeye", "剧查查"]
];

const matchLabels = {
  all: "全部",
  matched: "已匹配",
  unmatched: "未匹配"
};

const watchStatusLabels = {
  all: "全部",
  pending: "待关注",
  followed: "已关注",
  ignored: "已忽略"
};

const listingStatusLabels = {
  all: "全部",
  new: "新上榜",
  recurring: "连续上榜",
  rank_up: "排名上升",
  rank_down: "排名下降"
};

const runStatusLabels = {
  success: "成功",
  failed: "失败"
};

const runModeLabels = {
  sample: "模拟",
  capture: "抓包导入",
  live: "真实 live"
};

const namedRankTypeOptions = DATAEYE_VISIBLE_RANK_TYPE_OPTIONS;
const namedDataEyeRankTypes = new Set(namedRankTypeOptions.map(([value]) => Number(value)));
const singlePeriodDataEyeRankPeriods = new Map(
  DATAEYE_RANKING_DEFINITIONS
    .filter((item) => item.periods.length === 1)
    .map((item) => [String(item.rankType), item.periods[0]])
);

const rankPeriodOptions = [
  ["day", "日榜"],
  ["week", "周榜"],
  ["month", "月榜"]
];

export default function DashboardClient({
  initialDate,
  initialSource = "native",
  initialMatch = "all",
  initialDataKind = "all",
  initialRankType = "all",
  initialRankPeriod = "day",
  initialPeriodValue = "",
  initialWatchStatus = "all",
  initialListingStatus = "all",
  initialItems = [],
  initialRuns = [],
  initialMvpStatus = null
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initialActiveSource = initialSource === "dataeye" ? "dataeye" : "native";
  const initialSinglePeriod = initialActiveSource === "dataeye"
    ? singlePeriodDataEyeRankPeriods.get(String(initialRankType))
    : null;
  const [date, setDate] = useState(initialDate);
  const [source, setSource] = useState(initialActiveSource);
  const [match, setMatch] = useState(initialMatch);
  const [dataKind, setDataKind] = useState(initialDataKind);
  const [rankType, setRankType] = useState(initialRankType);
  const [rankPeriod, setRankPeriod] = useState(initialSinglePeriod || initialRankPeriod);
  const [periodValue, setPeriodValue] = useState(initialPeriodValue);
  const [watchStatus, setWatchStatus] = useState(initialWatchStatus);
  const [listingStatus, setListingStatus] = useState(initialListingStatus);
  const [items, setItems] = useState(initialItems);
  const [runs, setRuns] = useState(initialRuns);
  const [mvpStatus, setMvpStatus] = useState(initialMvpStatus);
  const [loading, setLoading] = useState(false);
  const [watchUpdatingTitle, setWatchUpdatingTitle] = useState("");
  const [message, setMessage] = useState(null);
  const isNativeView = source === "native";
  const isDataEyeView = source === "dataeye";
  const filterPeriodValue = isNativeView ? periodValue || date : periodValue;
  const shouldShowPeriodSwitch = !isDataEyeView || !singlePeriodDataEyeRankPeriods.has(String(rankType));
  const visibleItems = useMemo(() => items.filter(shouldDisplayRankingItem), [items]);
  const monitorSummary = useMemo(() => getMonitorSummary(visibleItems), [visibleItems]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ source, match, dataKind, rankType, rankPeriod, watchStatus, listingStatus });
    if (isNativeView) {
      params.set("date", filterPeriodValue);
      params.set("periodValue", filterPeriodValue);
    } else {
      params.set("date", date);
      if (filterPeriodValue) params.set("periodValue", filterPeriodValue);
    }
    return params.toString();
  }, [date, source, match, dataKind, rankType, rankPeriod, watchStatus, listingStatus, filterPeriodValue, isNativeView]);

  const runsQuery = useMemo(() => {
    const params = new URLSearchParams({
      date: isNativeView ? filterPeriodValue : date,
      source,
      mode: dataKind === "all" ? "all" : dataKind
    });
    return params.toString();
  }, [date, source, dataKind, filterPeriodValue, isNativeView]);

  const latestPreview = mvpStatus?.dataeye?.latestPreview;
  const latestCapture = mvpStatus?.dataeye?.latestCapture;
  const hasExpiredDataEyePreview = latestPreview?.health === "auth_expired";
  const canRefreshDataEyeLogin = latestCapture?.freshness?.status === "fresh";
  const shouldShowDataEyeLoginRefresh = hasExpiredDataEyePreview || canRefreshDataEyeLogin;
  const dataEyeLoginRefreshText = canRefreshDataEyeLogin
    ? "已检测到 fresh DataEye 抓包，可以刷新登录态并预检。"
    : latestPreview?.action || "请重新打开剧查查小程序并用 Charles 导出新 HAR，然后刷新本地登录态。";
  const loadData = useCallback(async () => {
    const [rankingsResponse, runsResponse, statusResponse] = await Promise.all([
      fetch(`/api/rankings?${query}`),
      fetch(`/api/runs?${runsQuery}`),
      fetch("/api/status")
    ]);
    const rankingsPayload = await rankingsResponse.json();
    const runsPayload = await runsResponse.json();
    const statusPayload = await statusResponse.json();

    if (!rankingsResponse.ok) {
      throw new Error(rankingsPayload.error || "榜单数据读取失败");
    }

    if (!runsResponse.ok) {
      throw new Error(runsPayload.error || "采集日志读取失败");
    }

    if (!statusResponse.ok) {
      throw new Error(statusPayload.error || "MVP 状态读取失败");
    }

    setItems(rankingsPayload.items || []);
    setRuns(runsPayload.items || []);
    setMvpStatus(statusPayload);
  }, [query, runsQuery]);

  async function loadLatestRankingScope(nextSource, scope = {}) {
    const params = new URLSearchParams({
      source: nextSource,
      dataKind: scope.dataKind || dataKind,
      rankType: scope.rankType || rankType,
      rankPeriod: scope.rankPeriod || rankPeriod
    });
    const response = await fetch(`/api/rankings/latest?${params}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "最新榜期读取失败");
    }

    return {
      date: payload.date || "",
      periodValue: payload.periodValue || ""
    };
  }

  useEffect(() => {
    loadData().catch((error) => {
      setMessage({ type: "error", text: error.message });
    });
  }, [loadData]);

  useEffect(() => {
    router.replace(`${pathname}?${query}`, { scroll: false });
  }, [pathname, query, router]);

  useEffect(() => {
    if (!isDataEyeView) return;
    const singlePeriod = singlePeriodDataEyeRankPeriods.get(String(rankType));
    if (singlePeriod && rankPeriod !== singlePeriod) {
      setRankPeriod(singlePeriod);
    }
  }, [isDataEyeView, rankType, rankPeriod]);

  async function selectSourceTab(nextSource) {
    const nextDataKind = nextSource === "native" ? "live" : dataKind;
    const nextRankType = "all";
    let latestScope = { date, periodValue };
    try {
      latestScope = await loadLatestRankingScope(nextSource, {
        dataKind: nextDataKind,
        rankType: nextRankType,
        rankPeriod
      });
    } catch (error) {
      setMessage({ type: "warning", text: error.message });
    }

    setSource(nextSource);
    setMatch("all");
    setWatchStatus("all");
    setListingStatus("all");
    setRankType(nextRankType);
    if (latestScope.date) {
      setDate(latestScope.date);
    }
    if (nextSource === "native") {
      setDataKind("live");
      setPeriodValue(latestScope.periodValue || latestScope.date);
    } else {
      setPeriodValue("");
    }
  }

  function updatePrimaryDateFilter(value) {
    setDate(value);
    if (source === "native") {
      setPeriodValue(value);
    }
  }

  function updateRankType(value) {
    setRankType(value);
    const singlePeriod = singlePeriodDataEyeRankPeriods.get(String(value));
    if (singlePeriod) {
      setRankPeriod(singlePeriod);
    }
  }

  async function importNativeRankings() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/native/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "站内原生短剧 Excel 导入失败");
      }

      setDate(payload.rankingDate || date);
      setSource("native");
      setDataKind("live");
      setMatch("all");
      setWatchStatus("all");
      setListingStatus("all");
      setPeriodValue(payload.rankingDate || date);
      await loadData();
      setMessage({
        type: "success",
        text: `${payload.message} 数据日期 ${payload.rankingDate}，导出日期 ${payload.exportDate}。`
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function refreshDataEyeLogin() {
    if (latestCapture?.freshness?.status !== "fresh") {
      setMessage({
        type: "warning",
        text: "当前 DataEye 抓包不是 fresh。请重新打开剧查查小程序并用 Charles 导出新 HAR，再刷新登录态。"
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dataeye/refresh-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      });
      const payload = await response.json();
      await loadData();
      setMessage({
        type: response.ok ? "success" : "warning",
        text: `${payload.message || "DataEye 登录态刷新完成。"} ${payload.nextAction || ""}`
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function updateWatchStatus(item, status) {
    setWatchUpdatingTitle(item.normalizedTitle || item.title);
    setMessage(null);
    try {
      const response = await fetch("/api/watch-states", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: item.title, status, note: item.watchNote || "" })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "监控状态更新失败");
      }

      const updated = payload.item;
      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.normalizedTitle === updated.normalizedTitle
            ? {
                ...currentItem,
                watchStatus: updated.status,
                watchNote: updated.note,
                watchUpdatedAt: updated.updatedAt
              }
            : currentItem
        )
      );
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setWatchUpdatingTitle("");
    }
  }

  return (
    <AppShell active="rankings">
      <header className="page-header">
        <div>
          <h1>榜单数据</h1>
          <p>按日期和来源查看短剧/漫剧榜单，并标注小说库精确匹配结果。</p>
        </div>
      </header>

      <section className="source-tabs" aria-label="榜单来源">
        {sourceTabs.map(([value, label]) => (
          <button
            className={source === value ? "active" : ""}
            key={value}
            type="button"
            onClick={() => selectSourceTab(value)}
          >
            {label}
          </button>
        ))}
      </section>

      <section className="toolbar" aria-label="榜单筛选">
        <label>
          {isNativeView ? "榜期" : "日期"}
          <input type="date" value={date} onChange={(event) => updatePrimaryDateFilter(event.target.value)} />
        </label>
        <fieldset className="filter-block match-filter">
          匹配状态
          <div className="segmented-control" role="radiogroup" aria-label="匹配状态">
            {Object.entries(matchLabels).map(([value, label]) => (
              <button
                className={match === value ? "active" : ""}
                key={value}
                type="button"
                role="radio"
                aria-checked={match === value}
                onClick={() => setMatch(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <label>
          监控状态
          <select value={watchStatus} onChange={(event) => setWatchStatus(event.target.value)}>
            {Object.entries(watchStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          上榜情况
          <select value={listingStatus} onChange={(event) => setListingStatus(event.target.value)}>
            {Object.entries(listingStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {isNativeView ? (
          <button className="primary-button compact" disabled={loading} onClick={importNativeRankings}>
            <Download size={16} />
            导入站内原生短剧 Excel
          </button>
        ) : null}
      </section>

      <StatusMessage message={message} />

      {isDataEyeView && shouldShowDataEyeLoginRefresh ? (
        <section className="status-action" aria-label="DataEye 登录态恢复">
          <strong>重新抓包并刷新 DataEye 登录态</strong>
          <span>{dataEyeLoginRefreshText}</span>
          <div className="status-action-row">
            <code>npm run dataeye:refresh-login</code>
            <button className="secondary-button" disabled={loading} onClick={refreshDataEyeLogin}>
              刷新登录态并预检
            </button>
          </div>
        </section>
      ) : null}

      <section className="monitor-summary" aria-label="榜单监控摘要">
        <div>
          <span>已匹配</span>
          <strong>{monitorSummary.matched}</strong>
        </div>
        <div>
          <span>待关注</span>
          <strong>{monitorSummary.pending}</strong>
        </div>
        <div>
          <span>新上榜</span>
          <strong>{monitorSummary.newListings}</strong>
        </div>
        <div>
          <span>连续上榜</span>
          <strong>{monitorSummary.recurring}</strong>
        </div>
      </section>

      {isDataEyeView ? (
      <section className="rank-type-module" aria-label="榜单类型">
        <div className="rank-type-tabs" role="tablist" aria-label="切换榜单类型">
          <button
            className={rankType === "all" ? "active" : ""}
            type="button"
            role="tab"
            aria-selected={rankType === "all"}
            onClick={() => updateRankType("all")}
          >
            全部榜单
          </button>
          {namedRankTypeOptions.map(([value, label]) => (
            <button
              className={rankType === value ? "active" : ""}
              key={value}
              type="button"
              role="tab"
              aria-selected={rankType === value}
              onClick={() => updateRankType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      ) : null}

      <section className="table-panel">
        <div className="panel-title">
          {shouldShowPeriodSwitch ? (
          <div className="period-switch" role="tablist" aria-label="切换榜单周期">
            {rankPeriodOptions.map(([value, label]) => (
              <button
                className={rankPeriod === value ? "active" : ""}
                key={value}
                type="button"
                role="tab"
                aria-selected={rankPeriod === value}
                onClick={() => setRankPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          ) : null}
          <span>{loading ? "处理中" : "已同步本地 SQLite"}</span>
        </div>
        <div className="table-wrap">
          <table className="rankings-table">
            <thead>
              <tr>
                <th>榜期</th>
                <th>排名</th>
                <th>短剧/漫剧名称</th>
                <th>{isNativeView ? "消耗" : "热度值"}</th>
                <th>是否匹配小说</th>
                <th>匹配小说名称</th>
                <th>平台 id</th>
                <th>上榜情况/排名变化</th>
                <th>监控状态</th>
                <th>采集时间</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.periodValue}</td>
                  <td>{item.rank}</td>
                  <td className="strong-cell">{item.title}</td>
                  <td>{formatHeatValue(item.heatValue, isNativeView)}</td>
                  <td>
                    <span className={`badge ${item.matchStatus}`}>{item.matchStatus === "matched" ? "已匹配" : "未匹配"}</span>
                  </td>
                  <td>{item.matchStatus === "matched" && item.matchedNovelNames !== "未匹配" ? item.matchedNovelNames : ""}</td>
                  <td>{item.matchedNovelPlatformIds || ""}</td>
                  <td>{formatListingSummary(item)}</td>
                  <td>
                    <select
                      className="watch-status-select"
                      value={item.watchStatus || "pending"}
                      disabled={watchUpdatingTitle === (item.normalizedTitle || item.title)}
                      onChange={(event) => updateWatchStatus(item, event.target.value)}
                    >
                      {Object.entries(watchStatusLabels)
                        .filter(([value]) => value !== "all")
                        .map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>{new Date(item.collectedAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
              {!visibleItems.length ? (
                <tr>
                  <td colSpan="10" className="empty-cell">
                    当前筛选条件下暂无可展示数据。页面默认隐藏未命名的 DataEye 榜单；如需核对原始采集结果，请查看采集报告或后台查询。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="runs-panel">
        <h2>最近采集日志</h2>
        <div className="run-list">
          {runs.map((run) => (
            <div className="run-item" key={run.id}>
              <span className={`dot ${run.status}`} />
              <div>
                <div className="run-heading">
                  <strong>
                    {sourceLabels[run.source]} · {run.rankingDate} · {runModeLabels[run.mode] || run.mode}
                  </strong>
                  <span className={`badge run-status ${run.status}`}>{runStatusLabels[run.status] || run.status}</span>
                </div>
                <div className="run-meta">
                  <span>新增 {run.insertedCount}</span>
                  <span>跳过 {run.skippedCount}</span>
                  <span>{new Date(run.finishedAt).toLocaleString("zh-CN")}</span>
                </div>
                <p>{run.message}</p>
              </div>
            </div>
          ))}
          {!runs.length ? <p className="muted">暂无采集日志。</p> : null}
        </div>
      </section>
    </AppShell>
  );
}

function shouldDisplayRankingItem(item) {
  if (item?.source !== "dataeye") return true;
  return namedDataEyeRankTypes.has(Number(item?.rankType));
}

function getMonitorSummary(items) {
  return items.reduce(
    (summary, item) => ({
      matched: summary.matched + (item.matchStatus === "matched" ? 1 : 0),
      pending: summary.pending + ((item.watchStatus || "pending") === "pending" ? 1 : 0),
      newListings: summary.newListings + (item.isNewListing ? 1 : 0),
      recurring: summary.recurring + (item.isRecurringListing ? 1 : 0)
    }),
    { matched: 0, pending: 0, newListings: 0, recurring: 0 }
  );
}

function formatListingSummary(item) {
  let listingText = "";
  if (item.isNewListing) {
    listingText = "新上榜";
  } else if (Number(item.consecutiveListedDays) > 1) {
    listingText = item.rankPeriod === "day" ? `连续 ${item.consecutiveListedDays} 天上榜` : `连续 ${item.consecutiveListedDays} 期上榜`;
  } else if (Number(item.totalListedDays) > 1) {
    listingText = item.rankPeriod === "day" ? `累计 ${item.totalListedDays} 天上榜` : `累计 ${item.totalListedDays} 期上榜`;
  }

  const rankChange = Number(item.rankChange);
  const hasRankChange = item.previousRank !== null && item.previousRank !== undefined && Number.isFinite(rankChange);
  if (!listingText && !hasRankChange) return "";

  return (
    <span className="listing-summary">
      {listingText ? <span>{listingText}</span> : null}
      {listingText && hasRankChange ? <span className="listing-separator">/</span> : null}
      {rankChange > 0 ? (
        <span className="rank-change rank-change-up" aria-label={`排名上升 ${rankChange}`}>
          排名↑{rankChange}
        </span>
      ) : null}
      {rankChange < 0 ? (
        <span className="rank-change rank-change-down" aria-label={`排名下降 ${Math.abs(rankChange)}`}>
          排名↓{Math.abs(rankChange)}
        </span>
      ) : null}
      {hasRankChange && rankChange === 0 ? <span className="rank-change rank-change-flat">排名持平</span> : null}
    </span>
  );
}

function formatHeatValue(value, isNativeView) {
  if (!isNativeView) return value;
  const number = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(number) ? String(Math.round(number)) : value;
}
