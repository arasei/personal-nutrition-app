// web/app/history/[id]/page.tsx

// 履歴詳細ページでURLの[id]を元に履歴詳細APIを呼び出し、ログイン中ユーザー本人の
// 診断日・チャート・栄養スコア一覧・上位栄養素・不足栄養素・前回差分を表示するページ

// 役割
// /history/[id]/page.tsx
//   ↓
// tokenを送る・API結果を受け取る・表示する





// URL例
// /history/abc123
// [id]=abc123
// params.id=abc123

// 履歴詳細ページで表示するものは現状6つ
// ① 診断日
// ② 全栄養スコア一覧
// ③ 上位栄養素
// ④ 不足栄養素
// ⑤ 前回との差分
// ⑥ チャート表示

// 関連テーブル(使用しているrelation)
// Diagnosis
//    ↓
// DiagnosisNutrientScore
//    ↓
// Nutrient


// 処理流れ

// 履歴一覧ページ(web/app/history/page.tsx)
//    ↓ 履歴カードをクリック
// 履歴詳細ページ(/history/[id])
//    ↓
// useParamsでidを取得
//    ↓
// Supabase sessionからtokenを取得
//    ↓
// /api/diagnosis/history/[id] にtoken付きでリクエストを送る
//    ↓
// API側で本人確認・DB取得・データ整形
//    ↓
// page.tsx側で受け取ったデータを表示



"use client";


import SafeRadarChart from "@/components/SafeRadarChart";
import { supabase } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type {
  GetDiagnosisHistoryDetailResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";


// APIから取得した履歴詳細データの型を定義(成功時だけ使用する型)
type HistoryDetailSuccessResponse = Extract<
  GetDiagnosisHistoryDetailResponse,
  { success: true }
>;


// 履歴詳細ページのコンポーネントを定義
export default function HistoryDetailPage() {
  const router = useRouter();

  // useParams で取得する id の型を<{ id: string }>() として定義
  // URLの [id] を文字列として取り出す
  const params = useParams<{ id: string }>();
  // URLの [id] から診断IDを取得
  const id = params.id;

  // APIから取得した履歴詳細データを保存するstate
  // 最初はまだ取得していないので null
  const [historyDetail, setHistoryDetail] = useState<HistoryDetailSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      try {
        // 新しいIDで取得し直すときにもう一度読み込み中にする
        setIsLoading(true);
        // 前回のエラー表示を必ず消す
        setErrorMessage("");
        // 前回表示していた診断詳細を必ず消す
        setHistoryDetail(null);

        // Supabase から現在のログインsession を取得
        const result = await supabase.auth.getSession();
        // 取得結果から session を取り出す
        const session = result.data.session;
        // session から access token を取り出す
        const token = session?.access_token;

        // 未ログイン時
        if (!token) {
          setErrorMessage("ログインが必要です");
          router.replace("/login");
          return;
        }
        
        // token付きで履歴詳細APIを呼ぶ
        // フロント側から(web/app/history/[id]/page.tsx)API側(web/app/api/diagnosis/history/[id]/route.ts)に送られる、
        // Authorizationヘッダーからtokenを取り、id + userId で本人の診断だけ取得する為の構成
        const res = await fetch(`/api/diagnosis/history/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        // APIから返ってきたJSONを読み取る
        const data = await res.json();

        // HTTP処理がエラーの場合
        // エラー時の data の形は { success: false, message: "エラーメッセージ" } なので、ApiErrorResponse 型として扱い、エラーmessage を表示する 
        if (!res.ok) {
          const errorData = data as ApiErrorResponse;

          setErrorMessage(errorData.message ?? "履歴詳細の取得に失敗しました");
          return;
        }
        
        // 成功時は履歴詳細データとして扱う
        // 成功時の data の形は GetDiagnosisHistoryDetailResponse 型として扱う
        const historyData = data as GetDiagnosisHistoryDetailResponse;

        // API処理がエラーの場合の処理
        if (!historyData.success) {
          setErrorMessage(historyData.message ?? "履歴詳細の取得に失敗しました");
          return;
        }

        setHistoryDetail(historyData);
      } catch (error) {
        console.error("failed to fetch history detail:", error);
        setErrorMessage("履歴詳細の取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryDetail();
  }, [id, router]);

  // API取得中の表示
  if (isLoading) {
    return <p>履歴詳細を読み込み中です...</p>;
  }

  // エラー時のメッセージ表示
  if (errorMessage) {
    return <p>{errorMessage}</p>;
  }

  // 読み込み完了後、履歴詳細データが無い場合の表示
  if (!historyDetail) {
    return <p>履歴詳細がありません</p>;
  }
  
  //APIから来るデータをチャート用のデータ形に変換
  //nutrientはそのまま、score を total に変換して、SafeRadarChartに渡す。
  const ranking = historyDetail.nutrientScores.map((item) => ({
    nutrientId: item.nutrientId,
    nutrient: item.nutrient,
    total: item.score,
  }));


  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">診断詳細</h1>
      {/* 日付表示 */}
      {/* API側から toISOString() で文字列で返ってくるので new Date(...) で日付表示に変換 */}
      <p>
        診断日: {" "}
        {new Date(historyDetail.createdAt).toLocaleDateString("ja-JP")}
      </p>


      {/* 栄養素スコア表示 */}
      {/* チャート表示 */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          栄養素スコア
        </h2>

        <SafeRadarChart ranking={ranking} />

        <ul className="space-y-1">
          {/* 全栄養素のスコアを1件ずつ表示 */}
          {historyDetail.nutrientScores.map((score) => (
            <li key={score.nutrientId}>
              {score.nutrient} : {score.score}
            </li>
          ))}
        </ul>
      </section>

      {/* 満たせている上位3件 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">
          満たせている上位栄養素
        </h2>
        <ul className="space-y-1">
          {historyDetail.topNutrients.map((nutrient) => (
            <li key={nutrient.nutrientId}>
              {nutrient.nutrient} : {nutrient.score}
            </li>
          ))}
        </ul>
      </section>

      {/* 下位3件 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">
          不足傾向の上位栄養素
        </h2>
        <ul className="space-y-1">
          {historyDetail.lowNutrients.map((nutrient) => (
            <li key={nutrient.nutrientId}>
              {nutrient.nutrient} : {nutrient.score}
            </li>
          ))}
        </ul>
      </section>

      {/* 各栄養素の前回との差分 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">
          前回との差分
        </h2>
        <ul className="space-y-1">
          {historyDetail.differences.map((item) => (
            <li key={item.nutrientId}>
              {item.nutrient} : 現在 {item.current}
              {" / "}
              前回 {item.previous ?? "なし"}
              {" / "}
              {item.diffLabel}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}