// web/app/mypage/page.tsx

// 全体の概要
// - ログイン後の遷移先となるマイページ
// - 「診断を始める」・「履歴を見る」 のボタン と リンク から 診断開始ページ(`web/app/diagnosis/start/page.tsx`) or 履歴一覧ページ(`web/app/history/page.tsx`) へ遷移可能 なページ



// ポイント
// - ログイン中ユーザーだけが表示できるように、Supabase session を確認する
// - 未ログインの場合は /login に遷移する
// - /mypage から診断開始と履歴一覧へ遷移できる



// このページの役割
// - ログイン状態を確認する
// - 未ログインなら /login に戻す
// - ログイン済みならマイページメニューを表示する
// - 診断開始ボタンを表示する
// - 履歴一覧へのリンクを表示する 




// このファイル内の流れ
// /login
//   ↓
// ログイン成功
//   ↓
// router.push で /mypageへ遷移
//   ↓
// /mypage
//   ↓
// Supabase から現在の session を取得
//   ↓
// session から access_token を確認
//   ↓
// token が無い場合 → /login に遷移
//   ↓
// token がある場合 → マイページを表示
//   ↓
// 診断開始ボタン・履歴リンクを表示
//   ├─ 診断を始める → 診断開始API(/diagnosis/start) → 質問ページ(/diagnosis/step/1)
//   └─ 履歴を見る   → /history








"use client";

import StartButton from "@/app/diagnosis/start/StartButton";
import { useRouter } from "next/navigation";
import LinkButton from "@/components/ui/LinkButton";
import { PageLoading } from "@/components/ui/PageLoading";
import Card from "@/components/ui/Card";
import { useSupabaseSession } from "../_hooks/useSupabaseSession";
import { useEffect } from "react";

export default function Mypage() {
  const router = useRouter();

  // ログイン状態をuseSupabaseSession から取得
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();


  // 認証確認が終わり、利用できるトークンがない場合は、ログインページ(/login)へ遷移する
  useEffect(() => {
    if (isSessionLoading) {
      return;
    }

    if (!token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);

  // 初回のログイン確認中のローディング表示
  // - session 確認中はマイページ本体を表示しない
  if (isSessionLoading) {
    return <PageLoading />;
  }

  // ページ遷移が完了するまでの間も、本文を表示しない
  if (!token) {
    return <PageLoading />;
  }

  // マイページ の 内容を表示する箱の幅 を ログイン・新規登録画面と同じ幅に制限する
  // - max-w-md: 最大幅 を 約448px に制限している
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-muted">
          Nutriflecta
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          マイページ
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          栄養診断を始めたり、これまでの診断結果を確認できます。
        </p>
      </header>

      {/* 診断開始ページへ案内カード */}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            栄養診断
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            現在の生活習慣から、栄養素の傾向を確認できます。
          </p>

          {/* 診断開始ボタン */}
          <div className="mt-5">
            <StartButton />
          </div>
        </Card>
      </section>

      {/* 履歴ページへ案内カード */}
      <section className="mt-4">
        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            診断履歴
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            過去の診断結果や、前回からの変化を確認できます。
          </p>

          {/* 履歴一覧ページ(`web/app/history/page.tsx`) へ 遷移するためのリンク<LinkButton>...</LinkButton> */}
          <div className="mt-5">
            <LinkButton
              href="/history"
              variant="secondary"
              className="w-full"
            >
              履歴を見る
            </LinkButton>
          </div>
        </Card>
      </section>
    </main>
  );
}