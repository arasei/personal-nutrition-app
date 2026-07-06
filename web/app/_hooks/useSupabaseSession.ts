// web/app/_hooks/useSupabaseSession.ts

// Supabase のログイン情報を確認し、ログイン中なら session と token を他のコンポーネントで使えるようにするカスタムフック




// 役割
// ログイン確認係(Supabase に認証情報を確認している)
// このフック自体はDBには触らない
// ログイン中か確認し、ログイン中なら session を保存
// API に送る token を取り出す
// 確認中かどうかの状態を isLoading で返す 

// それぞれのページで
// supabase.auth.getSession() を書く代わりに、共通の部品として使うためのもの
// page.tsx などで毎回ログイン確認の処理を書かないため

// 例.
// 結果ページで以下のように使える
// const { token, isLoading} = useSupabaseSession();

// これで、
// 今ログイン確認中か・ログインしているか・APIに送るtokenがあるか
// を取り出せる


// 流れ

// ページを開く
//   ↓
// useSupabaseSession が呼ばれる
//   ↓
// session は最初 undefined
//   ↓
// isLoading は true
//   ↓
// useEffect が動く
//   ↓
// supabase.auth.getSession() を実行
//   ↓
// ログインしていれば session が返る
//   ↓
// session を保存
//   ↓
// session.access_token を token に保存
//   ↓
// isLoading が false になる
//   ↓
// ページ側で token を使ってAPIを呼べる


// Supabase をブラウザ側で使うための設定ファイルを読み込む
import { supabase } from "@/lib/supabase/client";
// Supabase が用意している Session という型を読み込む
// Session は、ログイン中ユーザーの情報をまとめた型
import type { Session } from "@supabase/supabase-js";
// 現在のURLパスを取得するための Next.js のフック
// ページ移動した時にログイン状態を再確認するために必要
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const useSupabaseSession = () => {
  // session に 3つの状態を持たせる
  // undefined: ログイン状態をSupabaseに確認中
  // null: 確認した結果、未ログイン
  // Session: 確認した結果、ログイン済み
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  // token: API に送るためのログイン証明書のようなもの
  // ログイン中なら Supabase の access_token 文字列
  // 未ログインなら null
  const [token, setToken] = useState<string | null>(null);

  // 現在のURLパスを取得
  // 例.
  // /login ・ /mypage ・ /diagnosis/xxx/result など
  const pathname = usePathname();

  // 画面表示後に実行する処理(ログイン状態を確認する処理)
  useEffect(() => {
    const fetcher = async () => {
      // Supabase に対して、「今ログイン中の session はありますか？」 と確認している
      // ログインしていれば session が返る
      // ログインしていなければ session は null になる
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Supabase側でエラーの場合
      if (error) {
        setSession(null);
        setToken(null);
        return;
      }

      // session が存在し、取得できた場合、session(ログイン情報)を state に保存
      setSession(session);
      // session があれば session の中から access_token(ログイン中ユーザーの証明) を取り出し state に保存
      setToken(session?.access_token ?? null);
    };

    fetcher();
  // pathname が変わる度にログイン状態を確認する処理を実行する
  }, [pathname]);

  // このカスタムフックを使う側に以下を返す

  // session: ログイン状態

  // isLoading: 
  // ログイン状態を確認中かどうか
  // 最初は session が undefined なので、「isLoading: true」になる
  // Supabase から結果が返ってくると、session が null または Session になるので、「isLoading: false」になる

  // token: API に送るための token
  return {
    session,
    isLoading: session === undefined,
    token,
  };
};