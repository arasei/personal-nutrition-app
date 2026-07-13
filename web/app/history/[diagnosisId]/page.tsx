// web/app/history/[diagnosisId]/page.tsx


// 全体の概要
// - 履歴詳細を表示するページ
// - ログイン中ユーザーの token と URL の [diagnosisId] を使い、履歴詳細API を呼び出し、
// ログイン中ユーザー本人の 診断日・チャート・全栄養スコア一覧・満たせている上位3栄養素・不足傾向の下位3栄養素・前回差分 を表示するページ




// 役割
// /history/[diagnosisId]/page.tsx
//   ↓
// tokenを送る・API結果を受け取る・表示する





// ポイント


// web/app/history/[diagnosisId]/page.tsx での画面表示内容
// - 診断日
// - レーダーチャート
// - 全栄養素のスコア一覧
// - 満たせている上位栄養素
// - 不足傾向の栄養素
// - 前回との差分







// このファイル内の流れ


// 履歴一覧ページを開く
// ↓
// `web/app/history/page.tsx`
// ↓
// `web/app/history/page.tsx` で 履歴一覧(histories)表示
// ↓
// <Link href={`/history/${history.id}`} key={history.id}>
// 診断履歴詳細のリンクを1つクリックで `web/app//history/[diagnosisId]/page.tsx`(診断履歴詳細ページ) へ遷移可能
// ↓
// `web/app/history/[diagnosisId]/page.tsx`
// ↓
// useParams で [diagnosisId] を取得
// ↓
// 認証
// useSupabaseSession で token を取得
// ↓
// access_tokenを取り出す
// ↓
// GET /api/diagnosis/history/${diagnosisId}
// `web/app/history/[diagnosisId]/page.tsx` が token を `web/app/api/diagnosis/history/[diagnosisId]/route.ts` へ リクエストを送る
// ↓
// `web/app/api/diagnosis/history/[diagnosisId]/route.ts`
// ↓
// API側(`web/app/api/diagnosis/history/[diagnosisId]/route.ts`)で本人確認・DB取得・データ整形を行う
// ↓
// `web/app/history/[diagnosisId]/page.tsx` に 診断履歴詳細を表示するために
// 必要な値(
// success: true,
// id: currentDiagnosis.id,
// createdAt: currentDiagnosis.createdAt.toISOString(),
// nutrientScores,
// topNutrients,
// lowNutrients,
// differences,
// ) を返す
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` で返ってきた値・データを元に画面に診断履歴詳細を表示
//   ↓
// - 「履歴一覧へ戻る」 の <LinkButton>...</LinkButton> をクリックで `web/app/history/page.tsx`(履歴一覧ページ) へ遷移可能
// - 「マイページへ」 の <LinkButton>...</LinkButton> をクリックで `web/app/mypage/page.tsx`(マイページ) へ遷移可能












// 全体の流れ

// 履歴一覧ページを開く
//   ↓
// `web/app/history/page.tsx`
//   ↓
// 認証
// useSupabaseSession で token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// useSWR(...) で 履歴一覧の情報を管理し、token を元に function fetchDiagnosisHistory(...) を実行
//   ↓
// GET /api/diagnosis/history/route.ts
// /history/page.tsx が token を /api/diagnosis/history へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/history/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// Prismaで user.id で本人の完了済み診断だけ取得(Prisma で userId: user.id の履歴だけ検索)
//   ↓
// scores を score 昇順(score の低い順 = 不足傾向が高い順)で取得
//   ↓
// 不足傾向が高い順で並べたランキングの上位3栄養素(lowNutrients)だけ整形して作成
//   ↓
// 履歴一覧表示に必要な値(histories) を `web/app/history/page.tsx` に返す
//   ↓
// `web/app/history/page.tsx`
//   ↓
// `web/app/history/page.tsx` で data.histories(履歴一覧)を画面に表示
//   ↓
// <Link href={`/history/${history.id}`} key={history.id}>
// 診断履歴詳細のリンクを1つクリックで `web/app/history/[diagnosisId]/page.tsx`(診断履歴詳細ページ) へ遷移可能
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// useParamsで [diagnosisId] を取得
//   ↓
// 認証
// useSupabaseSession で token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// GET /api/diagnosis/history/${diagnosisId}
// `web/app/history/[diagnosisId]/page.tsx` が token を `web/app/api/diagnosis/history/[diagnosisId]/route.ts` へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/history/[diagnosisId]/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// URLの [diagnosisId] から diagnosisId(診断ID) を取得
//   ↓
// 認可
// 今回の診断を diagnosisId + user.id + COMPLETED で本人の完了済み診断に絞り取得
//   ↓
// 前回診断も user.id で本人に絞って取得
//   ↓
// 今回の scores を見やすい配列(栄養素+栄養素ID+点数)に整形(nutrientScores)
//   ↓
// スコア上位3件を作る(topNutrients)
//   ↓
// スコア下位3件を作る(lowNutrients)
//   ↓
// 同じnutrientIdを元に前回との差分を作る(differences)
//   ↓
// 前回データがあるか判定
// ├─ ある → diff を計算
// └─ ない → 前回データなし
//   ↓
// createdAt を toISOString() で文字列にする
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` に 診断履歴詳細を表示するために
// 必要な値(
// success: true,
// id: currentDiagnosis.id,
// createdAt: currentDiagnosis.createdAt.toISOString(),
// nutrientScores,
// topNutrients,
// lowNutrients,
// differences,
// ) を返す
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` で画面に診断履歴詳細を表示










"use client";


import LinkButton from "@/components/ui/LinkButton";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import SafeRadarChart from "@/components/SafeRadarChart";
import type {
  ApiErrorResponse,
  GetDiagnosisHistoryDetailResponse,
} from "@/types/diagnosisApi";
import { PageLoading } from "@/components/ui/PageLoading";


// APIから取得した履歴詳細データの型を定義(成功時だけ使用する型)
type HistoryDetailSuccessResponse = Extract<
  GetDiagnosisHistoryDetailResponse,
  { success: true }
>;


// 履歴詳細ページのコンポーネントを定義
export default function HistoryDetailPage() {
  const router = useRouter();
  // useParams で取得する diagnosisId の型を<{ diagnosisId: string }>() として定義
  // URLの [diagnosisId] を文字列として取り出す
  const params = useParams<{ diagnosisId: string }>();
  // URLの [diagnosisId] から診断IDを取得
  const diagnosisId = params.diagnosisId;

  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  // APIから取得した履歴詳細データを保存するstate
  // 最初はまだ取得していないので null
  const [historyDetail, setHistoryDetail] = useState<HistoryDetailSuccessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchHistoryDetail = async () => {
      // Supabase のログイン確認中は、まだAPIを呼ばない
      if (isSessionLoading) {
        return;
      }

      // token が無い場合、未ログイン扱い のエラー処理
      if (!token) {
        setErrorMessage("ログインが必要です");
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      // diagnosisId が無い場合のエラー処理
      if (!diagnosisId) {
        setErrorMessage("診断IDがありません");
        setIsLoading(false);
        return;
      }

      try {
        // 新しいIDで取得し直すときにもう一度読み込み中にする
        setIsLoading(true);
        // 前回のエラー表示を必ず消す
        setErrorMessage("");
        // 前回表示していた診断詳細を必ず消す
        setHistoryDetail(null);

        // token付きで履歴詳細APIを呼ぶ
        // - フロント側(web/app/history/[diagnosisId]/page.tsx) が
        // GET /api/diagnosis/history/${diagnosisId} で Authorization ヘッダー に Bearer token 付きで、
        // API側(web/app/api/diagnosis/history/[diagnosisId]/route.ts) に送り、呼び出す。
        // - API側で Authorizationヘッダーからtokenを検証し取得した diagnosisId + userId で本人の診断だけ確認し、取得する為の構成
        // そして、フロントに 本人の履歴詳細データだけを返す
        const response = await fetch(`/api/diagnosis/history/${diagnosisId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        // APIから返ってきたJSONを読み取る
        const responseData: GetDiagnosisHistoryDetailResponse = await response.json();

        // HTTP処理がエラーの場合
        // - エラー時の data の形は { success: false, message: "エラーメッセージ" } なので、ApiErrorResponse 型として扱い、エラーmessage を表示する 
        if (!response.ok) {
          const errorData = responseData as ApiErrorResponse;
          setErrorMessage(errorData.message ?? "履歴詳細の取得に失敗しました");
          return;
        }
        

        // API処理がエラーの場合の処理
        if (!responseData.success) {
          setErrorMessage(responseData.message ?? "履歴詳細の取得に失敗しました");
          return;
        }

        // responseData.success を確認しているので setHistoryDetail(responseData) には成功データだけ入る
        setHistoryDetail(responseData);
      } catch (error) {
        console.error("failed to fetch history detail:", error);
        setErrorMessage("履歴詳細の取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryDetail();
  }, [diagnosisId, token, isSessionLoading, router]);

  // API取得中・ログイン確認中の表示
  if (isSessionLoading || isLoading) {
    return <PageLoading />;
  }

  // エラー時のメッセージ表示
  if (errorMessage) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">
          履歴詳細
        </h1>

        <p className="text-red-600">
          {errorMessage}
        </p>

        {/* API 処理ではなく、行き先が固定された通常のページ移動のため、<LinkButton></LinkButton> で遷移する */}
        <LinkButton href="/history">
          履歴一覧へ戻る
        </LinkButton>
      </main>
    );
  }

  // 読み込み完了後、履歴詳細データが無い場合のエラー表示
  if (!historyDetail) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
        <h1 className="text-2xl font-bold">
          履歴詳細
        </h1>

        <p>履歴詳細が見つかりません。</p>

        {/* API 処理ではなく、行き先が固定された通常のページ移動のため、<LinkButton></LinkButton> で履歴一覧ページへ遷移する */}
        <LinkButton href="/history">
          履歴一覧へ戻る
        </LinkButton>
      </main>
    );
  }
  
  // APIから来るデータ(nutrientScores)をチャート用のデータ形(ranking 形式)に変換
  // - nutrientId はそのまま SafeRadarChart に渡す。
  // - nutrient はそのまま SafeRadarChar に渡す。
  // - item.score を ranking.score として、SafeRadarChart に渡す。

  // - 変換の流れ

  // APIの nutrientScores
  // nutrientScores[].score
  // ↓
  // チャート用 ranking のために、item.score を ranking[].score に変換
  // ranking[].score
  // ↓
  // SafeRadarChartに ranking を渡す

  const ranking = historyDetail.nutrientScores.map((item) => ({
    nutrientId: item.nutrientId,
    nutrient: item.nutrient,
    score: item.score,
  }));


  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        履歴詳細
      </h1>

      {/* 日付表示 */}
      {/* API側から toISOString() で文字列で返ってくるので new Date(...) で日付表示に変換 */}
      <p>
        診断日: {new Date(historyDetail.createdAt).toLocaleDateString("ja-JP")}
      </p>

      {/* 栄養素スコアチャート */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold">
          栄養素スコアチャート
        </h2>

        <SafeRadarChart ranking={ranking} />
      </section>

      {/* 全栄養素のスコアを1件ずつ表示 */}
      <section className="mt-6">
        <h2>栄養素スコア一覧</h2>

        {historyDetail.nutrientScores.length === 0 ? (
          <p>栄養素スコアがありません。</p>
        ) : (
          <ul>
            {historyDetail.nutrientScores.map((nutrientScore) => (
              <li key={nutrientScore.nutrientId}>
                {nutrientScore.nutrient} : {nutrientScore.score}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 満たせている上位3件 */}
      <section className="mt-6">
        <h2>満たせている栄養素 上位3件</h2>
        {historyDetail.topNutrients.length === 0 ? (
          <p>表示できる栄養素がありません。</p>
        ) : (
          <ul>
            {historyDetail.topNutrients.map((score) => (
              <li key={score.nutrientId}>
                {score.nutrient} : {score.score}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 不足傾向の下位3件 */}
      <section className="mt-6">
        <h2>不足傾向の栄養素 下位3件</h2>

        {historyDetail.lowNutrients.length === 0 ? (
          <p>表示できる栄養素がありません。</p>
        ) : (
          <ul>
            {historyDetail.lowNutrients.map((score) => (
              <li key={score.nutrientId}>
                {score.nutrient} : {score.score}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 各栄養素の前回との差分 */}
      <section className="mt-6">
        <h2>前回との差分</h2>

        {historyDetail.differences.length === 0 ? (
          <p>前回との差分データがありません。</p>
        ) : (
          <ul>
            {historyDetail.differences.map((item) => (
              <li key={item.nutrientId}>
                {item.nutrient} : 今回 {item.current} / 前回{" "}
                {item.previous ?? "なし"} / {item.diffLabel}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/*  
        LinkButton でページ遷移を可能にする
        - あらかじめ行き先が決まっている通常ページ移動のため LinkButton を使用する
      */}
      <nav
        aria-label="履歴詳細の移動"
        className="mt-8 flex flex-wrap gap-3"
      >
        {/* 履歴一覧へ遷移できる導線(<LinkButton>...</LinkButton>) を置く */}
        {/* primary: 主ボタン */}
        <LinkButton href="/history">
          履歴一覧へ戻る
        </LinkButton>

        {/* マイページへの遷移できる導線(<LinkButton>...</LinkButton>) を置く */}
        {/* secondary: 副ボタン */}
        <LinkButton href="/mypage" variant="secondary">
          マイページへ
        </LinkButton>
      </nav>
    </main>
  );
}