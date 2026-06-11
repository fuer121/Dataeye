import Link from "next/link";

export default function AppShell({ active, children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand">榜单匹配工作台</div>
          <p className="brand-subtitle">热门短剧与站内小说核对</p>
        </div>
        <nav className="nav">
          <Link className={active === "rankings" ? "active" : ""} href="/">
            热门榜单
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
