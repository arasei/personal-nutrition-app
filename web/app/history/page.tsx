// web/app/history/page.tsx

// 履歴APIからデータを取得して、上位3栄養素付きの履歴一覧を画面に表示し、履歴詳細ページへ遷移できるページ
// ログイン中ユーザーの Supabase token を使って、履歴API(web/app/api/diagnosis/history/route.ts)を呼び、
// 本人の診断履歴だけを取得し、一覧表示するページ

//APIから履歴データ(配列)が返る
//履歴データをmapで画面に並べる
//履歴一覧をクリック、IDごとの履歴詳細へ遷移

// Client Component内でSupabase sessionからtokenを取得し、
// Authorizationヘッダー付きで履歴APIを呼び出している


//流れ

// /historyを開く
//   ↓
// Supabaseからsessionを取得
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

import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  ApiErrorResponse,
  DiagnosisHistoryItem,
  GetDiagnosisHistoryResponse,
} from "@/types/diagnosisApi";





//画面表示ロジック
export default function HistoryPage() {
  const router = useRouter();

  // 取得した履歴一覧を保存するためのstate(箱)
  const [histories, setHistories] = useState<DiagnosisHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const result = await supabase.auth.getSession();
        // Supabaseからログイン中ユーザーのsessionを取得
        const session = result.data.session;
        // sessionの中から access_tokenを取り出す
        const token = session?.access_token;

        // tokenが無い場合、未ログインとして /login に遷移する
        if (!token) {
          setErrorMessage("ログインが必要です");
          router.replace("/login");
          return;
        }

        const res = await fetch("/api/diagnosis/history", {
          method: "GET",
          // APIにログインtokenを渡す
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // 前のデータを使い回さない
          // 毎回サーバーから新しいデータを取りに行く
          cache: "no-store",
        });

        // APIから返ってきたデータをJSONとして解析する
        const responseData = await res.json();

        // APIからエラーが返ってきた場合の処理
        if (!res.ok) {
          const errorData = responseData as ApiErrorResponse;
          setErrorMessage(errorData.message ?? "履歴取得に失敗しました");
          return;
        }

        // APIから返ってきたデータを型に当てはめる
        const data = responseData as GetDiagnosisHistoryResponse;

        // APIから返ってきた履歴配列を stateに保存する
        // [] があることでAPIからhistories が取れなかった場合でも画面が落ちない。空の履歴として扱える
        setHistories(data.histories ?? []);
      } catch (error) {
        console.error("failed to fetch history:",error);
        setErrorMessage("履歴取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  // API取得中に表示する画面
  if (isLoading) {
    return <p>履歴を読み込み中です...</p>
  }

  // エラーがある場合の表示
  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  return (
    <div>
      <h1>診断履歴</h1>

      {histories.length === 0 && <p>履歴がありません</p>}

      {/* 履歴一覧を表示 */}
      {/* mapで1件ずつ履歴を表示 */}
      {histories.map((history) => (
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