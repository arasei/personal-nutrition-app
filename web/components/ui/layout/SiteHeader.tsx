// web/components/ui/layout/SiteHeader.tsx

// 全体の概要
// - ページ上部に表示する共通ヘッダーコンポーネント
// - variant の値によって、トップページ・ログインページ・新規登録ページ・会員ページ・診断ページに適したヘッダー表示へ切り替える共通コンポーネント

// 役割
// - ロゴ
// - 診断開始
// - このアプリの使い方
// - ログイン
// - 新規登録


// ポイント
// - SiteHeader は 一つの共通ヘッダーの中に複数の表示パターンを持つ状態
// 渡される variant によって表示を変える
// - PC では現在のヘッダーを表示する
// - モバイルでは ログイン と ハンバーガーメニュー を表示する
// - ハンバーガーメニューから 診断開始、使い方、新規登録へ移動できる



// このファイル内の流れ
// SiteHeader
//    │
//    ├─ public
//    │    └─ 診断を始める・使い方・ログインリンク・新規登録リンク
//    │
//    ├─ login
//    │    └─ 新規登録への案内
//    │
//    ├─ signup
//    │    └─ ログインへの案内
//    │
//    ├─ member
//    │    └─ 診断・履歴・マイページ
//    │
//    └─ diagnosis
//         └─ 診断へ集中するためロゴ中心





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


// ページごとにヘッダーの表示パターンを変えるための使用可能な variant の型を定義
// - public
// トップページ 専用のヘッダー
// - login
// ログインページ 専用のヘッダー
// - signup
// 新規登録ページ 専用のヘッダー
// - member
// マイページ・履歴一覧・履歴詳細・診断結果ページ 専用のヘッダー
// - diagnosis
// 診断開始ページ・診断質問ページ など回答に集中する画面 専用のヘッダー
export type SiteHeaderVariant = | "public" | "login"| "signup" | "member"| "diagnosis";

// SiteHeader が受け取る props の型を定義
type SiteHeaderProps = {
  variant?: SiteHeaderVariant;
};




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



export default function SiteHeader({
  // variant が渡されなかった場合は public を使用すると指定している
  variant = "public",
}: SiteHeaderProps) {


  // 渡された variant に応じて、ヘッダーの表示パターンを切り替えるための変数を定義
  // - diagnosis は特別なリンクを表示しない設計なので現在は専用の判定変数 は作成していない
  const isPublicHeader = variant === "public";
  const isLoginHeader = variant === "login";
  const isSignupHeader = variant === "signup";
  const isMemberHeader = variant === "member";
  const hasMobileMenu = isPublicHeader || isMemberHeader;

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

    // メニューが閉じている場合・ハンバーガーメニューを使用しないvariantの場合、Esc処理を行わない
    // - ハンバーガーメニューを使用しない ログインページ や 新規登録ページ では、Escキー処理が動くのを防ぐため
    if (!hasMobileMenu || !isMenuOpen) {
      return;
    }

    // Escキー以外は何もしない
    // Escキーを押した場合以下の処理を行う
    // - メニューを閉じる
    // - ハンバーガーボタンへフォーカスを戻す
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    // ブラウザ上でEscキーが押されたことを監視
    document.addEventListener("keydown", handleKeyDown);

    // メニューを閉じた後、クリーンアップを行う
    // - Escキーでメニューを閉じる処理を完了後、Escキー監視を削除
    // - 削除しないと、メニューを開くたびに監視処理が重複する可能性があるため
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMobileMenu, isMenuOpen]);



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

          variant に応じて、表示するリンクを切り替える
          isPublicHeader → トップページのヘッダー
          variant が public の場合
          - 診断を始める
          - 使い方

          isMemberHeader → 会員ページのヘッダー
          variant が member の場合
          - 診断を始める
          - 診断履歴

          variant が login・signup・diagnosis の場合は、中央ナビゲーションを表示しない
        */}
        {(isPublicHeader || isMemberHeader) && (
          <nav
            aria-label={isPublicHeader ? "トップページ内ナビゲーション" : "会員ページナビゲーション"}
            className="hidden items-center gap-2 md:flex"
          >
            <Link
              href="/diagnosis/start"
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-muted transition hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
            >
              診断を始める
            </Link>

            {isPublicHeader ? (
              <Link
                href="/#what-you-can-do"
                className={`rounded-lg bg-primary-light px-4 py-2 text-sm font-semibold text-primary-hover transition hover:bg-emerald-100 ${headerFocusClassName}`}
              >
                使い方
              </Link>
            ) : (
              <Link
                href="/history"
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-muted transition hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
              >
                診断履歴
              </Link>
            )}
          </nav>
        )}





        {/* PC用の ログイン・新規登録 表示 */}
        {/*
          md未満 → hidden(非表示)
          md以上 → flex(表示)
        */}
        <div className="hidden items-center gap-2 md:flex">
          {/*
            isPublicHeader → トップページのヘッダー
            variant が public の場合、以下を表示
            - ログイン
            - 新規登録
          */}
          {isPublicHeader && (
            <>
              <Link
                href="/login"
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-muted transition hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
              >
                ログイン
              </Link>

              <LinkButton
                href="/signup"
                className="w-auto px-5"
              >
                新規登録
              </LinkButton>
            </>
          )}

          {/*
            isLoginHeader → ログインページのヘッダー
            variant が login の場合、以下を表示
            - 新規登録
          */}
          {isLoginHeader && (
            <LinkButton
              href="/signup"
              className="w-auto px-5"
            >
              新規登録
            </LinkButton>
          )}

          {/*
            isSignupHeader → 新規登録ページのヘッダー
            variant が signup の場合、以下を表示
            - ログイン
          */}
          {isSignupHeader && (
            <Link
              href="/login"
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-light ${headerFocusClassName}`}
            >
              ログイン
            </Link>
          )}

          {/*
            isMemberHeader → 会員ページのヘッダー
            variant が member の場合、以下を表示
            - マイページ
          */}
          {isMemberHeader && (
            <Link
              href="/mypage"
              className={`rounded-lg bg-primary-light px-4 py-2 text-sm font-semibold text-primary-hover transition hover:bg-emerald-100 ${headerFocusClassName}`}
            >
              マイページ
            </Link>
          )}
        </div>








        {/* モバイル用の ログイン・メニューボタン 表示*/}
        {/*
          md未満 → flex(表示)
          md以上 → hidden(非表示)
        */}
        <div className="flex items-center gap-1 md:hidden">
          {/*
            isPublicHeader → トップページのヘッダー
            variant が public の場合、以下を表示
            - ログイン
          */}
          {isPublicHeader && (
            <Link
              href="/login"
              onClick={closeMenu}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
            >
              ログイン
            </Link>
          )}

          {/*
            isLoginHeader → ログインページのヘッダー
            variant が login の場合、以下を表示
            - 新規登録
          */}
          {isLoginHeader && (
            <Link
              href="/signup"
              className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
            >
              新規登録
            </Link>
          )}

          {/*
            isSignupHeader → 新規登録ページのヘッダー
            variant が signup の場合、以下を表示
            - ログイン
          */}
          {isSignupHeader && (
            <Link
              href="/login"
              className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
            >
              ログイン
            </Link>
          )}

          {/*
            isMemberHeader → 会員ページのヘッダー
            variant が member の場合、以下を表示
            - マイページ
          */}
          {isMemberHeader && (
            <Link
              href="/mypage"
              onClick={closeMenu}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light hover:text-primary-hover ${headerFocusClassName}`}
            >
              マイページ
            </Link>
          )}


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

          {/*
            hasMobileMenu → 会員ページ・トップページ の共通ヘッダー
            `const hasMobileMenu = isPublicHeader || isMemberHeader;` の条件を適応する
          */}
          {hasMobileMenu && (
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={isMenuOpen ? "ナビゲーションメニューを閉じる" : "ナビゲーションメニューを開く"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setIsMenuOpen((current) => !current)}
              className={`inline-flex size-11 items-center justify-center rounded-lg text-primary transition hover:bg-primary-light ${headerFocusClassName}`}
            >
              {/*
                aria-label={...} で指定した isMenuOpen の状態によってアイコンを切り替える
                - ナビゲーションメニュー開いている状態 → "X"
                - ナビゲーションメニュー閉じている状態 → "☰"
              */}
              {isMenuOpen ? (
                <X aria-hidden="true" className="size-5" strokeWidth={2} />
              ) : (
                <Menu aria-hidden="true" className="size-5" strokeWidth={2} />
              )}
            </button>
          )}
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
        - isMenuOpen が false の場合(メニューが閉じている)、メニューを表示しない

        md:hidden
        - md以上の画面幅では、開閉状態に関わらずメニューを非表示にする
        モバイル(320px)の場合、メニュー表示
        - isMenuOpen が true のままの状態でも、PC画面で重ねて表示しない。
      */}

      {/*
        hasMobileMenu → 会員ページ・トップページ の共通ヘッダー
        `const hasMobileMenu = isPublicHeader || isMemberHeader;` の条件を適応する
      */}
      {hasMobileMenu && (
        <nav
          id="mobile-navigation"
          aria-label={isPublicHeader ? "モバイルナビゲーション" : "会員向けモバイルナビゲーション"}
          hidden={!isMenuOpen}
          className="border-t border-border bg-surface px-4 py-4 md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            {/* 診断開始ページへの遷移リンク */}
            {/*
            isPublicHeader → トップページのヘッダー
            variant が public の場合、以下を表示
            - 診断を始める
            - 使い方
            - 新規登録
          */}
            {isPublicHeader ? (
              <>
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
              </>
            ) : (
              <>
                <Link
                  href="/diagnosis/start"
                  onClick={closeMenu}
                  className={mobileMenuLinkClassName}
                >
                  診断を始める
                </Link>

                <Link
                  href="/history"
                  onClick={closeMenu}
                  className={mobileMenuLinkClassName}
                >
                  診断履歴
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
