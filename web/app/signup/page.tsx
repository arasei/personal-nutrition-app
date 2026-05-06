// web/app/signup/page.tsx

// 新規登録ページ
// Supabase Auth に新しいユーザーを登録するページ

// Supabase の管理画面でユーザーを手動作成するのではなく、
// 自分のアプリの中に /signup ページを作り、
// そこからユーザー登録するためのページ

// ユーザーが
// メールアドレス・パスワードを入力してボタンを押すと
// supabase.auth.signUp({
//   email,
//   password,
// });
// を実行
// これにより、SupabaseのAuth Usersにユーザーが作成される


// 新規登録の流れ
// Next.js の signup/page.tsx
//   ↓
// Supabase client
//   ↓
// Supabase Auth
//   ↓
// auth.users にユーザー作成





// 役割
// 新規登録フォームを表示
// メールアドレスを入力する
// パスワードを入力する
// supabase.auth.signUp() を呼ぶ
// 成功したらログインページへ遷移する



// 流れ

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

export default function SignupPage() {
  const router = useRouter();

  // メールアドレスの入力値を保存する場所
  const [email, setEmail] = useState("");
  // パスワードの入力値を保存する場所
  const [password, setPassword] = useState("");

  // 登録失敗した時のエラーメッセージを保存する場所
  const [errorMessage, setErrorMessage] = useState("");
  // 登録成功した時のメッセージを保存する場所
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false);

  // フォームが送信されたときに実行される関数
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    // フォーム送信時のページリロードを防ぐ
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("")
    setIsLoading(true);

    try {
      // supabase.auth.signUp() が新規登録処理を行う
      // Supabase Authに対して「このメールアドレスとパスワードで新規登録してください」と依頼
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

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            メールアドレス
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2"
            placeholder="example@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded border px-3 py-2"
            placeholder="6文字以上で入力"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isLoading ? "登録中..." : "新規登録する"}
        </button>
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