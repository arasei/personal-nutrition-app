// web/app/history/[diagnosisId]/page.tsx


// 全体の概要
// - ログイン中ユーザー本人の診断履歴詳細を表示するページ
// - ログイン中ユーザーの token と URL の [diagnosisId] を使い、履歴詳細API を呼び出す。
// - 診断日・チャート・全栄養スコア一覧・満たせている上位3栄養素・不足傾向の下位3栄養素・前回差分 を表示するページ




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


// 注意点
// - このページは SWR ではなく、useEffect と useState で 履歴詳細取得、表示 に 必要なデータを管理する
// - requestKey は 表示対象が正しいかを確認するために必要であり、サーバー側で認証の代わりとして使用するものではない。
// - token や requestKey を画面・ログ へ出力しない
// - このページでは APi側の認証・所有者確認・DB処理 は変更しない。



// 古くなった取得結果への対策
// - 取得結果と、その取得条件を表すrequestKey を一緒に保存する
// - 現在の requestKey と一致する データ・エラー だけを表示する。
// - 依存値([diagnosisId・token・isSessionLoading・requestKey]) の変更(データ取得条件) や 画面離脱 が行われた場合、
// 古い取得処理・通信を無効にする
// - 未ログイン時は履歴詳細を表示せず、ログインページへ遷移する。









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
import Card from "@/components/ui/Card";


// APIから取得する 履歴詳細データの型 を定義
// - 成功時に取得し、使用するデータの型
type HistoryDetailSuccessResponse = Extract<
  GetDiagnosisHistoryDetailResponse,
  { success: true }
>;

// 指定した条件に対応する取得結果だけを表示するための 型を定義
// - API から取得した履歴詳細データ と 取得条件を表すキー の組み合わせ
type HistoryDetailState = {
  key: string;
  data: HistoryDetailSuccessResponse | null;
  errorMessage: string;
};


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



  // 履歴詳細データ の取得条件を定義
  // - 同じ診断IDでも、token が変われば別の取得として扱う
  // - token や 診断ID が変わった時点で、それ以前の結果は表示対象から外れる
  // 成功データだけでなく以前のエラーメッセージも引き継がないし、表示対象から外れる
  const requestKey = token && diagnosisId ? JSON.stringify([diagnosisId, token]) : null;

  // APIから取得した 指定した表示条件にあてはまる履歴詳細データ を保存するstate
  // - 最初はまだ取得していないので null
  const [resultState,setResultState] = useState<HistoryDetailState | null>(null);

  // 現在の取得条件(requestKey)と一致する結果だけ表示対象とする
  // - 過去の条件で取得したデータ・エラーは使用しない

  // resultState.key
  // - 現在、保存されている取得結果に対して指定した取得条件 のキー
  // - 現在の requestKey と一致する場合だけ取得した履歴詳細データを表示対象にする
  const currentResult = requestKey && resultState?.key === requestKey ? resultState : null;

  const historyDetail = currentResult?.data ?? null;

  // URL の不正を優先し、次に現在の取得条件のエラー表示する
  const errorMessage = !diagnosisId ? "診断IDがありません" : currentResult?.errorMessage ?? "";

  // 読み込み中表示
  // - 取得条件は揃っているが、現在の条件に対応する成功・失敗の結果がまだない場合の表示。
  const isLoading = requestKey !== null && currentResult === null;





  // 履歴詳細を表示する
  // - diagnosisId・token・isSessionLoading・requestKey が変わった時、現在の条件で
  // API取得を実行し、履歴詳細データを取得し、表示する
  useEffect(() => {
     // 以下の場合、API を呼ばず処理中止。履歴詳細を表示しない。
    // - Supabase がログイン状態を確認中(isSessionLoading)
    // - token がないため未ログイン(!token)
    // - 診断ID が存在しない、確認できない(!diagnosisId)
    // - 指定した取得条件にあてはまらず、requestKey が作られていない(!requestKey)
    if (isSessionLoading || !token || !diagnosisId || !requestKey) {
      return;
    }

    // 不要な通信の中止を管理するオブジェクトを作る処理
    const controller = new AbortController();

    // この useEffect 内で開始した取得処理が、現在も有効かの状態 を管理する
    // - 古い処理による state更新を止めるため
    // - 最初は 有効状態(true)
    let isActive = true;

    const fetchHistoryDetail = async () => {
      try {
        // token付きで履歴詳細API(web/app/api/diagnosis/history/[diagnosisId]/route.ts)を呼ぶ
        // - フロント側(web/app/history/[diagnosisId]/page.tsx) が
        // GET /api/diagnosis/history/${diagnosisId} で Authorization ヘッダー に Bearer token 付きで、
        // API側(web/app/api/diagnosis/history/[diagnosisId]/route.ts) に送り、呼び出す。
        // - API側で Authorizationヘッダーからtokenを検証し取得した diagnosisId + userId で本人の診断だけ確認し、取得する為の構成
        // そして、フロントに 本人の履歴詳細データだけを返す
        const response = await fetch(`/api/diagnosis/history/${encodeURIComponent(diagnosisId)}`,
          {
            method: "GET",
            headers: {Authorization: `Bearer ${token}`},
            cache: "no-store",
            // ブラウザ側で、このfetchに中止通知を受け取らせるための設定
            // - API側の検索条件や認証条件ではない
            // - 中止を指示する側(controller) と その通知を受け取る通信(fetch) を結びつける
            signal: controller.signal,
          },
        );

        // APIから返ってきたJSONを読み取る
        const responseData: GetDiagnosisHistoryDetailResponse = await response.json();

        // 履歴詳細データ取得が不要の状態の場合(認証変更・診断ID変更・画面離脱)は、結果を採用しない。
        // - 古い認証状態・診断・質問に対する結果は採用しない。
        if (!isActive) {
          return;
        }

        // API処理がエラーの場合の処理
        // - success: false を確認すると、エラーレスポンス型に絞り込まれる。
        // - JSON全体の形式を検証する仕組みではない。
        // response.json() に型を付けるだけで、すべての項目が実行時に保証されるわけではない

        if (!responseData.success) {
          const errorData: ApiErrorResponse = responseData;

          throw new Error(
            errorData.message ?? "履歴詳細の取得に失敗しました",
          );
        }

        // HTTP処理がエラーの場合の処理
        if (!response.ok) {
          throw new Error("履歴詳細の取得に失敗しました")
        }

        // API処理(responseData.success) と HTTP処理 の成功を確認済みなので setResultState の data: には成功データ(responseData)だけ入る
        // - 取得成功した 履歴詳細データ を 指定した取得条件(requestKey) と一緒に保存する
        setResultState({
          key: requestKey,
          data: responseData,
          errorMessage: "",
        });
      } catch (error) {
        // 認証変更・診断ID変更・画面離脱 により 履歴詳細データ取得 が不要になった場合の、
        // 古い処理のエラー や 通信中止についてのエラーは 画面に表示しない。
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setResultState({
          key: requestKey,
          data: null,
          errorMessage: error instanceof Error ? error.message : "履歴詳細の取得に失敗しました"
        });
      }
    };

    // 関数 fetchHistoryDetail() を実行
    // - 実行した関数が返す値(Promise)をここでは使用しない
    // - fetchHistoryDetail は async関数なので、呼び出すとPromise を返す
    // - 取得結果は関数の戻り値から受け取らず、関数内の setResultState() で保存しています。
    // そのため、呼び出し元では戻り値を使わない。

    // void
    // - void は式を評価し、その式全体の値を undefined にします。

    // void は、以下の処理は行わない。
    // - エラーを処理する。
    // - 通信を中止する。
    // - 処理が終わるまで待つ。
    // - 非同期関数の実行を省略する。
    void fetchHistoryDetail();


    // 条件変更による再実行前 または 画面離脱時 に古い取得を無効にする
    // - 以下の return () => {...} は、依存値の変更による再実行前、または画面離脱時に実行する
    // - 診断結果詳細のデータ取得 の通信が不要になるため中止する
    // 通信の成功・失敗だけを理由に実行する処理ではない
    // - 依存値(データの 取得が完了 or 取得失敗 or 取得中にページ遷移 or 取得中にページを閉じた など)の変更による履歴詳細データ取得再実行前、アンマウント時に古いデータ取得・通信処理 無効処理
    // - 古い処理による state 更新を防ぎ、通信中なら中止する
    // - 通信の成功・失敗だけを理由に実行される処理ではない
    return () => {

      // 古い処理が、画面の state を更新しないようにする
      isActive = false;

      // まだ通信中なら不要になるため通信を中止する
      // - 対応する fetch や レスポンス本文の読み取りを中止できる
      // - signal を fetch へ渡さなければ、そのcontroller でこの fetch を中止できない
      controller.abort();

    };
  }, [diagnosisId, token, isSessionLoading, requestKey]);


  // 認証確認完了後、未ログインの場合の処理
  // - 未ログインの場合の遷移は、履歴詳細データ取得とは分けて行う
  useEffect(() => {
    // 認証確認後、未ログインならログインページへ遷移する
    if (!isSessionLoading && !token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);

  // ログイン状態確認中 or 未ログイン or 履歴詳細取得中 の場合の表示

  // isSessionLoading
  // - Supabase認証確認中
  if (isSessionLoading) {
    return <PageLoading />;
  }

  // !token
  // - 未ログイン
  // - ページ遷移完了するまでの間、履歴詳細を表示しない
  if (!token) {
    return (
      <PageLoading message="ログインページへ移動しています..." />
    );
  }

  // isLoading
  // - 履歴詳細API取得中
  if (isLoading) {
    return <PageLoading />
  }

  // API取得エラー・診断ID不足・データなし の場合のエラーメッセージ表示
  if (errorMessage || !historyDetail) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <header>
          <p className="text-sm font-medium text-muted">
            診断履歴
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            履歴詳細
          </h1>
        </header>

        <ErrorMessage>
          {errorMessage || "履歴詳細が見つかりません。"}
        </ErrorMessage>

        {/* API 処理ではなく、行き先が固定された通常のページ移動のため、<LinkButton></LinkButton> で遷移する */}
        <nav aria-label="履歴詳細エラー時の移動">
          <LinkButton href="/history" variant="text">
            履歴一覧へ戻る
          </LinkButton>
        </nav>
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
        <p className="text-sm font-medium text-muted">
          診断履歴
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          履歴詳細
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          過去の診断結果と、前回からの変化を確認できます。
        </p>
      </header>

      <div className="mt-6">
        {/* 日付表示 */}
        <p className="text-sm text-muted">
          診断日
        </p>

        {/* API側から toISOString() で文字列で返ってくるので new Date(...) で日本語の日付表示に変換 */}
        {/*
          time を使う理由
          - 画面には日本語の日付を表示しつつ、HTML上では「これは日時を表している」と伝えられる。
         */}
        <time
          dateTime={historyDetail.createdAt}
          className="mt-1 block font-semibold text-foreground"
        >
          {new Date(historyDetail.createdAt).toLocaleDateString("ja-JP")}
        </time>
      </div>

      {/* 栄養素スコアチャート */}
      {/*
        section と Card は役割が違うため、section の内側へ Card を配置する

        section
        - 内容の意味を表す
        Card
        - 見た目を表す
      */}
      <section
        className="mt-8"
        aria-labelledby="history-score-chart-heading"
      >
        <Card>
          <h2
            id="history-score-chart-heading"
            className="text-xl font-bold text-foreground"
          >
            栄養素スコアチャート
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            診断時の各栄養素のスコアを確認できます。
          </p>

          <div className="mt-6">
            <SafeRadarChart ranking={ranking} />
          </div>
        </Card>
      </section>

      {/* 全栄養素のスコアを1件ずつ表示 */}
      <section
        className="mt-6"
        aria-labelledby="nutrient-scores-heading"
      >
        <Card>
          <div className="mb-4">
            <h2
              id="nutrient-scores-heading"
              className="text-xl font-bold text-foreground"
            >
              栄養素スコア一覧
            </h2>

            <p className="mt-2 text-sm text-muted">
              診断時の各栄養素のスコアです。
            </p>
          </div>

          {historyDetail.nutrientScores.length === 0 ? (
            <p className="text-sm text-muted">
              栄養素スコアがありません。
            </p>
          ) : (
            <div className="divide-y divide-border">
              {historyDetail.nutrientScores.map((nutrientScore) => (
                <div
                  key={nutrientScore.nutrientId}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <span className="text-sm text-foreground">
                    {nutrientScore.nutrient}
                  </span>

                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {nutrientScore.score}点
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>


      {/* 満たせている栄養素 上位3件 */}
      <section
        className="mt-6"
        aria-labelledby="top-nutrients-heading"
      >
        <Card>
          <div className="mb-4">
            <h2
              id="top-nutrients-heading"
              className="text-xl font-bold text-foreground"
            >
              満たせている栄養素
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              スコアが高い栄養素 上位3件です。
            </p>
          </div>

          {historyDetail.topNutrients.length === 0 ? (
            <p className="text-sm text-muted">
              表示できる栄養素がありません。
            </p>
          ) : (
            <div className="space-y-3">
              {historyDetail.topNutrients.map((score, index) => (
                <div
                  key={score.nutrientId}
                  className="flex items-center justify-between gap-4 rounded-xl bg-background p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-primary">
                      {index + 1}
                    </span>

                    {/*
                      min-w-0
                      - 栄養素名が長い場合に、右側のスコアを画面外へ押し出さないため
                      - 320px表示 に対応するため
                    */}
                    <span className="min-w-0 text-sm font-medium text-foreground">
                      {score.nutrient}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {score.score}点
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>


      {/* 不足傾向の栄養素 下位3件 */}
      <section
        className="mt-6"
        aria-labelledby="low-nutrients-heading"
      >
        <Card>
          <div className="mb-4">
            <h2
              id="low-nutrients-heading"
              className="text-xl font-bold text-foreground"
            >
              不足傾向の栄養素
            </h2>

            <p className="mt-2 text-sm text-muted">
              スコアが低い栄養素 下位3件です。
            </p>
          </div>

          {historyDetail.lowNutrients.length === 0 ? (
            <p className="text-sm text-muted">
              表示できる栄養素がありません。
            </p>
          ) : (
            <div className="space-y-3">
              {historyDetail.lowNutrients.map((score, index) => (
                <div
                  key={score.nutrientId}
                  className="flex items-center justify-between gap-4 rounded-xl bg-background p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-primary">
                      {index + 1}
                    </span>

                    {/*
                      min-w-0
                      - 栄養素名が長い場合に、右側のスコアを画面外へ押し出さないため
                      - 320px表示 に対応するため
                    */}
                    <span className="min-w-0 text-sm font-medium text-foreground">
                      {score.nutrient}
                    </span>
                  </div>

                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {score.score}点
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/*
        各栄養素の前回との差分表示
        - API側、正確には buildScoreDifference.ts 側で作った diffLabel を受け取り、表示している
      */}
      <section
        className="mt-6"
        aria-labelledby="score-differences-heading"
      >
        <Card>
          <div className="mb-4">
            <h2
              id="score-differences-heading"
              className="text-xl font-bold text-foreground"
            >
              前回との差分
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              前回の診断結果との変化を確認できます。
            </p>
          </div>

          {historyDetail.differences.length === 0 ? (
            <p className="text-sm text-muted">
              前回との差分データがありません。
            </p>
          ) : (
            <div className="divide-y divide-border">
              {historyDetail.differences.map((item) => (
                <div
                  key={item.nutrientId}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item.nutrient}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      今回 {item.current} / 前回{" "}{item.previous ?? "なし"}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-muted">
                    {item.diffLabel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
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
