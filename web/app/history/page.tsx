// web/app/history/page.tsx

// 履歴APIからデータを取得して、上位3栄養素付きの履歴一覧を画面に表示し、履歴詳細ページへ遷移できるページ
// ログイン中ユーザーの Supabase token を使って、履歴API(web/app/api/diagnosis/history/route.ts)を呼び、
// 本人の診断履歴だけを取得し、一覧表示するページ

//APIから履歴データ(配列)が返る
//履歴データをmapで画面に並べる
//履歴一覧をクリック、IDごとの履歴詳細へ遷移

// Client Component内で useSupabaseSession から token を取得し、
// SWR を使って Authorizationヘッダー付きで履歴APIを呼び出している


//流れ

// /historyを開く
//   ↓
// useSupabaseSession から token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// /api/diagnosis/historyへ送る
//   ↓
// API側でtoken確認
//   ↓
// user.id を取得
//   ↓
// 本人の履歴だけ取得(Prisma で userId: user.id の履歴だけ検索)
//   ↓
// scores を score 昇順で取得
//   ↓
// 上位3栄養素だけ整形
//   ↓
// history/page.tsx に返す
//   ↓
// data.histories(履歴一覧)を画面に表示
//   ↓
// クリックで /history/[id] へ移動




// APIで返すとき
//   ↓
// toISOString()

// 画面に表示するとき
//   ↓
// toLocaleDateString()



"use client";

import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// SWR でAPIからデータを取る処理を管理
import useSWR from "swr";
import type {
  ApiErrorResponse,
  DiagnosisHistoryItem,
  GetDiagnosisHistoryResponse,
} from "@/types/diagnosisApi";


// 履歴APIを呼び出すfetcher関数
async function fetchDiagnosisHistory(token: string): Promise<DiagnosisHistoryItem[]> {
  const res = await fetch("/api/diagnosis/history", {
    method: "GET",
    // APIにログイン中ユーザーの token を渡す
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // 前のデータを使い回さない
    // 毎回サーバーから新しいデータを取りに行く
    cache: "no-store",
  });

  // APIから返ってきたデータをJSONとして解析する
  const responseData: GetDiagnosisHistoryResponse | ApiErrorResponse = await res.json();

  // HTTP処理がエラーの場合の処理
  if (!res.ok) {
    const errorData = responseData as ApiErrorResponse;
    throw new Error(errorData.message ?? "履歴取得に失敗しました");
  }

  // API処理がエラーの場合の処理(データが返って来ない、取得できない時)
  // success: true の時だけ histories を使えるようにする
  if (!responseData.success) {
    const errorData = responseData as ApiErrorResponse;
    throw new Error(errorData.message ?? "履歴取得に失敗しました");
  }

  // 画面で使いたい履歴配列だけ返す
  return responseData.histories;
}




//画面表示ロジック
export default function HistoryPage() {
  const router = useRouter();

  // ログイン中ユーザーの token を取得
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  
  useEffect(() => {
    // tokenが無い場合、未ログインとして /login に遷移する
    if (!isSessionLoading && !token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);

  // SWR で履歴取得
  // token がある → 履歴APIを呼ぶ
  // token がない → APIを呼ばない
  // SWRから渡されるキー配列の ["diagnosis-history", token] から2つ目の token だけを取り出し、使用する
  const {
    data: histories,
    error,
    isLoading: isHistoryLoading,
  } = useSWR(
    token ? ["diagnosis-history", token] : null,
    ([, token]) => fetchDiagnosisHistory(token)
  );

  if (isSessionLoading) {
    return <p>ログイン情報を確認中です...</p>
  }

  if (!token) {
    return <p>ログインページへ移動しています...</p>
  }

  if (isHistoryLoading) {
    return <p>履歴を読み込み中です...</p>
  }

  if (error) {
    return <p>{error.message}</p>
  }



  return (
    <div>
      <h1>診断履歴</h1>

      {(!histories || histories.length === 0) && <p>履歴がありません</p>}

      {/* 履歴一覧を表示 */}
      {/* mapで1件ずつ履歴を表示 */}
      {histories?.map((history) => (
        // 履歴一覧 → 詳細リンクに遷移
        <Link href={`/history/${history.id}`} key={history.id}>
          <div style={{ border: "1px solid gray", margin: "16px", padding: "16px" }}>
            {/* 日付表示 */}
            {/* データとして送られてきた日付を日本環境に対応した表示にする */}
            <p>
              日付: {new Date(history.createdAt).toLocaleDateString("ja-JP")}
            </p>
            {/* 上位3栄養素の表示 */}
            <h3>不足しやすい栄養素 上位3つ</h3>
            <ul>
              {history.topNutrients.map((nutrient) => (
                <li key={nutrient.nutrientId}>
                  {nutrient.nutrientName} : {nutrient.score}
                </li>
              ))}
            </ul>
          </div>
        </Link>
      ))}
    </div>
  );
}