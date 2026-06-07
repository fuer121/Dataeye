import "./globals.css";

export const metadata = {
  title: "短剧/漫剧榜单后台",
  description: "每日采集、匹配和展示短剧/漫剧榜单数据的 MVP 后台"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
