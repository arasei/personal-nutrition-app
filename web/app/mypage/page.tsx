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
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LinkButton from "@/components/ui/LinkButton";
import { PageLoading } from "@/components/ui/PageLoading";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function Mypage() {
  const router = useRouter();

  // ログイン状態を確認中かどうかを管理
  // - 最初はまだ確認前なので true とする
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // ログイン確認処理をを行う関数
    const checkLogin = async () => {
      try {
        // supabase から 現在のログイン session を取得
        const result = await supabase.auth.getSession();
        // 取得結果から現在のログイン session を取得
        const session = result.data.session;
        // session の中から access_token を取り出す
        // - 「?.」があるので、session token が無い場合でもエラーにならない
        const token = session?.access_token;

        // token が無い場合、未ログインと判断し、ログインページへ遷移する
        if (!token) {
          setErrorMessage("ログインが必要です");
          router.replace("/login");
          return;
        }
      // ログイン確認中に予期しないエラーが起きた場合の処理
      } catch (error) {
        console.error("failed to check login:", error);
        setErrorMessage("ログイン状態の確認に失敗しました");
      // 成功しても失敗しても、確認処理が終わったら読み込み中を解除する
      } finally {
        setIsCheckingLogin(false);
      }
    };

    checkLogin();
  }, [router]);

  // ログイン確認中のローディング表示
  // - ログイン確認中はマイページ本体を表示しない
  if (isCheckingLogin) {
    return (
      <PageLoading message="ログイン状態を確認中です..." />
    );
  }

  // ログイン確認失敗の場合のエラーメッセージ表示
  if (errorMessage) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      </main>
    );
  }

  // マイページ の 内容を表示する箱の幅 を ログイン・新規登録画面と同じ幅に制限する
  // - max-w-md: 最大幅 を 約448px に制限している
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-gray-500">
          栄養診断
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          マイページ
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          栄養診断を始めたり、これまでの診断結果を確認できます。
        </p>
      </header>

      {/* 診断カード */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          栄養診断
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          現在の生活習慣から、栄養素の傾向を確認できます。
        </p>

        {/* 診断開始ボタン */}
        <div className="mt-5">
          <StartButton />
        </div>
      </section>

      {/* 履歴カード */}
      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          診断履歴
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
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
      </section>
    </main>
  );
}