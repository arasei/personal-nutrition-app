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
// - 初回session取得より先に、認証イベントの監視を開始する
// - 認証イベントを受信したら、通知されたsessionを反映する
// - 初回取得より先に認証イベントを受信していた場合は、
// - 遅れて返ってきた初回取得結果では上書きしない
// - useEffect終了時に監視を解除する



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



// tokenは独立したstateに保存せず、sessionから取り出して返す
// token: session?.access_token ?? null
// - sessionがない場合はnullを返す




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
// session.access_token を session から取り出し、token として返す
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
// `session.access_token` を session から取り出す
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




"use client";


// Supabase をブラウザ側で使うための設定ファイルを読み込む
import { supabase } from "@/lib/supabase/client";
// Supabase が用意している Session という型を読み込む
// Session は、ログイン中ユーザーの情報をまとめた型
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const useSupabaseSession = () => {
  // session に 3つの状態を持たせる
  // - undefined: ログイン状態をSupabaseに初回確認中
  // - null: 確認した結果、未ログイン or 利用できる session がない or 初回確認に失敗
  // - Session: 確認した結果、ログイン済み(session を 取得成功)
  const [session, setSession] = useState<Session | null | undefined>(undefined);


  // 画面表示後に実行する処理(ログイン状態を確認する処理)
  useEffect(() => {
    // この useEffect がまだ有効かどうかを管理する
    // - useEffectの有効・無効 を表示
    // - session の 有無やログイン状態を表す変数ではない
    let isActive = true;

    // 認証イベント(session 確認)をすでに行い受け取ったかどうかを管理
    // - 通知を受信したかどうかを表示
    // - ログアウト や nextSession が null になる通知 など を含む

    // 例.
    // 初回取得した session よりも 新規取得したsession がある場合の 新規session の状態管理
    // - 新規session アリ = true
    // - 新規session ナシ = false
    let hasReceivedAuthEvent = false;

    // 初回取得中の変更も受け取れるよう、先に監視を開始する
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // このuseEffect がすでに終了している場合は、状態を更新しない

      // 例.
      // - 初回取得した session の状態で useEffect がすでに実行し、終了している場合、その 初回session を継続して使用するため
      if (!isActive) {
        return;
      }

      // 認証通知を受け取ったことを記録し、その session を反映する
      // nextSession が null の場合、session がない状態へ更新する

      // 例.
      // 初回取得した session よりも 新規session を取得している場合、更新し、反映する
      hasReceivedAuthEvent = true;
      setSession(nextSession);
    });


    const fetchInitialSession = async () => {
      try {
        // Supabase に対して、「今ログイン中の session はありますか？」 と確認している
        // - ログインしている場合 → session が返る
        // - ログインしていない場合 → session は null になる
        const { data, error } = await supabase.auth.getSession();

        // 古くなったsession で上書きしない
        // - 画面を離れた場合や、認証通知(新規session)をすでに受け取った場合は、初回取得session で現在の状態を上書きしない
        if (!isActive || hasReceivedAuthEvent) {
          return;
        }

        // Supabase側 で session 取得に失敗の場合の処理
        // - 画面側では、利用できる session がない状態として扱う
        // - session 取得失敗エラーは、必ず未ログインという意味ではない
        if (error) {
          setSession(null);
          return;
        }

        // session が存在し、取得できた場合 → session(ログイン情報) を state に保存
        setSession(data.session);
      } catch {
        if (!isActive || hasReceivedAuthEvent) {
          return;
        }

        // 取得に失敗した場合 or 未ログイン も、確認中のままにしない
        setSession(null);
      }
    };

    void fetchInitialSession();

    // 認証の監視を解除する
    return () => {
      // 遅れて返ってきた初回取得結果を反映しない
      isActive = false;
      // このフックが登録した認証の監視を解除する
      subscription.unsubscribe();
    };
  }, []);

  // このカスタムフックを使う側に以下を返す

  // session
  // - ログイン状態

  // isLoading
  // - ログイン状態を確認中かどうか
  // 最初は session が undefined なので、「isLoading: true」になる
  // Supabase から結果が返ってくると、session が null または Session になるので、「isLoading: false」になる

  // token: session?.access_token ?? null,
  // - session と token を別々のstateで管理しない

  // token: API に送るための token
  return {
    session,
    isLoading: session === undefined,
    token: session?.access_token ?? null,
  };
};