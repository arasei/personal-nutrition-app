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
// buildScoreDifference.ts で前回データの有無を判定し、計算
// ├─ ある → diff / diffLabel を計算し、作成
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
import ErrorMessage from "@/components/ui/ErrorMessage";


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

  // ログイン確認中 の場合のメッセージ表示
  if (isSessionLoading) {
    return (
      <PageLoading message="ログイン情報を確認中です..." />
    );
  }
  
  // API取得中 の場合のメッセージ表示
  if (isLoading) {
    return (
      <PageLoading message="履歴詳細を読み込み中です..." />
    );
  }

  // API取得エラー の場合のエラーメッセージ表示
  if (errorMessage) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold">
          履歴詳細
        </h1>

        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>

        {/* API 処理ではなく、行き先が固定された通常のページ移動のため、<LinkButton></LinkButton> で遷移する */}
        <LinkButton href="/history">
          履歴一覧へ戻る
        </LinkButton>
      </main>
    );
  }

  // API取得完了後、履歴詳細データが存在しない場合のエラーメッセージ表示
  if (!historyDetail) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-bold">
          履歴詳細
        </h1>

        <ErrorMessage>
          履歴詳細が見つかりません。
        </ErrorMessage>

        {/* API 処理ではなく、行き先が固定された通常のページ移動のため、<LinkButton></LinkButton> で履歴一覧ページへ遷移する */}
        <LinkButton href="/history">
          履歴一覧へ戻る
        </LinkButton>
      </main>
    );
  }
  
  // APIから来るデータ(nutrientScores)をチャート用のデータ形(ranking 形式)に変換
  // - nutrientId はそのまま SafeRadarChart に渡す。
  // - nutrient はそのまま SafeRadarChart に渡す。
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
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-gray-500">
          診断履歴
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          履歴詳細
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
          過去の診断結果と、前回からの変化を確認できます。
        </p>
      </header>

      <div className="mt-6">
        {/* 日付表示 */}
        <p className="text-sm text-gray-500">
          診断日
        </p>

        {/* API側から toISOString() で文字列で返ってくるので new Date(...) で日付表示に変換 */}
        <p className="mt-1 font-semibold text-gray-900">
          {new Date(historyDetail.createdAt).toLocaleDateString("ja-JP")}
        </p>
      </div>

      {/* 栄養素スコアチャート */}
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
            栄養素スコアチャート
          </h2>

          <p className="mt-1 text-sm leading-6 text-gray-600">
            診断時の各栄養素のスコアを確認できます。
          </p>
        </div>

        <div className="mt-4">
          <SafeRadarChart ranking={ranking} />
        </div>
      </section>

      {/* 全栄養素のスコアを1件ずつ表示 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            栄養素スコア一覧
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            診断時の各栄養素のスコアです。
          </p>
        </div>


        {historyDetail.nutrientScores.length === 0 ? (
          <p className="text-sm text-gray-600">
            栄養素スコアがありません。
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {historyDetail.nutrientScores.map((nutrientScore) => (
              <div
                key={nutrientScore.nutrientId}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-sm text-gray-700">
                  {nutrientScore.nutrient}
                </span>

                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {nutrientScore.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 満たせている栄養素 上位3件 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            満たせている栄養素
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            スコアが高い栄養素 上位3件です。
          </p>
        </div>

        {historyDetail.topNutrients.length === 0 ? (
          <p className="text-sm text-gray-600">
            表示できる栄養素がありません。
          </p>
        ) : (
          <div className="space-y-3">
            {historyDetail.topNutrients.map((score, index) => (
              <div
                key={score.nutrientId}
                className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-700">
                    {index + 1}
                  </span>

                  <span className="text-sm font-medium text-gray-900">
                    {score.nutrient}
                  </span>
                </div>

                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {score.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* 不足傾向の栄養素 下位3件 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            不足傾向の栄養素
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            スコアが低い栄養素 下位3件です。
          </p>
        </div>

        {historyDetail.lowNutrients.length === 0 ? (
          <p className="text-sm text-gray-600">
            表示できる栄養素がありません。
          </p>
        ) : (
          <div className="space-y-3">
            {historyDetail.lowNutrients.map((score, index) => (
              <div
                key={score.nutrientId}
                className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-gray-700">
                    {index + 1}
                  </span>

                  <span className="text-sm font-medium text-gray-900">
                    {score.nutrient}
                  </span>
                </div>

                <span className="shrink-0 text-sm font-semibold text-gray-900">
                  {score.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/*
        各栄養素の前回との差分表示
        - API側、正確には buildScoreDifference.ts 側で作った diffLabel を受け取り、表示している
      */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            前回との差分
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            前回の診断結果との変化を確認できます。
          </p>
        </div>

        {historyDetail.differences.length === 0 ? (
          <p className="text-sm text-gray-600">
            前回との差分データがありません。
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {historyDetail.differences.map((item) => (
              <div
                key={item.nutrientId}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {item.nutrient}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    今回 {item.current} / 前回 {item.previous ?? "なし"}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-medium text-gray-600">
                  {item.diffLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/*  
        LinkButton でページ遷移を可能にする
        - あらかじめ行き先が決まっている通常ページ移動のため LinkButton を使用する
      */}
      <nav
        aria-label="履歴詳細の移動"
        className="mt-10 flex flex-col gap-3 sm:flex-row"
      >
        {/* 履歴一覧へ遷移できる導線(<LinkButton>...</LinkButton>) を置く */}
        {/* primary: 主ボタン */}
        <LinkButton
          href="/history"
          className="w-full sm:w-auto"
        >
          履歴一覧へ戻る
        </LinkButton>

        {/* マイページへの遷移できる導線(<LinkButton>...</LinkButton>) を置く */}
        {/* secondary: 副ボタン */}
        <LinkButton
          href="/mypage"
          variant="secondary"
          className="w-full sm:w-auto"
        >
          マイページへ
        </LinkButton>
      </nav>
    </main>
  );
}