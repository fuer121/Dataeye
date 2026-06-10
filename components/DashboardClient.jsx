"use client";

import { Database, Download, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusMessage from "@/components/StatusMessage";
import { DATAEYE_VISIBLE_RANK_TYPE_OPTIONS } from "@/lib/dataeye-rankings";

const sourceLabels = {
  dataeye: "DataEye / 剧查查",
  native: "站内原生短剧",
  hongguo: "红果（暂停推进）"
};

const sourceTabs = [
  ["native", "站内原生短剧"],
  ["dataeye", "DataEye / 剧查查"]
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
  sample: "模拟",
  capture: "抓包导入",
  live: "真实 live"
};

const dataKindLabels = {
  all: "全部性质",
  sample: "模拟",
  capture: "抓包导入",
  live: "真实 live"
};

const namedRankTypeOptions = DATAEYE_VISIBLE_RANK_TYPE_OPTIONS;
const namedDataEyeRankTypes = new Set(namedRankTypeOptions.map(([value]) => Number(value)));
const fullDataEyeScope = {
  rankType: "all",
  period: "all"
};

const rankPeriodOptions = [
  ["day", "日榜"],
  ["week", "周榜"],
  ["month", "月榜"]
];

export default function DashboardClient({
  initialDate,
  initialSource = "dataeye",
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
  const initialActiveSource = initialSource === "native" ? "native" : "dataeye";
  const [date, setDate] = useState(initialDate);
  const [source, setSource] = useState(initialActiveSource);
  const [match, setMatch] = useState(initialMatch);
  const [dataKind, setDataKind] = useState(initialDataKind);
  const [rankType, setRankType] = useState(initialRankType);
  const [rankPeriod, setRankPeriod] = useState(initialRankPeriod);
  const [periodValue, setPeriodValue] = useState(initialPeriodValue);
  const [items, setItems] = useState(initialItems);
  const [runs, setRuns] = useState(initialRuns);
  const [mvpStatus, setMvpStatus] = useState(initialMvpStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmedLivePreviewKey, setConfirmedLivePreviewKey] = useState("");
  const visibleItems = useMemo(() => items.filter(shouldDisplayRankingItem), [items]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ date, source, match, dataKind, rankType, rankPeriod });
    if (periodValue) params.set("periodValue", periodValue);
    return params.toString();
  }, [date, source, match, dataKind, rankType, rankPeriod, periodValue]);

  const runsQuery = useMemo(() => {
    const params = new URLSearchParams({
      date,
      source,
      mode: dataKind === "all" ? "all" : dataKind
    });
    return params.toString();
  }, [date, source, dataKind]);

  const returnToRankings = useMemo(() => {
    const params = new URLSearchParams({ date, source, match: "all", dataKind, rankType, rankPeriod });
    if (periodValue) params.set("periodValue", periodValue);
    return `/?${params.toString()}`;
  }, [date, source, dataKind, rankType, rankPeriod, periodValue]);

  const latestPreview = mvpStatus?.dataeye?.latestPreview;
  const latestCapture = mvpStatus?.dataeye?.latestCapture;
  const hasExpiredDataEyePreview = latestPreview?.health === "auth_expired";
  const canRefreshDataEyeLogin = latestCapture?.freshness?.status === "fresh";
  const shouldShowDataEyeLoginRefresh = hasExpiredDataEyePreview || canRefreshDataEyeLogin;
  const dataEyeLoginRefreshText = canRefreshDataEyeLogin
    ? "已检测到 fresh DataEye 抓包，可以刷新登录态并预检。"
    : latestPreview?.action || "请重新打开剧查查小程序并用 Charles 导出新 HAR，然后刷新本地登录态。";
  const isNativeView = source === "native";
  const isDataEyeView = source === "dataeye";

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

  useEffect(() => {
    loadData().catch((error) => {
      setMessage({ type: "error", text: error.message });
    });
  }, [loadData]);

  useEffect(() => {
    router.replace(`${pathname}?${query}`, { scroll: false });
  }, [pathname, query, router]);

  function selectSourceTab(nextSource) {
    setSource(nextSource);
    setMatch("all");
    setRankType("all");
    setPeriodValue("");
    setConfirmedLivePreviewKey("");
    if (nextSource === "native") {
      setDataKind("live");
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
      await loadData();

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

  const liveSource = "dataeye";
  const captureSource = "dataeye";
  const currentLivePreviewKey = `${date}:${liveSource}:${rankType}:${rankPeriod}`;
  const fullLivePreviewKey = `${date}:${liveSource}:${fullDataEyeScope.rankType}:${fullDataEyeScope.period}`;
  const canCollectLive = confirmedLivePreviewKey === currentLivePreviewKey;
  const canCollectFullLive = confirmedLivePreviewKey === fullLivePreviewKey;
  const liveGateText = canCollectLive ? "已预检，可采集真实榜单" : "预检通过后可落库";
  const fullLiveGateText = canCollectFullLive ? "已预检，可一键采集全部榜单与周期" : "全量预检通过后可一键落库";

  async function previewLiveCollection(scope = {}) {
    const targetRankType = scope.rankType || rankType;
    const targetPeriod = scope.period || rankPeriod;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/collect/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, source: liveSource, rankType: targetRankType, period: targetPeriod })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(formatCollectError(payload, "真实采集预检失败"));
      }

      const firstTitles = (payload.preview || [])
        .slice(0, 3)
        .map((item) => `#${item.rank} ${item.title}`)
        .join("；");
      setMessage({
        type: "success",
        text: `${sourceLabels[payload.source]} 预检成功：${payload.count} 条。${firstTitles}`
      });
      setConfirmedLivePreviewKey(`${payload.rankingDate}:${payload.source}:${payload.rankType}:${payload.period}`);
    } catch (error) {
      setConfirmedLivePreviewKey("");
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function importCaptureRanking() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/capture/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, source: captureSource })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || payload.message || "抓包榜单导入失败");
      }

      setDate(payload.rankingDate || date);
      setSource(payload.source || "dataeye");
      setDataKind("capture");
      setMatch("all");
      await loadData();
      const freshnessText = payload.captureFreshness?.ageLabel
        ? ` 抓包距今 ${payload.captureFreshness.ageLabel}（${payload.captureFreshness.note}）。`
        : "";
      setMessage({
        type: "success",
        text: `${sourceLabels[payload.source] || payload.source} 抓包导入完成：新增 ${payload.insertedCount} 条，跳过 ${payload.skippedCount} 条。${freshnessText}`
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function importNovels() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/novels/import", { method: "POST" });
      const payload = await response.json();
      await loadData();
      setMessage({ type: response.ok ? "success" : "error", text: payload.message || payload.error });
    } catch (error) {
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
      setPeriodValue("");
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

  async function uploadCaptureFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/captures/upload", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "抓包上传失败");
      }
      let pipelinePayload = payload.pipeline;
      try {
        pipelinePayload = pipelinePayload?.reportPath ? pipelinePayload : await requestCapturePipeline();
      } catch (pipelineError) {
        await loadData();
        setMessage({
          type: "warning",
          text: `${payload.message} 但 DataEye 抓包报告生成失败：${pipelineError.message}`
        });
        return;
      }
      await loadData();
      setConfirmedLivePreviewKey("");
      setMessage({
        type: "success",
        text: `${payload.message} 已生成 DataEye 抓包报告。${pipelinePayload.reportPath || ""}`
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function requestCapturePipeline() {
    const response = await fetch("/api/capture/pipeline", { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "DataEye 抓包报告生成失败");
    }

    return payload;
  }

  async function runCapturePipeline() {
    setLoading(true);
    setMessage(null);
    try {
      const payload = await requestCapturePipeline();
      await loadData();
      setConfirmedLivePreviewKey("");
      setMessage({ type: "success", text: payload.message || "DataEye 抓包报告已生成。" });
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
      <header className="page-header">
        <div>
          <h1>榜单数据</h1>
          <p>按日期和来源查看短剧/漫剧榜单，并标注小说库精确匹配结果。</p>
        </div>
        <div className="header-actions">
          {isDataEyeView ? (
            <>
              <label className="secondary-button file-button">
                上传抓包
                <input
                  className="visually-hidden"
                  type="file"
                  accept=".har,.json,.txt,.curl"
                  disabled={loading}
                  onChange={uploadCaptureFile}
                />
              </label>
              <button className="secondary-button" disabled={loading} onClick={runCapturePipeline}>
                生成 DataEye 抓包报告
              </button>
            </>
          ) : null}
          <button className="secondary-button" disabled={loading} onClick={importNovels}>
            <Database size={16} />
            导入模拟小说库
          </button>
          {isDataEyeView ? (
            <button className="primary-button" disabled={loading} onClick={() => collect("sample", liveSource)}>
              <Download size={16} />
              采集 DataEye 模拟榜单
            </button>
          ) : null}
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
          日期
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label>
          匹配状态
          <select value={match} onChange={(event) => setMatch(event.target.value)}>
            {Object.entries(matchLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          数据性质
          <select value={dataKind} onChange={(event) => setDataKind(event.target.value)}>
            {Object.entries(dataKindLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          榜期
          <input value={periodValue} placeholder="全部榜期" onChange={(event) => setPeriodValue(event.target.value)} />
        </label>
        {isNativeView ? (
          <button className="primary-button compact" disabled={loading} onClick={importNativeRankings}>
            <Download size={16} />
            导入站内原生短剧 Excel
          </button>
        ) : null}
        {isDataEyeView ? (
          <>
            <button className="secondary-button compact" disabled={loading} onClick={() => collect("sample", liveSource)}>
              <RefreshCw size={16} />
              采集 DataEye 模拟榜单
            </button>
            <button className="ghost-button compact" disabled={loading} onClick={importCaptureRanking}>
              导入{sourceLabels[captureSource]}抓包榜单
            </button>
            <button className="ghost-button compact" disabled={loading} onClick={previewLiveCollection}>
              预检当前筛选{sourceLabels[liveSource]}
            </button>
            <button
              className="ghost-button compact"
              disabled={loading || !canCollectLive}
              title={canCollectLive ? "" : "先完成同一日期、同一来源的预检"}
              onClick={() => collect("live", liveSource)}
            >
              采集当前筛选{sourceLabels[liveSource]}
            </button>
            <span className="live-gate-status">{liveGateText}</span>
          </>
        ) : null}
      </section>

      {isDataEyeView ? (
      <section className="status-action collection-action-panel" aria-label="DataEye 全量采集">
        <strong>全量 DataEye 真实采集</strong>
        <span>固定按全部可采榜单类型和日榜/周榜/月榜执行，不受当前页面筛选影响。</span>
        <div className="status-action-row">
          <button className="secondary-button" disabled={loading} onClick={() => previewLiveCollection(fullDataEyeScope)}>
            一键全量预检 DataEye
          </button>
          <button
            className="primary-button"
            disabled={loading || !canCollectFullLive}
            title={canCollectFullLive ? "" : "先完成同一日期、同一来源的全量预检"}
            onClick={() => collect("live", liveSource, fullDataEyeScope)}
          >
            一键全量真实采集 DataEye
          </button>
          <span className="live-gate-status">{fullLiveGateText}</span>
        </div>
      </section>
      ) : null}

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
            onClick={() => setRankType("all")}
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
              onClick={() => setRankType(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
      ) : null}

      <section className="table-panel">
        <div className="panel-title">
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
          <span>{loading ? "处理中" : "已同步本地 SQLite"}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>榜期</th>
                <th>排名</th>
                <th>短剧/漫剧名称</th>
                <th>{isNativeView ? "消耗" : "热度值"}</th>
                <th>类型</th>
                <th>是否匹配小说</th>
                <th>对应小说名称</th>
                <th>数据性质</th>
                <th>采集时间</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.periodValue}</td>
                  <td>{item.rank}</td>
                  <td className="strong-cell">{item.title}</td>
                  <td>{item.heatValue}</td>
                  <td>{item.dramaType}</td>
                  <td>
                    <span className={`badge ${item.matchStatus}`}>{item.matchStatus === "matched" ? "已匹配" : "未匹配"}</span>
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
                  <td>
                    <span className={`badge data-kind ${item.dataKind}`}>
                      {dataKindLabels[item.dataKind] || item.dataKind}
                    </span>
                  </td>
                  <td>{new Date(item.collectedAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
              {!visibleItems.length ? (
                <tr>
                  <td colSpan="9" className="empty-cell">
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

function formatCollectError(payload, fallback) {
  const message = payload?.error || fallback;
  if (!payload?.action) return message;
  return `${message} 下一步：${payload.action}`;
}

function shouldDisplayRankingItem(item) {
  if (item?.source !== "dataeye") return true;
  return namedDataEyeRankTypes.has(Number(item?.rankType));
}
