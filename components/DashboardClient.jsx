"use client";

import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusMessage from "@/components/StatusMessage";
import { DATAEYE_RANKING_DEFINITIONS, DATAEYE_VISIBLE_RANK_TYPE_OPTIONS } from "@/lib/dataeye-rankings";

const sourceLabels = {
  dataeye: "剧查查",
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

const runStatusLabels = {
  success: "成功",
  failed: "失败"
};

const runModeLabels = {
  sample: "模拟数据",
  capture: "抓包数据",
  live: "真实数据"
};

const dataKindLabels = {
  all: "全部数据",
  sample: "模拟数据",
  capture: "抓包数据",
  live: "真实数据"
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
  initialItems = [],
  initialRuns = [],
  initialMvpStatus = null
}) {
  const pathname = usePathname();
  const router = useRouter();
  const requestSeqRef = useRef(0);
  const hydratedRef = useRef(false);
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
  const [items, setItems] = useState(initialItems);
  const [runs, setRuns] = useState(initialRuns);
  const [mvpStatus, setMvpStatus] = useState(initialMvpStatus);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmedLivePreviewKey, setConfirmedLivePreviewKey] = useState("");
  const isNativeView = source === "native";
  const isDataEyeView = source === "dataeye";
  const filterPeriodValue = isNativeView ? periodValue || date : periodValue;
  const shouldShowPeriodSwitch = !isDataEyeView || !singlePeriodDataEyeRankPeriods.has(String(rankType));
  const visibleItems = useMemo(() => items.filter(shouldDisplayRankingItem), [items]);
  const matchedCount = useMemo(() => visibleItems.filter((item) => item.matchStatus === "matched").length, [visibleItems]);
  const unmatchedCount = Math.max(visibleItems.length - matchedCount, 0);

  const query = useMemo(() => {
    const params = new URLSearchParams({ source, match, dataKind, rankType, rankPeriod });
    if (isNativeView) {
      params.set("date", filterPeriodValue);
      params.set("periodValue", filterPeriodValue);
    } else {
      params.set("date", date);
      if (filterPeriodValue) params.set("periodValue", filterPeriodValue);
    }
    return params.toString();
  }, [date, source, match, dataKind, rankType, rankPeriod, filterPeriodValue, isNativeView]);

  const runsQuery = useMemo(() => {
    const params = new URLSearchParams({
      date: isNativeView ? filterPeriodValue : date,
      source,
      mode: dataKind === "all" ? "all" : dataKind
    });
    return params.toString();
  }, [date, source, dataKind, filterPeriodValue, isNativeView]);

  const returnToRankings = useMemo(() => {
    const params = new URLSearchParams({
      date: isNativeView ? filterPeriodValue : date,
      source,
      match: "all",
      dataKind,
      rankType,
      rankPeriod
    });
    if (filterPeriodValue) params.set("periodValue", filterPeriodValue);
    return `/?${params.toString()}`;
  }, [date, source, dataKind, rankType, rankPeriod, filterPeriodValue, isNativeView]);

  const latestPreview = mvpStatus?.dataeye?.latestPreview;
  const latestCapture = mvpStatus?.dataeye?.latestCapture;
  const hasExpiredDataEyePreview = latestPreview?.health === "auth_expired";
  const canRefreshDataEyeLogin = latestCapture?.freshness?.status === "fresh";
  const shouldShowDataEyeLoginRefresh = hasExpiredDataEyePreview || canRefreshDataEyeLogin;
  const dataEyeLoginRefreshText = canRefreshDataEyeLogin
    ? "已检测到 fresh DataEye 抓包，可以刷新登录态并预检。"
    : latestPreview?.action || "请重新打开剧查查小程序并用 Charles 导出新 HAR，然后刷新本地登录态。";
  const liveSource = "dataeye";
  const collectionBoundaryText = `${sourceLabels[liveSource]} 采集能力保留在后台接口和命令行，页面只展示已入库的真实榜单。`;

  const loadData = useCallback(async ({ showRefreshing = true } = {}) => {
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;
    if (showRefreshing) setRefreshing(true);

    try {
      const [rankingsResponse, runsResponse] = await Promise.all([
        fetch(`/api/rankings?${query}`),
        fetch(`/api/runs?${runsQuery}`)
      ]);
      const rankingsPayload = await rankingsResponse.json();
      const runsPayload = await runsResponse.json();

      if (!rankingsResponse.ok) {
        throw new Error(rankingsPayload.error || "榜单数据读取失败");
      }

      if (!runsResponse.ok) {
        throw new Error(runsPayload.error || "采集日志读取失败");
      }

      if (requestSeq !== requestSeqRef.current) return;
      setItems(rankingsPayload.items || []);
      setRuns(runsPayload.items || []);
    } finally {
      if (requestSeq === requestSeqRef.current && showRefreshing) {
        setRefreshing(false);
      }
    }
  }, [query, runsQuery]);

  async function loadStatus() {
    const response = await fetch("/api/status");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "状态读取失败");
    }
    setMvpStatus(payload);
  }

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
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    loadData().catch((error) => {
      setRefreshing(false);
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
    setRefreshing(true);
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
    setRankType(nextRankType);
    setConfirmedLivePreviewKey("");
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

  async function collect(mode = "sample", collectSource = source, scope = {}) {
    const targetRankType = scope.rankType || rankType;
    const targetPeriod = scope.period || rankPeriod;
    if (mode === "live") {
      const requestedPreviewKey = `${date}:${collectSource}:${targetRankType}:${targetPeriod}`;
      if (confirmedLivePreviewKey !== requestedPreviewKey) {
        setMessage({
          type: "warning",
          text: "请先完成同一日期、同一来源的真实采集预检，核对榜单行后再落库。"
        });
        return;
      }
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          source: collectSource,
          mode,
          confirmedPreview: mode === "live",
          rankType: targetRankType,
          period: targetPeriod
        })
      });
      const payload = await response.json();
      await loadData({ showRefreshing: false });
      await loadStatus();

      const runs = payload.runs || [];
      const hasFailedRun = runs.some((run) => run.status === "failed");
      const text = runs.map((run) => `${sourceLabels[run.source]}：${run.message}`).join(" ");
      setMessage({
        type: response.ok && !hasFailedRun ? "success" : "warning",
        text: text || "采集请求已完成。"
      });
      if (mode === "live" && response.ok && !hasFailedRun) {
        setSource(collectSource);
        setDataKind("live");
        setMatch("all");
      }
      if (mode === "live" && hasFailedRun) {
        setConfirmedLivePreviewKey("");
      }
    } catch (error) {
      if (mode === "live") setConfirmedLivePreviewKey("");
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
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
      setPeriodValue(payload.rankingDate || date);
      await loadData({ showRefreshing: false });
      await loadStatus();
      setMessage({
        type: "success",
        text: `${payload.message} 数据榜期 ${payload.rankingDate}，导出日期 ${payload.exportDate}。`
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
      await loadData({ showRefreshing: false });
      await loadStatus();
      setConfirmedLivePreviewKey("");
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

  return (
    <AppShell active="rankings">
      <header className="workspace-header">
        <div>
          <span className="eyebrow">运营核对台</span>
          <h1>热门榜单与小说匹配</h1>
          <p>优先查看已匹配作品，快速确认对应小说和平台 id；未匹配作品可直接进入小说库维护。</p>
        </div>
        <div className="workspace-header-meta" aria-label="当前筛选摘要">
          <span>{sourceLabels[source]}</span>
          <span>{isNativeView ? filterPeriodValue : date}</span>
          <span>{matchLabels[match]}</span>
        </div>
      </header>

      <section className="source-tabs source-segment" aria-label="榜单来源">
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

      <section className="filter-panel" aria-label="核心筛选">
        <div className="filter-grid">
          <label>
            {isNativeView ? "榜期" : "日期"}
            <input type="date" value={date} onChange={(event) => updatePrimaryDateFilter(event.target.value)} />
          </label>
          <div className="segmented-field">
            <span className="field-label">匹配状态</span>
            <div className="segmented-control" role="tablist" aria-label="匹配状态">
              {Object.entries(matchLabels).map(([value, label]) => (
                <button
                  className={match === value ? "active" : ""}
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={match === value}
                  onClick={() => setMatch(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <label>
            数据范围
            <select value={dataKind} onChange={(event) => setDataKind(event.target.value)}>
              {Object.entries(dataKindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-actions">
          {isNativeView ? (
            <button className="primary-button" disabled={loading} onClick={importNativeRankings}>
              <Download size={16} />
              导入站内原生短剧 Excel
            </button>
          ) : (
            <span className="helper-note" data-collection-ready={typeof collect === "function" ? "true" : "false"}>
              {collectionBoundaryText}
            </span>
          )}
        </div>
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

      <section className={`table-panel ${refreshing ? "is-refreshing" : ""}`} aria-busy={refreshing}>
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
          ) : (
            <span className="panel-kicker">单周期榜单</span>
          )}
          <span>{refreshing ? "正在更新榜单" : `当前 ${visibleItems.length} 条，已匹配 ${matchedCount} 条，未匹配 ${unmatchedCount} 条`}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>榜期</th>
                <th>排名</th>
                <th>短剧/漫剧名称</th>
                <th>{isNativeView ? "消耗" : "热度值"}</th>
                <th>是否匹配小说</th>
                <th>对应小说名称</th>
                <th>平台 id</th>
                <th>数据性质</th>
                <th>采集时间</th>
              </tr>
            </thead>
            <tbody>
              {refreshing ? (
                <tr>
                  <td colSpan="9" className="table-skeleton">
                    <span />
                    <span />
                    <span />
                    <span />
                  </td>
                </tr>
              ) : visibleItems.length ? (
                visibleItems.map((item) => (
                  <tr className={item.matchStatus === "matched" ? "row-matched" : "row-unmatched"} key={item.id}>
                    <td>{item.periodValue}</td>
                    <td className="rank-cell">{item.rank}</td>
                    <td className="strong-cell">{item.title}</td>
                    <td className="heat-cell">{formatHeatValue(item.heatValue, isNativeView)}</td>
                    <td>
                      <span className={`badge ${item.matchStatus}`}>
                        {item.matchStatus === "matched" ? "已匹配" : "未匹配"}
                      </span>
                    </td>
                    <td>
                      {item.matchStatus === "matched" ? (
                        item.matchedNovelNames
                      ) : (
                        <Link
                          className="table-link"
                          href={`/novels?dramaTitle=${encodeURIComponent(item.title)}&returnTo=${encodeURIComponent(returnToRankings)}`}
                        >
                          去维护映射
                        </Link>
                      )}
                    </td>
                    <td>{item.matchedNovelPlatformIds || ""}</td>
                    <td>
                      <span className={`badge data-kind ${item.dataKind}`}>
                        {dataKindLabels[item.dataKind] || item.dataKind}
                      </span>
                    </td>
                    <td>{new Date(item.collectedAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="empty-cell">
                    <div className="empty-state">
                      <strong>当前筛选下没有榜单数据</strong>
                      <span>可以切换匹配状态、榜期或榜单类型；如果要补齐匹配关系，请先到小说库导入或维护映射。</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="runs-panel">
        <div className="panel-title inline-panel-title">
          <h2>采集记录</h2>
          <span>最近 {runs.length} 条</span>
        </div>
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
          {!runs.length ? <p className="muted">暂无采集记录。</p> : null}
        </div>
      </section>
    </AppShell>
  );
}

function shouldDisplayRankingItem(item) {
  if (item?.source !== "dataeye") return true;
  return namedDataEyeRankTypes.has(Number(item?.rankType));
}

function formatHeatValue(value, isNativeView) {
  if (!isNativeView) return value;
  const number = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(number) ? String(Math.round(number)) : value;
}
