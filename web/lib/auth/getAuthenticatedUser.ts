// web/lib/auth/getAuthenticatedUser.ts

// 全体の概要
// - 今ログインしているユーザーが誰かを取得するため
// - API Route に送られてきた Authorization header から token(access_token) を取り出し、
// Supabase Auth で token(access_token) を検証してログイン中ユーザーを返すサーバー側で使う認証チェック用の共通関数



// 役割
// - API側のログイン確認係
// フロント から API に送られてきた token が本物か確認する
// token を 検証して本人確認する
// - API側で Supabase auth.getUser(token) により、
// Authorization header から token(access_token) を 受け取り、
// Supabase Auth で検証して user を取得する係





// ポイント
// - lib は、「アプリ全体で使い回す共通処理」(画面そのものではない認証関連の共通処理)を置く場所

// - getAuthenticatedUser.ts はDBに確認しているのではなく、Supabase Auth に確認している。
// DB、つまり Prisma のテーブル確認(DB確認)は、その後の各 route.ts で行う 





// - このファイル内の流れ

// フロント側でそれぞれページ(xxx/page.tsx)を開く
//   ↓
// useSupabaseSession()
//   ↓
// `web/app/_hooks/useSupabaseSession.ts`
//   ↓
// ログイン情報・状態(session) と ログイン証明書(token) を取得
//   ↓
// フロント側でAPI(`xxx/route.ts`) を fetch
//   ↓
// `xxx/route.ts`
//   ↓
// getAuthenticatedUser(request)
//   ↓
// `web/lib/auth/getAuthenticatedUser.ts`
//   ↓
// Authorization header を取得
//   ↓
// Bearer を取り除いて token を取り出す
//   ↓
// Supabase auth.getUser(token)
//   ↓
// 成功なら user を API側(`xxx/route.ts`) に返す
//   ↓
// 失敗なら UNAUTHORIZED を API側(`xxx/route.ts`)に返す
//   ↓
// 各 `route.ts` で
// Prisma DB で user.id と diagnosisId を使って本人データかを確認する
//   ↓
// API側(`route.ts`) からフロント(`xxx/page.tsx`)に返す





// - 全体の流れ

// - フロント側
// フロント側でそれぞれページ(xxx/page.tsx)を開く
//   ↓
// useSupabaseSession()
//   ↓
// web/app/_hooks/useSupabaseSession.ts
//   ↓
// Supabaseから session を取得
//   ↓
// session.access_token を token として保存する
//   ↓
// フロント側に ログイン情報・状態(session) と ログイン証明書(token) を返す
//   ↓
// フロント側で fetch で  xxx/route.ts を呼び出し、headers に Authorization: Bearer ${token} を付けて、API側 に送る
//   ↓
// xxx/route.ts
//   ↓
// getAuthenticatedUser(request)
//   ↓
// web/lib/auth/getAuthenticatedUser.ts で処理を行い、API側(xxx/route.ts)に返す
//   ↓
// API側(route.ts) からフロント(xxx/page.tsx)に返ってくる


// - API側
// フロント側で fetch で  xxx/route.ts を呼び出す
//   ↓
// xxx/route.ts
//   ↓
// getAuthenticatedUser(request)
//   ↓
// web/lib/auth/getAuthenticatedUser.ts
//   ↓
// Authorization header を取得
//   ↓
// Bearer を取り除いて token を取り出す
//   ↓
// Supabase auth.getUser(token)
//   ↓
// 成功なら user を API側(xxx/route.ts) に返す
// or
// 失敗なら UNAUTHORIZED を API側(xxx/route.ts)に返す
//   ↓
// 各 route.ts で
// Prisma DB で user.id と diagnosisId を使って本人データかを確認する
//   ↓
// API側(route.ts) からフロント(xxx/page.tsx)に返す


// サーバー側で使うSupabaseクライアント作成関数を読み込む
import { createClientForServer } from "@/lib/supabase/server";
// Supabase のログインユーザー情報を読み込み
import type { User } from "@supabase/supabase-js";


// 認証に成功した時の戻り値の型
type AuthSuccess = {
  user: User;
  error: null;
};

// 認証に失敗した時の戻り値の型
type AuthFailure = {
  user: null;
  error: "UNAUTHORIZED";
};

// この関数(AuthResult)は 成功結果 or 失敗結果 のどちらかを返すということを指定している型
export type AuthResult = AuthSuccess | AuthFailure;


// Promise<AuthResult> : 非同期処理が終わったら AuthResult を返す
export async function getAuthenticatedUser(
  request: Request
): Promise<AuthResult> {
  // request により、フロント から API に 送られてきた Authorization header を取得
  // Authorization: Bearer <access_token> の形を想定する
  const authHeader = request.headers.get("Authorization");
  // Authorization header から Bearer の部分を取り除いて、access_token (例.abc123)だけを取り出す
  // Authorization header がない場合、空文字になる
  // .trim() で前後の空白を消す
  const token = authHeader?.replace("Bearer ", "").trim() ?? "";

  // サーバー側で API Route用のSupabaseクライアント作成
  // Supabaseで token を検証し、ログイン中ユーザーを取得するため
  const supabase = createClientForServer();

  // token を supabaseに渡して token から ログイン中ユーザー情報を確認し、取得(ログイン中かどうか)(認証処理本体)
  // - Prisma DB確認はしていない。Supabase Auth に token を確認している処理
  // - token が正しければ user が返る
  // - token が空・不正・期限切れの場合、error が返る または userなし になる。
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  // token が無い・不正・期限切れの場合は未ログイン扱い
  // - ユーザー取得失敗(errorがある) or 未ログイン(userが無い)の場合はこのAPIを停止
  // - 未ログインのままこのAPIを使わせないため
  // - エラーのレスポンス は 各APIごと に違うためこの関数内では NextResponse.json(...) は返さない。
  if (error || !user) {
    return {
      user: null,
      error: "UNAUTHORIZED",
    };
  }

  // 認証成功として、ログイン中ユーザーを返す
  // - API側では、この user.id を使って本人確認をするため
  // - 共通関数では user を返すだけ
  // - エラーレスポンスは各APIで作成する
  return {
    user,
    error: null,
  };
}