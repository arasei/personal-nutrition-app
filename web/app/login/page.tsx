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



// ログインする
// - Button
// - 認証処理を実行

// 新規登録はこちら
// - Link
// - 補助的な画面移動

// トップページへ戻る
// - Link
// - 補助的な画面移動



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
import ErrorMessage from "@/components/ui/ErrorMessage";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";

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
        console.error("ログインに失敗しました:", error)
        // 登録したメールアドレスによる確認が未確認の場合のエラー表示

        // error.code
        // - `code` はプログラムが、何のエラーなのかを判断するための値
        if (error.code === "email_not_confirmed") {
          setErrorMessage(
            "メールアドレスの確認が完了していません。確認メールをご確認ください。",
          );
          return;
        }
        // 新規登録完了後、登録した内容と入力したメールアドレスまたはパスワードが不一致の場合のエラー表示
        setErrorMessage(
          "メールアドレスまたはパスワードが正しくありません。",
        );
        return;
      }
      // ログイン成功後にページ遷移
      router.push("/mypage");
    } catch (error) {
      console.error("ログイン中にエラーが発生しました:", error);
      setErrorMessage(
        "ログイン処理中にエラーが発生しました。時間をおいて再度お試しください。"
      );
    } finally {
      // ローディング状態を解除
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-muted">
          栄養診断
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          ログイン
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          アカウントにログインして、栄養診断を利用できます。
        </p>
      </header>

      {/*
        入力フォーム
        - ひとまとまりの入力エリア
        メールアドレス・パスワード
        - ログインボタンを押した時にフォームの内容を送信し、ログイン処理を動かす
      */}
      <Card className="mt-8">
        <form
          onSubmit={handleLogin}
          className="space-y-5"
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

          {/*
            エラー表示
            - error を受け取った場合だけ {errorMessage} を表示
          */}
          {errorMessage && (
            <ErrorMessage>
              {errorMessage}
            </ErrorMessage>
          )}

          {/* ログインボタン */}
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
      </Card>

      {/* 新規登録ページ(/signup)への遷移リンク */}
      {/* 未登録の人がログイン画面から新規登録ページへ移動できるように */}
      {/* 「新規登録はこちら」は文章の一部なので、通常の Link を使用する */}
      <p className="mt-6 text-center text-sm text-muted">
        アカウントをお持ちでない方は{" "}
        <Link
          href="/signup"
          className="whitespace-nowrap rounded-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          新規登録はこちら
        </Link>
      </p>

      {/* トップページ(/)への遷移リンク */}
      {/* 「トップページへ戻る」は単独で配置するページ移動のため、LinkButton を使用する */}
      <div className="mt-3 text-center">
        <LinkButton
          href="/"
          variant="text"
        >
          トップページへ戻る
        </LinkButton>
      </div>
    </main>
  );
}
