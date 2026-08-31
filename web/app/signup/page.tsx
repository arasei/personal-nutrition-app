// web/app/signup/page.tsx

// 全体の概要
// - 新規登録ページ
// - Supabase Auth に新しいユーザーを登録するページ
// Supabase の管理画面でユーザーを手動作成するのではなく、/signup ページを作り、
// そこからユーザー登録するため





// 役割
// - 新規登録フォームを表示
// - メールアドレスを入力する
// - パスワードを入力する
// - supabase.auth.signUp() を呼ぶ
// - 登録成功したら本人確認メールの案内を表示
// - 本人確認完了後、ユーザーはログインページからログインする




// ポイント

// signup/page.tsx
// → メールアドレス・パスワードの管理
// → Supabase Auth へ新規登録を依頼
// → 成功・失敗メッセージを表示

// Button.tsx
// → ボタンの見た目を統一



// 新規登録する
// - Button
// - 認証処理を実行

// ログインはこちら
// - Link
// - 補助的な画面移動

// トップページへ戻る
// - Link
// - 補助的な画面移動





// 新規登録の流れ

// Next.js の signup/page.tsx
//   ↓
// Supabase client
//   ↓
// Supabase Auth
//   ↓
// auth.users にユーザー作成

// - ユーザーが、メールアドレス・パスワードを入力してボタンを押すと
// supabase.auth.signUp({
//   email,
//   password,
// });
// を実行
// これにより、SupabaseのAuth Usersにユーザーが作成される










// このファイル内の流れ

// ユーザー
// ↓
// /signup
// ↓
// メール・パスワード入力
// ↓
// 「新規登録する」を押す
// ↓
// supabase.auth.signUp()
// ↓
// Supabase Auth にユーザー作成し、登録
// ↓
// 登録成功
// ↓
// 成功メッセージを表示
// ↓
// 送信された本人確認メールにて認証を行う
// ↓
// ユーザーが「ログインページはこちら」を押す
// ↓
// /login に移動
// ↓
// ログイン
// ↓
// /mypage に移動



"use client";

// 入力されたメールアドレスやパスワードを画面の中で管理するためのuseState
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Button from "@/components/ui/Button";
import Link from "next/link";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Card from "@/components/ui/Card";
import SuccessMessage from "@/components/ui/SuccessMessage";
import LinkButton from "@/components/ui/LinkButton";

export default function SignupPage() {

  // メールアドレスの入力値を保存する場所
  const [email, setEmail] = useState("");
  // パスワードの入力値を保存する場所
  const [password, setPassword] = useState("");

  // 登録失敗した時のエラーメッセージを保存する場所
  const [errorMessage, setErrorMessage] = useState("");
  // 登録成功した時のメッセージを保存する場所
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // フォームが送信されたときに実行される関数
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    // フォーム送信時のページリロードを防ぐ
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // supabase.auth.signUp() が新規登録処理を行う
      // - Supabase Authに対して「このメールアドレスとパスワードで新規登録してください」と依頼
      const result = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      const error = result.error;

      if (error) {
        console.error("新規登録に失敗しました:", error);
        setErrorMessage(
          "新規登録に失敗しました。入力内容をご確認のうえ、再度お試しください。",
        );
        return;
      }

      // 登録成功メッセージ
      setSuccessMessage(
        "登録メールアドレス宛に本人確認メールをお送りいたしました。メール内のリンクからメールアドレスの確認をお願いいたします。"
      );
      // 登録成功後に入力欄を空にする
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("新規登録中に予期しないエラーが発生しました:", error);

      setErrorMessage(
        "新規登録中に予期しないエラーが発生しました。時間をおいて再度お試しください。"
      );
    } finally {
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
          新規登録
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          アカウントを作成して、栄養診断を利用できます。
        </p>
      </header>

      {/*
        入力フォーム
        - ひとまとまりの入力エリア
        メールアドレス・パスワード
        - 新規登録ボタンを押した時にフォームの内容を送信し、新規登録処理を動かす
      */}
      {/* 
      htmlFor と id を メールアドレスに追加することで
      label と input を "email" という名前で紐づけることができる

      「メールアドレス」という文字をクリック
      ↓
      メールアドレス入力欄にカーソルが入る
       */}
      <Card className="mt-8">
        <form
          onSubmit={handleSignup}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="example@example.com"
            />
          </div>


          {/*
          autoComplete="..."

          signup
          → new-password
          → 新しく作るパスワード

          login
          → current-password
          → 既に登録済みのパスワード
          */}
          <div className="space-y-2">
            <Label htmlFor="password">
              パスワード
            </Label>

            {/* 入力必須項目 */}
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="6文字以上で入力"
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

          {/* 成功表示 */}
          {/*
            successMessage が空 の場合
            - 何も表示しない

            successMessageが存在 する場合
            - successMessageを表示
            - StatusMessageのsuccess形式を使用
            - role="status" を付ける

          */}
          {successMessage && (
            <SuccessMessage>
              {successMessage}
            </SuccessMessage>
          )}

          {/* 新規登録ボタン */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "登録中..." : "新規登録する"}
          </Button>
        </form>
      </Card>

      {/* ログインページ(/login)への遷移リンク */}
      {/* 未登録の人がログイン画面から新規登録ページへ移動できるように */}
      {/* 「新規登録はこちら」は文章の一部なので、通常の Link を使用する */}
      <p className="mt-6 text-center text-sm text-muted">
        すでにアカウントをお持ちの方は{" "}
        <Link
          href="/login"
          className="whitespace-nowrap rounded-sm font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          ログインはこちら
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
