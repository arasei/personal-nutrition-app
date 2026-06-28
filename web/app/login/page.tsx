//  web/app/login/page.tsx

// ログインページ
//  ログイン画面で入力したメールアドレスとパスワードを受け取り、Supabaseで確認(認証)できれば、ログイン状態を作る、 成功時にホーム画面(/mypage)へ遷移するページ

//  このページで行っていること 
//  画面にメールアドレス欄とパスワード欄を出す
//  入力欄の値・エラーメッセージ・ロディング状態をuseStateで管理(入力した内容を一時的に保存する)
//  ログインボタンが押されたらhandleLoginでsupabase.auth.signInWithPassword()を実行する
//  Supabaseにメールアドレスとパスワードを送って認証する(Supabaseに「この人は正しいユーザーですか？」と確認する)
//  成功なら画面遷移、失敗ならエラーメッセージを表示する


//  login/page.tsx は 入口 認証の本体は supabase.auth.signInWithPassword()
//  client.ts の supabase は、 ブラウザ側から Supabase Auth にアクセスするための共通窓口。
//  そのログイン状態を今後使うことで、 診断開始APIで userId を body から受け取らない セッションから user を取得する 他人の diagnosisId を使えないようにする
//  つまり login/page.tsx は、 後の認証・認可の土台




//  こんな時に使うページ
//  未ログインユーザーが診断を始めたいとき
//  診断機能をログイン必須にしたい時
//  履歴ページを本人だけ見せたい時
//  保存済み診断データを回答保存APIで認証済みユーザーだけ許可して見せたいとき





//  流れ
//  /login にアクセス
//     ↓
//  メールアドレス入力 パスワード入力
//     ↓
// requiredが空欄かチェック
//     ↓
//  ログインボタンを押す
//     ↓
//  handleLogin実行
//     ↓
//  supabase.auth.signInWithPassword() の中でSupabase Auth に email / password 送信(認証)
//     ↓
//  成功 → 次のページ(/mypage)へ移動
//  失敗 → エラーメッセージ(errorMessage)表示
// 未登録 → 「新規登録はこちら」から /signup へ移動
//  例外 → catch で共通エラー表示
//  最後 → finally でisLoading をfalseに戻す


//  login/page.tsx は Client Component
//          ↓
//  client.ts から supabase を読む
//          ↓
//  supabase.auth.signInWithPassword(...) を実行
//          ↓
//  ログイン成功/失敗を分ける



//  ポイント
//  login/page.tsx は 入口
//  認証の本体は supabase.auth.signInWithPassword
//  本当に大事なのは、ログイン画面の後に、API側で「ログイン済み本人か」を確認すること
//  ログイン画面は認証導入の最初の一歩
//  client.ts の supabase は、 ブラウザ側から Supabase Auth にアクセスするための共通窓口。
//  だからログイン画面では、 メール入力 パスワード入力 supabase.auth.signInWithPassword(...)
//  という流れがつながる。
// try / catch / finally によりログイン通信中、認証失敗とは別のエラーが起きた場合の処理を追加
// requiredによる必須入力チェックを追加(空欄送信を防ぐ)


//  useStateは入力値や表示状態を持つためのもの
//  onSubmitはフォーム送信時に処理を動かす
//  preventDefault()はページ再読み込み防止
//  supabase.auth.signInWithPassword()が認証の本体
//  if (error) return; で失敗時の暴走を止める
//  router.push()で成功後にページ移動する
//  try = 普通の処理
//  catch = エラー時の処理
//  finally = 最後に必ずやる処理
//  required = 空欄送信防止
//  disabled={isLoading} = 二重送信防止






//  ログイン画面をClient Component にする


//  フォーム見た目を作る 


//  useState で入力値を管理する

//  目的
//  入力された文字をJavaScript側で持てるようにするため

//  何をしている？
//  emailにメールアドレスを保存 passwordにパスワードを保存 入力するたびにstateを更新

//  なぜ必要か？
//  ボタンを押したときにSupabaseへ渡すため



//  submit処理を追加する

//  目的
//  ボタンを押した時にSupabase Authへログイン要求を送るため

//  何をしている？
//  e.preventDefault() フォーム送信時のページ再読み込みを防ぐ
//  signInWithPassword(...) Supabaseにログイン要求を送る
//  errorがあれば失敗 無ければ成功

//  なぜ必要か？
//  ログイン画面は、見た目だけでは意味がなく、ボタン押下で認証処理を呼ぶところまでが本体だから



//  エラーメッセージ表示を追加する

//  目的
//  ログイン失敗時に、ユーザーが何が起きたかわかるようにするため

//  なぜここで必要か？
//  開発中はconsole.logでも確認できますが、実際の画面ではユーザーに見える形が必要なため



//  ログイン成功後の遷移を追加

//  目的
//  ログインできたあと、ユーザーを次の画面へ進ませるため

//  なぜ必要か？
//  ログイン成功してもその場に止まっていると「本当にログインできたのか」が分かりずらい



//  ローディング状態を入れる

//  目的
//  ログイン中の連打防止と処理中であることをわかりやすくするため
//  二重送信防止





"use client";

import { useState } from "react"; 
//クライアント側用のSupabaseインスタンスを読み込んでいる
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

// ログインボタンを押した後の処理
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    // フォーム送信時のページ再読み込みされるのを防ぐ
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    // signInWithPassword がログイン処理を行う
    // Supabase Auth に「このメールアドレスとパスワードでログインできますか？」と確認(認証)
    // 返ってきたオブジェクトからerrorプロパティだけ取り出しerrorという変数に入れる
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
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">
        ログイン
      </h1>

      {/* ログインボタンを押した時にログイン処理を動かす */}
      {/* 入力必須項目 */}
      <form onSubmit={handleLogin} className="space-y-4">

        {/* 入力必須項目 */}
        <div>
          <Label htmlFor="email">
            メールアドレス
          </Label>
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

        {/* 入力必須項目 */}

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
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="パスワードを入力"
          />
        </div>
        
        {/* errorMessageがある時だけ<p></p>を表示 */}
        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        {/* ログインボタンを表示 */}
        {/* disabled={isLoading} = isLoadingがtrueの時disabledを有効にする(二重送信防止) */}
        {/* type="submit" = フォーム送信  */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isLoading ? "ログイン中..." : "ログインする"}
        </button>
      </form>

      {/* /signup ページへの動線リンクを追加 */}
      {/* 未登録の人がログイン画面から新規登録ページへ移動できるように */}
      <p className="mt-4 text-sm">
          アカウントをお持ちでない方は{" "}
          <Link href="/signup" className="underline">
            新規登録はこちら
          </Link>
        </p>
    </main>
  );
}