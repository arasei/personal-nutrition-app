// web/app/_hooks/useSupabaseSession.ts


// 全体の概要
// - ブラウザ側で Supabaseのtoken・session(認証情報・認証状態) を取得・監視する共通hook
// - 認証情報(token)・認証状態(session)・ログイン証明書(access_token) を確認し取得することで認証の状態を監視することでユーザー種別を判定した結果を
// それぞれのコンポーネントに返すことで使用する



// 役割
// - フロント側のログイン確認係(Supabase に認証情報(session)の有無を確認している)
// - 初回session取得より先に、認証イベントの監視を開始する
// - 認証イベントを受信したら、通知されたsessionを反映する
// - 認証イベント受信後に返ってきた初回取得結果では、状態を更新しない
// - sessionの状態確認終了後の状態更新(画面離脱・ログアウト など)を防ぎ、認証イベントの監視を解除する。
// - useEffect によるsession の 状態確認を1度完了した後に、
// その完了済みの useEffect で再度の状態更新(画面離脱・ログアウト など)を無効にし、認証イベントの監視を解除する。(ただし、その後も認証変更は監視し続ける)
// - session より session.access_token を 取り出し、token という名前で返す
// - このフック自体は、診断APIの呼び出し・DB操作・画面遷移・ゲスト作成・ログイン・ログアウト
// を行わない。
// - API側 での本人確認・アクセス権限の確認を代わりに行うものではない
// - このhook を呼び出し、使用するコンポーネント側に認証情報を返し、
// その認証情報を元に呼び出した側のコンポーネントそれぞれで 画面表示 や APIリクエスト に使用し、行う。
// - 認証情報を確認し、認証情報アリ の場合 session を保存
// - sessionの状態確認中かどうかの状態を isLoading で返す





// 利用例
// const {
//   token,
//   isLoading,
//   authStatus,
//   isGuest,
//   isMember,
//   errorMessage,
// } = useSupabaseSession();



// 注意
// - このフックを複数箇所で呼ぶと、それぞれがstateと監視を持つ。
// - 共通化しているのは処理であり、単一の共有stateではない。
// - session や token 全体を画面・ログへ出力しない。







// この hook を使用するコンポーネント側に返す値
// - session:
// undefined = 認証情報を初回確認中
// null = sessionなし or 認証情報を初回取得失敗
// Session = sessionあり
// - isLoading: session が undefined の間だけ true
// - token: session.access_token。session がなければ null。
// - authStatus: loading / signedOut / guest / member / error
// - isGuest: authStatus が guest の場合だけ true
// - isMember: authStatus が member の場合だけ true
// - errorMessage: 取得失敗・ユーザー種別不明の案内。エラーがなければ null。




// ユーザー種別の判定
// - session.user.is_anonymous === true: ゲスト
// - session.user.is_anonymous === false: 通常ユーザー
// - session があってもユーザー種別を識別できない場合は error
// - token の有無だけでは、ゲスト と 通常ユーザー を区別できない。
// - ユーザー種別が ゲストではないことだけを理由に、通常ユーザーとは判定しない。



// ポイント
// - フロント側 で 認証情報・認証状態 を取得・監視する係
// - 呼び出し元のコンポーネントには、token として取得した認証情報(session) 返すことで使用
// - app/_hooks : 画面では無いけれど、app配下 の 画面で共有したいReact処理(React Hook)を置く場所としている
// - このフックを複数箇所で呼ぶと、それぞれがstateと監視を持つ。
// - 共通化しているのは処理であり、単一の共有stateではない。
// - session や token 全体を画面・ログへ出力しない。

// - session: ログイン情報・状態
// - `token: access_token` : ログイン証明書 

// - それぞれのコンポーネントで、認証情報を確認・取得する際に supabase.auth.getSession() を書く代わりに、このhook を使用することが目的
// 毎回認証情報を確認・取得の処理を書く必要がなくなる。

// 例.
// 結果ページで以下のように使うことで
// 「認証状態確認中(isLoading)・認証情報(token)」を取得し、使用可能

// const { token, isLoading} = useSupabaseSession();



// - tokenは独立したstateに保存せず、sessionから取り出してコンポーネントに返す
// sessionがない場合はnullを返す

// 使用例.
// token: session?.access_token ?? null



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

// 認証確認の状態 と 確認できたユーザー種別
type AuthStatus = | "loading" | "signedOut" | "guest" | "member" | "error" ;

export const useSupabaseSession = () => {
  // session に 3つの状態を持たせる
  // - undefined: 認証(ログイン)状態 を Supabase に初回確認中
  // - null: 確認した結果、未ログイン or 利用できる session がない or 初回確認に失敗
  // - Session: 確認した結果、ログイン済み or 利用できる session がある ことを確認(session を 確認成功)
  // session 取得成功 or 取得失敗 かどうかは sessionError で区別する
  // session の存在確認出来ても、ログイン済みの通常ユーザーの扱いとは限らない
  // ゲスト か 通常ユーザーかどうかは is_anonymous で区別する
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [sessionError, setSessionError] = useState<string | null>(null);


  // 画面表示後に実行する処理(ログイン状態を確認する処理)
  useEffect(() => {
    // この useEffect がまだ有効かどうかを管理する
    // - useEffectの有効・無効 を表示
    // - 画面離脱後に、このhook の状態を更新しないためのフラグ
    // - session の 有無やログイン状態を表す変数ではない
    let isActive = true;

    // 認証イベント通知を受信したかどうかを監視し表示、管理する
    // - 認証イベント(session 確認 など)をすでに行い受け取ったかどうかを監視、管理
    // - 認証イベント 受信済み = true
    // - 認証イベント 受信なし or まだ受信していない = false
    // - nextSession が null になる通知 など も受信し、管理する
    // ログアウトなどで、nextSession === null の 通知を受信した場合 true になる
    // 通信中の画面離脱・ログアウトなど により遅れて返ってきた初回取得結果で認証イベントから受け取った新しい状態を上書きしないため

    let hasReceivedAuthEvent = false;

    // 初回取得より先に、認証状態の変更を監視を開始する
    // - 初回取得中の変更も受け取れるようにするため
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // この Effect が 無効の場合、状態を更新しない
      if (!isActive) {
        return;
      }

      // 認証イベントの通知を受信したことを記録
      // - 新規session がある場合も null の場合も記録する
      // - 新規session がある場合、その session を nextSession として反映し、更新する
      // - 新規session がない場合、nextSession は null となる。
      // 新規session は無い状態へ更新する

      // 例.
      // 初回取得した session よりも 新規session を取得している場合、更新し、nextSession として反映するために必要
      hasReceivedAuthEvent = true;

      // 認証イベントで最新のsession の状態を受け取ったため、初回取得時のエラーは解除(null)する
      // - nextSession が null の場合、sessionなしの状態へ更新する
      setSessionError(null);
      setSession(nextSession);
    });


    const fetchInitialSession = async () => {
      try {
        // Supabase に対して、「今ログイン中の session はありますか？」 と確認している
        // - ログインしている場合 → session が返る
        // - ログインしていない場合 → session は null になる
        const { data, error } = await supabase.auth.getSession();

        // 画面離脱後、または認証イベント受信後の初回取得結果は使わない
        // - 古くなったsession で上書きしない
        // - 画面を離れた場合や、新規認証通知(新規session)をすでに受け取った場合は、初回取得session で現在の状態を上書きしない
        if (!isActive || hasReceivedAuthEvent) {
          return;
        }

        // Supabase側 で session 取得に失敗の場合の処理
        // - 画面側では、利用できる session がない状態として扱う
        // - session 取得失敗エラーは、必ず未ログインという意味ではない
        if (error) {
          setSessionError("認証情報を確認できませんでした。");
          setSession(null);
          return;
        }

        setSessionError(null);
        // 取得結果(session) を state に反映する
        // - session が存在し、取得できた場合 → session(ログイン情報) を state に保存
        // - session がなければ null とする(正常な未ログイン状態の処理)
        setSession(data.session);
      } catch {
        if (!isActive || hasReceivedAuthEvent) {
          return;
        }

        setSessionError("認証情報を確認できませんでした。");
        // 例外発生時も、初回確認中のままにしない
        // - sessionError を設定しているため、authStatus は error になる
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

  // session と 取得エラー の現在の状態から ユーザー種別を識別する
  // - authStatus・isGuest・isMember のために 別々のuseState を作成はしない
  // session が変われば再レンダリングされ、そのsession から判定し直せるため
  // 独立した useState を 増やさないことで、例えば「session はログアウト済みなのに、isMember だけが true のまま」のような不整合を避ける


  let authStatus: AuthStatus;
  let errorMessage: string | null = sessionError;

  if (session === undefined) {
    authStatus = "loading";
  } else if (sessionError !== null) {
    authStatus = "error";
  } else if (session === null) {
    authStatus = "signedOut";
  // ゲスト
  } else if (session.user.is_anonymous === true) {
    authStatus = "guest";
  // 通常ユーザー
  } else if (session.user.is_anonymous === false) {
    authStatus = "member";
  } else {
    // ユーザー種別を確認できない場合は、通常ユーザーと決めつけない。
    // - 不明な状態を、通常ユーザーとして扱わないため
    authStatus = "error";
    errorMessage = "ユーザー種別を確認できませんでした。";
  }




  // このカスタムフックを使う側に以下を返す

  // session
  // - Session のオブジェクト・null・undefined のいずれか
  // - session が存在するかどうか

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

    // 今後のゲスト対応で使用する認証情報

    // 利用する側でのそれぞれの役割
    // authStatus
    // - session確認中・未ログイン・エラー を含めた全体の分岐
    // isGuest
    // - ゲスト向け案内の表示
    // isMember
    // - 通常ユーザー向けメニューの表示
    // errorMessage
    // - 確認に失敗した場合の案内
    authStatus,
    isGuest: authStatus === "guest",
    isMember: authStatus === "member",
    errorMessage,
  };
};