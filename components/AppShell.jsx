import Link from "next/link";

export default function AppShell({ active, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">剧查查榜单 MVP</div>
          <p className="brand-subtitle">每日榜单采集与小说库匹配</p>
        </div>
        <nav className="nav">
          <Link className={active === "rankings" ? "active" : ""} href="/">
            榜单数据
          </Link>
          <Link className={active === "novels" ? "active" : ""} href="/novels">
            小说库
          </Link>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
