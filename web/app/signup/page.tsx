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
// - 成功したらログインページへ遷移する




// ポイント

// signup/page.tsx
// → メールアドレス・パスワードの管理
// → Supabase Auth へ新規登録を依頼
// → 成功・失敗メッセージを表示

// Button.tsx
// → ボタンの見た目を統一





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
// ユーザーが「ログインページへ移動する」を押す
// ↓
// /login に移動
// ↓
// ログイン
// ↓
// /mypage に移動



"use client";

// 入力されたメールアドレスやパスワードを画面の中で管理するためのuseState
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Button from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();

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
        setErrorMessage(error.message);
        return;
      }

      // 登録成功メッセージ
      setSuccessMessage("新規登録が完了しました。ログインページからログインしてください。");
      // 登録成功後に入力欄を空にする
      setEmail("");
      setPassword("");
    } catch {
      setErrorMessage("新規登録中に予期しないエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">
        新規登録
      </h1>

      {/* 
      htmlFor と id を メールアドレスに追加することで
      label と input を "email" という名前で紐づけることができる

      「メールアドレス」という文字をクリック
      ↓
      メールアドレス入力欄にカーソルが入る
       */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <Label htmlFor="email">
            メールアドレス
          </Label>
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
        autoComplete : 
        signup
        → new-password
        → 新しく作るパスワード

        login
        → current-password
        → 既に登録済みのパスワード
        */}
        <div>
          <Label htmlFor="password">
            パスワード
          </Label>
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

        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "登録中..." : "新規登録する"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => router.push("/login")}
        className="mt-4 text-sm underline"
      >
        ログインページへ移動する
      </button>
    </main>
  );
}