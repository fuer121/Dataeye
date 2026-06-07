"use client";

import { Database, Pencil, RefreshCw, Search, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import StatusMessage from "@/components/StatusMessage";

export default function NovelsClient() {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [manualNovelName, setManualNovelName] = useState("");
  const [manualDramaTitle, setManualDramaTitle] = useState("");
  const [manualRelationType, setManualRelationType] = useState("manual");
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const loadData = useCallback(async () => {
    const params = new URLSearchParams({ query });
    const response = await fetch(`/api/novels?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "小说库读取失败");
    }
    setItems(payload.items || []);
  }, [query]);

  useEffect(() => {
    loadData().catch((error) => setMessage({ type: "error", text: error.message }));
  }, [loadData]);

  useEffect(() => {
    const dramaTitle = String(searchParams.get("dramaTitle") || "").trim();
    if (!dramaTitle) return;
    setManualDramaTitle(dramaTitle);
    setMessage({ type: "info", text: `已带入榜单作品：${dramaTitle}` });
  }, [searchParams]);

  async function importSample() {
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

  async function importFeishu() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/novels/import/feishu", { method: "POST" });
      const payload = await response.json();
      await loadData();
      setMessage({ type: response.ok ? "success" : "error", text: payload.message || payload.error });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function saveManualMapping(event) {
    event.preventDefault();
    const novelName = manualNovelName.trim();
    const dramaTitle = manualDramaTitle.trim();
    const relationType = manualRelationType.trim();

    if (!novelName || !dramaTitle) {
      setMessage({ type: "error", text: "请填写小说名称和短剧/漫剧名称。" });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/novels", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                novelName,
                dramaTitle,
                relationType
              }
            : {
                mappings: [
                  {
                    novelName,
                    dramaTitle,
                    relationType,
                    sourceRef: "manual-form"
                  }
                ]
              }
        )
      });
      const payload = await response.json();
      await loadData();
      setMessage({
        type: response.ok ? "success" : "error",
        text: response.ok ? `已${editingId ? "更新" : "保存"} ${payload.changedCount} 条映射。` : payload.error
      });
      if (response.ok) resetManualForm();
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  function editMapping(item) {
    setEditingId(item.id);
    setManualNovelName(item.novelName);
    setManualDramaTitle(item.dramaTitle);
    setManualRelationType(item.relationType || "manual");
    setMessage({ type: "info", text: `正在编辑：${item.dramaTitle}` });
  }

  function resetManualForm() {
    setEditingId(null);
    setManualNovelName("");
    setManualDramaTitle("");
    setManualRelationType("manual");
  }

  async function deleteMapping(item) {
    const confirmed = globalThis.confirm(`确认删除「${item.dramaTitle}」与「${item.novelName}」的映射吗？`);
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/novels?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const payload = await response.json();
      await loadData();
      setMessage({
        type: response.ok ? "success" : "error",
        text: response.ok ? `已删除 ${payload.changedCount} 条映射。` : payload.error
      });
      if (response.ok && editingId === item.id) resetManualForm();
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
          <p>查看小说与短剧/漫剧的对应关系，支持搜索、文件导入和手动维护。</p>
        </div>
        <div className="header-actions">
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(event) => importFile(event.target.files?.[0])}
          />
          <button className="secondary-button" disabled={loading} onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            导入 CSV/JSON
          </button>
          <button className="secondary-button" disabled={loading} onClick={importFeishu}>
            <RefreshCw size={16} />
            同步飞书表格
          </button>
          <button className="primary-button" disabled={loading} onClick={importSample}>
            <Database size={16} />
            导入模拟小说库
          </button>
        </div>
      </header>

      <form
        className="toolbar"
        aria-label="小说库搜索"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setQuery(String(formData.get("query") || ""));
        }}
      >
        <label className="wide-field">
          搜索
          <span className="input-with-icon">
            <Search size={16} />
            <input name="query" type="search" placeholder="输入小说名或短剧/漫剧名" defaultValue={query} />
          </span>
        </label>
        <button className="secondary-button compact" type="submit">
          <Search size={16} />
          搜索
        </button>
      </form>

      <StatusMessage message={message} />

      <form className="toolbar" aria-label="手动维护小说映射" onSubmit={saveManualMapping}>
        <label>
          小说名称
          <input
            name="novelName"
            placeholder="输入小说名称"
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
        <label>
          关系类型
          <select
            name="relationType"
            value={manualRelationType}
            onChange={(event) => setManualRelationType(event.target.value)}
          >
            <option value="manual">manual</option>
            <option value="exact">exact</option>
          </select>
        </label>
        <button className="primary-button compact" disabled={loading} type="submit">
          {editingId ? "更新映射" : "保存映射"}
        </button>
        {editingId ? (
          <button className="ghost-button compact" disabled={loading} type="button" onClick={resetManualForm}>
            <X size={16} />
            取消编辑
          </button>
        ) : null}
        {returnTo ? (
          <Link className="secondary-button compact" href={returnTo}>
            返回榜单核对匹配
          </Link>
        ) : null}
      </form>

      <section className="table-panel">
        <div className="panel-title">
          <h2>映射关系</h2>
          <span>{items.length} 条</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>小说名称</th>
                <th>短剧/漫剧名称</th>
                <th>关系类型</th>
                <th>来源</th>
                <th>更新时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="strong-cell">{item.novelName}</td>
                  <td>{item.dramaTitle}</td>
                  <td>{item.relationType}</td>
                  <td>{item.sourceRef}</td>
                  <td>{item.updatedAt}</td>
                  <td>
                    <div className="table-actions">
                      <button className="table-action" disabled={loading} type="button" onClick={() => editMapping(item)}>
                        <Pencil size={14} />
                        编辑
                      </button>
                      <button className="table-action danger" disabled={loading} type="button" onClick={() => deleteMapping(item)}>
                        <Trash2 size={14} />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    暂无小说映射。可以先导入模拟小说库，后续接入飞书表格同步。
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
