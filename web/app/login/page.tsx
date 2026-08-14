// web/app/login/page.tsx

// 全体の概要
// - ログインページ
// - ログイン画面で入力したメールアドレスとパスワードを受け取り、Supabaseで確認(認証)できれば、ログイン状態を作る、 成功時にホーム画面(/mypage)へ遷移するページ




// 役割
// - 画面にメールアドレス欄とパスワード欄を出す
// - 入力欄の値・エラーメッセージ・ロディング状態をuseStateで管理(入力した内容を一時的に保存する)
// - ログインボタンが押されたらhandleLoginでsupabase.auth.signInWithPassword()を実行する
// Supabaseにメールアドレスとパスワードを送って認証する(Supabaseに「この人は正しいユーザーですか？」と確認する)
// 成功なら画面遷移、失敗ならエラーメッセージを表示する






// ポイント
// - login/page.tsx は 入口
// - ログイン画面はClient Component
// - 認証の本体は supabase.auth.signInWithPassword で行う
// - ログイン画面の後に、API側で「ログイン済み本人か」を確認する(認証・認可の土台)
// - client.ts の supabase は、 ブラウザ側から Supabase Auth にアクセスするための共通窓口。
// ログイン画面では、 メール入力・パスワード入力し、 supabase.auth.signInWithPassword(...) で認証を行う流れ
// その後、ログイン状態を今後使うことで、 診断開始APIで userId を body から受け取らない セッションから user を取得する 他人の diagnosisId を使えないようにする
// - try / catch / finally によりログイン通信中、認証失敗とは別のエラーが起きた場合の処理を追加
// - requiredによる必須入力チェックを追加(空欄送信を防ぐ)



// useState
// - 入力値や表示状態をJavaScript側で持つためのもの
// - email に メールアドレスを保存・password にパスワードを保存して、入力するたびにstateを更新
// - ボタンを押したときにSupabaseへ渡すため

// onSubmit
// - フォーム送信時に処理を動かす
// - ボタンを押した時にSupabase Authへログイン要求を送る
//  ログイン画面は、見た目だけでは意味がなく、ボタン押下で認証処理を呼ぶところまでが本体のため

// preventDefault()
// - フォーム送信時、ページ再読み込み防止

// supabase.auth.signInWithPassword()
// - 認証の本体
// - Supabaseにログイン要求を送る

// if (error) return;
// - 失敗時時、ログインさせない
// - errorがあればエラーメッセージ表示・無ければ成功、マイページへ遷移

// router.push()
// - 成功後にページ移動する

// finally
// 最後に必ずやる処理

// required
// - 空欄送信防止

// disabled={isLoading}
// - ローディング状態を入れる
// - 二重送信防止



// login/page.tsx
// → ログイン処理・入力値・エラー表示を担当する

// Button.tsx
// → ボタンの共通デザインを担当する










// このファイル内の流れ

// /login にアクセス
//     ↓
// メールアドレス入力 パスワード入力
//     ↓
// requiredが空欄かチェック
//     ↓
// ログインボタンを押す
//     ↓
// handleLogin実行
//     ↓
// supabase.auth.signInWithPassword() の中でSupabase Auth に email / password 送信(認証)
//     ↓
// 成功 → 次のページ(/mypage)へ移動
// 失敗 → エラーメッセージ(errorMessage)表示
// 未登録 → 「新規登録はこちら」から /signup へ移動
// 例外 → catch で共通エラー表示
// 最後 → finally でisLoading をfalseに戻す




// login/page.tsx は Client Component
//          ↓
// client.ts から supabase を読む
//          ↓
// supabase.auth.signInWithPassword(...) を実行
//          ↓
// ログイン成功/失敗を分ける







"use client";

import { useState } from "react"; 
// クライアント側用のSupabaseインスタンスを読み込む
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

// ログインボタンを押した後実行する処理
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    // フォーム送信時のページ再読み込みされるのを防ぐ
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // signInWithPassword がログイン処理を行う
    // - Supabase Auth に「このメールアドレスとパスワードでログインできますか？」と確認(認証)

    // const error = result.error
    // - 返ってきたオブジェクトからerrorプロパティだけ取り出しerrorという変数に入れる
    try {
      const result = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      const error = result.error;
      
      if (error) {
        setErrorMessage("メールアドレスまたはパスワードが正しくありません。");
        return;
      }
      // ログイン成功後にページ遷移
      router.push("/mypage");
    } catch (error) {
      console.error("ログイン中にエラーが発生しました:", error);
      setErrorMessage("ログイン処理中にエラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      // ローディング状態を解除
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-gray-500">
          栄養診断
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          ログイン
        </h1>

        <p>
          アカウントにログインして、栄養診断を利用できます。
        </p>
      </header>

      {/*
        入力フォーム
        - ひとまとまりの入力エリア
        - ログインボタンを押した時にフォームの内容を送信し、ログイン処理を動かす
      */}
      <form
        onSubmit={handleLogin}
        className="mt-8 space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="email">
            メールアドレス
          </Label>

          {/* 入力必須項目 */}
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="example@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            パスワード
          </Label>

          {/* 入力必須項目 */}
          {/*
            autoComplete
            - signup
            → new-password
            → 新しく作るパスワード

            - login
            → current-password
            → 既に登録済みのパスワード
          */}
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="パスワードを入力"
          />
        </div>

        {/* error を受け取った場合だけ {errorMessage} を表示 */}
        {/*
          role="alert"
          - エラーであることを支援技術へ伝えやすくする
        */}
        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
            {errorMessage}
          </p>
        )}

        {/* ログインボタンを表示 */}
        {/* 
          disabled={isLoading}
          - isLoadingがtrueの時disabledを有効にする(二重送信防止)
          type="submit"
          - フォーム送信  
        */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "ログイン中..." : "ログインする"}
        </Button>
      </form>

      {/* /signup ページへの遷移リンクを追加 */}
      {/* 未登録の人がログイン画面から新規登録ページへ移動できるように */}
      <p className="mt-6 text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          className="font-medium text-gray-900 underline underline-offset-4"
        >
          新規登録はこちら
        </Link>
      </p>
    </main>
  );
}