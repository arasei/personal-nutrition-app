//Client Component側でSupabaseにアクセスするための共通クライアントを定義

// なぜ必要？
// ログイン状態を確認(tokenを元にユーザー情報を確認)
// クライアント側でのログインやsession取得に必要
// API側ではsupabase.auth.getUser(token)を使って、tokenから認証済み(ログイン済み)ユーザー情報を取得するために必要

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);