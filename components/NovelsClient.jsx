"use client";

import { Search, Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusMessage from "@/components/StatusMessage";

export default function NovelsClient() {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const [query, setQuery] = useState("");
  const [matchFilter, setMatchFilter] = useState("all");
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [manualNovelName, setManualNovelName] = useState("");
  const [manualDramaTitle, setManualDramaTitle] = useState("");
  const fileInputRef = useRef(null);
  const mappingFileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ query, match: matchFilter });
    const response = await fetch(`/api/novels?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "小说库读取失败");
    }
    setNovels(payload.novels || []);
  }, [query, matchFilter]);

  useEffect(() => {
    loadData().catch((error) => setMessage({ type: "error", text: error.message }));
  }, [loadData]);

  useEffect(() => {
    const dramaTitle = String(searchParams.get("dramaTitle") || "").trim();
    if (!dramaTitle) return;
    setManualDramaTitle(dramaTitle);
    setMessage({ type: "info", text: `已带入榜单作品：${dramaTitle}，请选择小说后保存映射。` });
  }, [searchParams]);

  async function importFile(file) {
    if (!file) return;

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/novels/import", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      await loadData();
      setMessage({ type: response.ok ? "success" : "error", text: payload.message || payload.error });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLoading(false);
    }
  }

  async function importMappingFile(file) {
    if (!file) return;

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/novels/import/mappings", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      await loadData();
      setMessage({ type: response.ok ? "success" : "error", text: payload.message || payload.error });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      if (mappingFileInputRef.current) mappingFileInputRef.current.value = "";
      setLoading(false);
    }
  }

  async function saveManualMapping(event) {
    event.preventDefault();
    const novelName = manualNovelName.trim();
    const dramaTitle = manualDramaTitle.trim();

    if (!novelName || !dramaTitle) {
      setMessage({ type: "error", text: "请填写小说名称和短剧/漫剧名称。" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/novels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mappings: [
            {
              novelName,
              dramaTitle,
              relationType: "manual",
              sourceRef: "manual-form"
            }
          ]
        })
      });
      const payload = await response.json();
      await loadData();
      setMessage({
        type: response.ok ? "success" : "error",
        text: response.ok ? `已保存 ${payload.changedCount} 条映射。` : payload.error
      });
      if (response.ok) {
        setManualDramaTitle("");
      }
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell active="novels">
      <header className="page-header">
        <div>
          <h1>小说库</h1>
          <p>导入本地 Excel/CSV 小说主库，并在小说列表中维护短剧/漫剧映射。</p>
        </div>
        <div className="header-actions">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".xlsx,.xls,.csv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/json"
            onChange={(event) => importFile(event.target.files?.[0])}
          />
          <button className="primary-button" disabled={loading} onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            导入 Excel/CSV
          </button>
          <input
            ref={mappingFileInputRef}
            className="visually-hidden"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(event) => importMappingFile(event.target.files?.[0])}
          />
          <button className="secondary-button" disabled={loading} onClick={() => mappingFileInputRef.current?.click()}>
            <Upload size={16} />
            导入映射 Excel
          </button>
        </div>
      </header>

      <StatusMessage message={message} />

      <form className="toolbar" aria-label="维护小说映射" onSubmit={saveManualMapping}>
        <label>
          小说名称
          <input
            name="novelName"
            placeholder="从下方列表点击维护映射"
            value={manualNovelName}
            onChange={(event) => setManualNovelName(event.target.value)}
          />
        </label>
        <label>
          短剧/漫剧名称
          <input
            name="dramaTitle"
            placeholder="输入短剧/漫剧名称"
            value={manualDramaTitle}
            onChange={(event) => setManualDramaTitle(event.target.value)}
          />
        </label>
        <button className="primary-button compact" disabled={loading} type="submit">
          保存映射
        </button>
        {returnTo ? (
          <Link className="secondary-button compact" href={returnTo}>
            返回榜单核对匹配
          </Link>
        ) : null}
      </form>

      <form
        className="toolbar"
        aria-label="小说库搜索"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setQuery(String(formData.get("query") || ""));
          setMatchFilter(String(formData.get("match") || "all"));
        }}
      >
        <label className="wide-field">
          搜索
          <span className="input-with-icon">
            <Search size={16} />
            <input key={query} name="query" type="search" placeholder="输入小说名称或短剧名称" defaultValue={query} />
          </span>
        </label>
        <label>
          映射匹配
          <select name="match" value={matchFilter} onChange={(event) => setMatchFilter(event.target.value)}>
            <option value="all">全部</option>
            <option value="matched">是</option>
            <option value="unmatched">否</option>
          </select>
        </label>
        <button className="secondary-button compact" type="submit">
          <Search size={16} />
          搜索
        </button>
      </form>

      <section className="table-panel">
        <div className="panel-title">
          <h2>小说库</h2>
          <span>{novels.length} 条</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>平台ID</th>
                <th>书库ID</th>
                <th>小说名称</th>
                <th>短剧/漫剧名</th>
                <th>映射匹配</th>
                <th>最近更新时间</th>
              </tr>
            </thead>
            <tbody>
              {novels.map((novel) => (
                <tr key={novel.id}>
                  <td>{novel.platformId || "-"}</td>
                  <td>{novel.bookId || "-"}</td>
                  <td className="strong-cell">{novel.novelName}</td>
                  <td>{novel.dramaTitles?.length ? novel.dramaTitles.join("、") : "未映射"}</td>
                  <td>
                    <span className={`badge ${novel.mappingMatched ? "matched" : "unmatched"}`}>
                      {novel.mappingMatched ? "是" : "否"}
                    </span>
                  </td>
                  <td>{novel.updatedAt}</td>
                </tr>
              ))}
              {!novels.length ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    暂无小说。请先导入本地 Excel/CSV 小说库。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function getSafeReturnTo(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("/") || text.startsWith("//")) return "";
  return text;
}
