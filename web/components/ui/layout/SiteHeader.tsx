// web/components/ui/layout/SiteHeader.tsx

// 全体の概要
// - ページ上部に表示する共通ヘッダー

// 役割
// - ロゴ
// - 診断開始
// - このアプリの使い方
// - ログイン
// - 新規登録


// ポイント
// - PC では現在のヘッダーを表示する
// - モバイルでは ログイン と ハンバーガーメニュー を表示する
// - ハンバーガーメニューから 診断開始、使い方、新規登録へ移動できる


"use client";


import { useEffect, useRef, useState } from "react";
import Link from "next/link";
// Leaf
// - 葉アイコン
// Menu
// - 3本線のハンバーガーアイコン
// X
// - メニューを閉じるアイコン
import { Leaf, Menu, X } from "lucide-react";
import LinkButton from "@/components/ui/LinkButton";




// キーボード操作フォーカス共通クラス
// - キーボード操作(Tabキーでフォーカスが当たっている)をしている時に表示するフォーカスリングのためのクラス
// - マウスでクリックした場合 → フォーカスリングを表示しない
// - Tabキーで移動してフォーカスが当たった場合 → フォーカスリングを表示する

// focus-visible
// - 主にキーボード操作でフォーカスが当たった場合にのみ、フォーカスリングを表示するための擬似クラス
const headerFocusClassName = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"



// モバイルメニューの項目の通常リンク共通クラス

// inline-flex
// - 文字の位置や高さを揃えやすくする
// min-h-11
// - 最低44pxの高さにする
// w-full
// - メニューの横幅いっぱいに広げる
// items-center
// - 文字を縦方向の中央に配置する
// rounded-md
// - 角丸を統一する
// px-3
// 左右に余白をつける
// text-sm
// - 文字サイズを統一する
// font-semibold
// - メニューとして読みやすい大きさにする
const mobileMenuLinkClassName = [
  "inline-flex min-h-11 w-full items-center rounded-md px-3 text-sm font-semibold",
  // 通常時の文字色を共通の本文色にする
  // 色が変わる時の動きを自然にする
  "text-foreground transition-colors",
  // マウスを乗せた時、薄いエメラルド背景・文字色をエメラルド系にする。
  "hover:bg-primary-light hover:text-primary-hover",
  // tab操作時のフォーカスリングを表示は、キーボード操作フォーカス共通クラスを使用する
  headerFocusClassName,
].join(" ");



export default function SiteHeader() {

  // モバイルメニューが開いているかを管理
  // - 最初は閉じている(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // モバイルメニューの開閉を管理
  // - Escキーでメニューを閉じた後に、ハンバーガーボタンへフォーカスを戻すためのもの
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // メニューを閉じる共通関数
  // - メニュー欄にある複数あるリンクを選択し、遷移後にメニュー欄が開いたままの状態を防ぐため
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Escキー処理
  // - Escキー押すことでメニューを閉じる処理
  // - メニューが開いている場合、Escキーで閉じることを可能にするため
  useEffect(() => {

    // メニューが閉じている場合、Esc処理を行わない
    if (!isMenuOpen) {
      return;
    }

    // Escキーを押した場合以下の処理を行う
    // - メニューを閉じる
    // - ハンバーガーボタンへフォーカスを戻す
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    // ブラウザ上でEscキーが押されたことを監視
    window.addEventListener("keydown", handleKeyDown);

    // メニューを閉じた後、クリーンアップを行う
    // - Escキーでメニューを閉じる処理を完了後、Escキー監視を削除
    // - 削除しないと、メニューを開くたびに監視処理が重複する可能性があるため
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);



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
    // hidden md:flex / md:hidden
    // md以上では中央ナビゲーションとログイン・新規登録を表示する
    // - md未満ではログインとメニューボタンを表示する
    // - 新規登録は開閉メニュー内に表示する
    // aria-label
    // - スクリーンリーダーへリンクの目的を伝える
    // aria-hidden="true"
    // - 葉アイコンの横にアプリ名があるため、アイコンだけを二重に読み上げないようにする

    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="栄養診断アプリのトップページへ"
          onClick={closeMenu}
          className={`rounded-md flex items-center gap-2 text-foreground transition-opacity hover:opacity-75 ${headerFocusClassName}`}
        >
          <span className="grid size-7 place-items-center rounded-md bg-primary text-white shadow-sm">
            <Leaf aria-hidden="true" className="size-4" />
          </span>

          <span className="text-sm font-bold tracking-wide">
            栄養診断アプリ
          </span>
        </Link>

        {/* PC用の 中央ナビゲーション表示 */}
        {/*
          md未満 → hidden(非表示)
          md以上 → flex(表示)
        */}
        <nav
          aria-label="メインナビゲーション"
          className="hidden items-center gap-2 md:flex"
        >
          <Link
            href="/diagnosis/start"
            className={`rounded-md px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
          >
            診断を始める
          </Link>

          <Link
            href="/#what-you-can-do"
            className={`rounded-md bg-primary-light px-3 py-2 text-sm font-semibold text-primary-hover ${headerFocusClassName}`}
          >
            使い方
          </Link>
        </nav>

        {/* PC用の ログイン・新規登録 表示 */}
        {/*
          md未満 → hidden(非表示)
          md以上 → flex(表示)
        */}
        <div className="hidden flex items-center gap-2 md:flex">
          <Link
            href="/login"
            className={`rounded-md inline-flex min-h-10 items-center px-2 text-sm font-semibold text-muted transition-colors hover:text-primary-hover ${headerFocusClassName}`}
          >
            ログイン
          </Link>

          <LinkButton href="/signup">
            新規登録
          </LinkButton>
        </div>





        {/* モバイル用の ログイン・メニューボタン 表示*/}
        {/*
          md未満 → flex(表示)
          md以上 → hidden(非表示)
        */}
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/login"
            onClick={closeMenu}
            className={`inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-foreground transition-colors hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
          >
            ログイン
          </Link>

          {/* ハンバーガーメニューボタン */}
          {/*
            メニューボタンを type="button" と指定する
            - このボタンはフォーム内で フォーム・データ送信を行わないボタン として扱うため

            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            - 表示状態によって読み上げ内容を変える

            aria-expanded={isMenuOpen}
            - 支援技術にスクリーンリーダーなどに現在のメニューボタンの開閉状態を伝える

            aria-controls="mobile-navigation"
            - メニューボタン の領域に名前をつける
            - メニュー側で id="mobile-navigation" とすることで メニューボタン と関連づけるため

            onClick={() => {
              setIsMenuOpen((current) => !current);
            }}
            - !current は現在の状態(開閉状態)を反対にする
            - 同じボタンで メニューボタンを 開く・閉じるの両方の処理を行うことができる。
          */}
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => {
              setIsMenuOpen((current) => !current);
            }}
            className={`inline-flex size-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-primary-light hover:text-primary-hover md:hidden ${headerFocusClassName}`}
          >
            {/*
              aria-label={...} で指定した isMenuOpen の状態によってアイコンを切り替える
              - メニュー開いている状態 → "X"
              - メニュー閉じている状態 → "☰"
            */}
            {isMenuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {/* モバイル用の開閉モバイルメニュー */}
      {/*
        メニューの表示・非表示について

        isMenuOpen = false・!isMenuOpen = true の場合
        - hidden になり、メニュー非表示
        isMenuOpen = true・!isMenuOpen = false の場合
        - メニュー表示


        hidden={!isMenuOpen}
        - isMenuOpen が存在しない場合(PCの表示の場合)、メニューを表示しない

        md:hidden
        - PCではメニューを非表示、モバイル(320px)のみメニュー表示
        - isMenuOpen が true のままの状態でも、PC画面で重ねて表示しない。
      */}
      <nav
        id="mobile-navigation"
        aria-label="モバイルナビゲーション"
        hidden={!isMenuOpen}
        className="border-t border-border bg-surface px-4 py-4 md:hidden"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          {/* 診断開始ページへの遷移リンク */}
          <Link
            href="/diagnosis/start"
            onClick={closeMenu}
            className={mobileMenuLinkClassName}
          >
            診断を始める
          </Link>

          {/* 使い方ページへの遷移リンク */}
          <Link
            href="/#what-you-can-do"
            onClick={closeMenu}
            className={mobileMenuLinkClassName}
          >
            使い方
          </Link>

          {/* 新規登録ページへの遷移ボタン */}
          {/*
            共通のLinkButtonのPrimaryスタイル を使用し、モバイルメニュー内でも新規登録ボタンを目立たせる
            高さを min-h-11 にすることで、メニュー内のリンクとボタンの高さを揃える
          */}
          <LinkButton
            href="/signup"
            onClick={closeMenu}
            className="mt-1 min-h-11 w-full"
          >
            新規登録
          </LinkButton>
        </div>
      </nav>
    </header>
  );
}
