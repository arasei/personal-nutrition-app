// web/components/ui/layout/SiteHeader.tsx

// 全体の概要
// - ページ上部に表示する共通ヘッダー

// 役割
// - ロゴ
// - 診断開始
// - このアプリの使い方
// - ログイン
// - 新規登録

import Link from "next/link";
import { Leaf } from "lucide-react";
import LinkButton from "@/components/ui/LinkButton";




export default function SiteHeader() {
  return (

    // sticky top-0
    // - スクロールしてもヘッダーを画面上部に残す
    // z-30
    // - カードなどの後ろにヘッダーが隠れないようにする
    // bg-surface/95 backdrop-blur
    // - 少し透けた白い背景とぼかし設定をする
    // hidden md:flex
    // - PC では中央ナビゲーションを表示する
    // - 320px では中央ナビゲーションを非表示にして、横幅不足による崩れを防ぐ
    // hidden sm:inline-flex
    // - 320px では「ログイン」を隠す
    // - 新規登録は残す
    // - ログインは現在のトップページ内の「ログインして続ける」からも移動できる
    // aria-label
    // - スクリーンリーダーへリンクの目的を伝える
    // aria-hidden="true"
    // - 葉アイコンの横にアプリ名があるため、アイコンだけを二重に読み上げないようにする
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="栄養診断アプリのトップページへ"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-75"
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary text-white shadow-sm">
            <Leaf aria-hidden="true" className="size-4" />
          </span>

          <span className="text-sm font-bold tracking-wide">
            栄養診断アプリ
          </span>
        </Link>

        <nav
          aria-label="メインナビゲーション"
          className="hidden items-center gap-2 md:flex"
        >
          <Link
            href="/diagnosis/start"
            className="rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-primary-light hover:text-primary-hover"
          >
            診断を始める
          </Link>

          <Link
            href="/#what-you-can-do"
            className="rounded-md bg-primary-light px-3 py-2 text-sm font-semibold text-primary-hover"
          >
            使い方
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-10 items-center px-2 text-sm font-semibold text-muted hover:text-primary-hover sm:inline-flex"
          >
            ログイン
          </Link>

          <LinkButton href="/signup">
            新規登録
          </LinkButton>
        </div>
      </div>
    </header>
  );
}