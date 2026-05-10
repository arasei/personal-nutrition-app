// web/lib/supabase/server.ts

// API Routeなどサーバー側で使うSupabaseクライアントを作成する関数
// tokenをSupabaseに確認し、ログイン中ユーザーを取得するために使う


// なぜ必要？
// サーバー側でユーザー確認や認証処理を行うために必要


import { createClient } from "@supabase/supabase-js";


export function createClientForServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
