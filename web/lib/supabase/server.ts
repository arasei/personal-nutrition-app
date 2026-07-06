// API Routeなどサーバー側で使うSupabaseクライアントを作成する関数を定義

// なぜ必要？
// サーバー側でユーザー確認や認証処理を行うために必要


import { createClient } from "@supabase/supabase-js";


export function createClientForServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
