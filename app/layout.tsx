import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 試穿成交輔助 Demo",
  description: "一個服飾電商用的 AI 試穿成交輔助 MVP"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
