// web/app/_hooks/useSupabaseSession.ts


// 全体の概要
// - Supabase のログイン情報を確認し、ログイン中なら session と token を他のコンポーネントで使えるようにするカスタムフック
// - フロント側で ログイン情報・状態(session) と ログイン証明書(access_token) を取得するフック



// 役割
// - フロント側のログイン確認係(Supabase に認証情報(session)の有無を確認している)
// - API に送る access_token を token から取り出す係
// - API に送る token の中身は access_token だけ
// - このフック自体はDBには触らない
// - ログイン中か確認し、ログイン中なら session を保存
// - 確認中かどうかの状態を isLoading で返す



// ポイント
// - フロント で ログイン情報を取得する係
// token を 取り出して API に送る

// - app/_hooks : 画面では無いけれど、app配下 の 画面で共有したいReact処理(React Hook)を置く場所としている

// - session: ログイン情報・状態
// - `token: access_token` : ログイン証明書 


// - それぞれのページで、supabase.auth.getSession() を書く代わりに、共通の部品として使うためのもの

// - page.tsx などで毎回ログイン確認の処理を書かないため

// - 結果ページで以下のように使える
// 例.
// const { token, isLoading} = useSupabaseSession();

// このコードにより、
// 「今ログイン確認中か・ログインしているか・APIに送るtokenがあるか」
// を取り出せる



// - `useSupabaseSession.ts` での token 保存方法は以下のように行なっている
// setToken(session?.access_token ?? null);

// つまり、token の中身は、Bearer xxx.yyy.zzz では無い
// 例.
// xxx.yyy.zzz



// - API側の `getAuthenticatedUser.ts` では以下のように token を取り出している
// const authHeader = request.headers.get("Authorization");
// const token = authHeader?.replace("Bearer ", "").trim() ?? "";

// なので、フロント側でAPIを呼ぶときは、以下のように呼び出す(fetch時)必要がある
// headers: {
//   Authorization: `Bearer ${token}`,
// },





// - このファイル内の流れ

// フロント側でそれぞれページ(xxx/page.tsx)を開く
//   ↓
// useSupabaseSession が呼ばれる
//   ↓
// web/app/_hooks/useSupabaseSession.ts
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
// フロント側に ログイン情報・状態(session) と ログイン証明書(token) を返す
//   ↓
// ページ側で token を使ってAPIを呼べる




// - 全体の流れ


// - フロント側

// フロント側でそれぞれページ(xxx/page.tsx)を開く
//   ↓
// `useSupabaseSession()`
//   ↓
// `web/app/_hooks/useSupabaseSession.ts`
//   ↓
// Supabase から `session` を取得
//   ↓
// `session.access_token` を `token` として保存する
//   ↓
// フロント側に ログイン情報・状態(`session`) と ログイン証明書(`token`) を返す
//   ↓
// フロント側で fetch で  `xxx/route.ts` を呼び出し、`headers` に `Authorization: Bearer ${token}` を付けて、API側 に送る
//   ↓
// `xxx/route.ts`
//   ↓
// `getAuthenticatedUser(request)`
//   ↓
// `web/lib/auth/getAuthenticatedUser.ts` で処理を行い、API側(`xxx/route.ts`)に返す
//   ↓
// API側(`route.ts`) からフロント(`xxx/page.tsx`)に返ってくる


// API側

// フロント側で `fetch` で  `xxx/route.ts` を呼び出す
//   ↓
// `xxx/route.ts`
//   ↓
// `getAuthenticatedUser(request)`
//   ↓
// `web/lib/auth/getAuthenticatedUser.ts`
//   ↓
// `Authorization header` を取得
//   ↓
// `Bearer` を取り除いて `token` を取り出す
//   ↓
// `Supabase auth.getUser(token)`
//   ↓
// 成功なら `user` を API側(`xxx/route.ts`) に返す
// or
// 失敗なら `UNAUTHORIZED` を API側(`xxx/route.ts`)に返す
//   ↓
// 各 route.ts で
// Prisma DB で `user.id` と `diagnosisId` を使って本人データかを確認する
//   ↓
// API側(`route.ts`) からフロント(`xxx/page.tsx`)に返す





// Supabase をブラウザ側で使うための設定ファイルを読み込む
import { supabase } from "@/lib/supabase/client";
// Supabase が用意している Session という型を読み込む
// Session は、ログイン中ユーザーの情報をまとめた型
import type { Session } from "@supabase/supabase-js";
// 現在のURLパスを取得するための Next.js のフック
// - ページ移動した時にログイン状態を再確認するために必要
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const useSupabaseSession = () => {
  // session に 3つの状態を持たせる
  // - undefined: ログイン状態をSupabaseに確認中
  // - null: 確認した結果、未ログイン
  // - Session: 確認した結果、ログイン済み
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  // token: API に送るためのログイン証明書のようなもの
  // - ログイン中なら Supabase の access_token 文字列(string)
  // - 未ログインなら null
  const [token, setToken] = useState<string | null>(null);

  // 現在のURLパスを取得
  // - 例.
  // /login ・ /mypage ・ /diagnosis/xxx/result など
  const pathname = usePathname();

  // 画面表示後に実行する処理(ログイン状態を確認する処理)
  useEffect(() => {
    const fetcher = async () => {
      // Supabase に対して、「今ログイン中の session はありますか？」 と確認している
      // - ログインしている場合 → session が返る
      // - ログインしていない場合 → session は null になる
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Supabase側 で エラーの場合の処理(ログインしていない場合)
      if (error) {
        setSession(null);
        setToken(null);
        return;
      }

      // session が存在し、取得できた場合 → session(ログイン情報) を state に保存
      setSession(session);
      // session があれば session の中から access_token(ログイン中ユーザーの証明) を取り出し state に保存
      // access_token には Bearer が付いてないので、フロント側で fetch時に Bearer を付ける必要がある。
      setToken(session?.access_token ?? null);
    };

    fetcher();
  // pathname が変わる度にログイン状態を確認する処理を実行する
  }, [pathname]);

  // このカスタムフックを使う側に以下を返す

  // - session: ログイン状態

  // - isLoading: 
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