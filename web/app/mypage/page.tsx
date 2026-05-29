// web/app/mypage/page.tsx

// ログイン後の遷移先となるマイページ
// ログイン中ユーザーだけが表示できるように、Supabase session を確認する
// 未ログインの場合は /login に遷移する
// /mypage から診断開始と履歴一覧へ遷移できる

// このページの役割
// - ログイン状態を確認する
// - 未ログインなら /login に戻す
// - ログイン済みならマイページメニューを表示する
// - 診断開始ボタンを表示する
// - 履歴一覧へのリンクを表示する 


// 現在はログイン状態をブラウザ側で確認するため Client Component 仕様
// Supabase session を確認し、未ログインの場合は /login に遷移する
// StartButton.tsx も Client Component として診断開始処理を担当する



// 流れ
// /login
//   ↓
// ログイン成功
//   ↓
// router.push で /mypageへ遷移
//   ↓
// /mypage
//   ├─ 診断を始める → /diagnosis/start
//   └─ 履歴を見る   → /history







// web/app/mypage/page.tsx

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
  // 最初はまだ確認前なので true とする
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
        // 「?.」があるので、session token が無い場合でもエラーにならない
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
    return <p>ログイン状態を確認中です...</p>;
  }

  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  return (
    <main>
      <h1>マイページ</h1>

      <p>メニュー</p>

      <div>
        {/* 診断開始ボタン */}
        <StartButton />
      </div>

      <div>
        <Link href="/history">履歴を見る</Link>
      </div>
    </main>
  );
}