// web/app/layout.tsx

// 全体の概要
// - アプリ全体に共通するHTML構造・フォント・metadata・CSS を設定する最上位レイアウト
// - 各フロントページを包む大きな箱のイメージ
// - ほぼ全てのフロントページの土台


// Next.js が用意している Metadata という型を読み込む
// - Metadata に正しい形式の値かどうかを確認するため
import type { Metadata } from "next";
// Next.js のフォント機能を読み込む
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Geist というフォント
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Geist_Mono
// - プログラムコードを一定幅で表示するためのフォント
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// metadata
// - このwebアプリは何なのかを設定
// title
// - ブラウザタブでの表示名
export const metadata: Metadata = {
  title: "栄養素診断アプリ",
  description: "生活習慣や体調に関する質問から栄養素の不足傾向を確認し、食品や料理の提案を確認できるWebアプリです。",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="ja"
    // - webページ全体に「このページは日本語です」と名札をつける
    // geistSans.variable / geistMono.variable
    // - webページ全体に適応するフォントを定義している
    // {children}
    // - ログインページ・診断ページ・結果ページ・履歴ページ などが入る
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
