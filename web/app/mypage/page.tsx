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
//   ├─ 診断を始める → /diagnosis/start
//   └─ 履歴を見る   → /history








"use client";

// Next.jsのページ遷移リンクを読み込み
import Link from "next/link";
import StartButton from "@/app/diagnosis/start/StartButton";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  // ログイン確認中はマイページ本体を表示しない
  if (isCheckingLogin) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <p>ログイン状態を確認中です...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <p>{errorMessage}</p>
      </main>
    );
  }

  // マイページ の 内容を表示する箱の幅 を ログイン・新規登録画面と同じ幅に制限する
  // - max-w-md: 最大幅 を 約448px に制限している
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="text-2xl font-bold">
        マイページ
      </h1>

      <p className="mt-2 text-sm">
        メニュー
      </p>

      <div className="mt-6 space-y-3">
        {/* 診断開始ボタン */}
        <StartButton />

        {/* 履歴一覧ページ(`web/app/history/page.tsx`) へ 遷移するためのリンク<Link>...</Link> */}
        <Link href="/history" className="block text-sm underline">
          履歴を見る
        </Link>
      </div>
    </main>
  );
}