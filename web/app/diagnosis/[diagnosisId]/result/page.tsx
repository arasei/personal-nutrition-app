// web/app/diagnosis/[diagnosisId]/result/page.tsx

// 全体の概要
// - URL の diagnosisId と Supabase の token を使って、
// 結果取得API(`web/app/api/diagnosis/[diagnosisId]/result/route.ts`) を呼び出し、
// 診断結果をチャートとランキングで表示するページ
// - URLから diagnosisId を取得し、結果取得APIを呼んで、
// 受け取った診断結果をチャートとランキング一覧で表示する




// 認証・認可について
// - Supabase session から access_token を取得し、
// Authorization header に token を付けて結果取得APIを呼び出す。
// - API側では token から user.id を取得し、
// diagnosisId がログイン中ユーザー本人の診断か確認する







// SWR について

// fetch("api/diagnosis/start", ...)
// - 呼び出すAPI が毎回固定なので、URL を直接書いている

// fetch(url, ...)
// - SWR から受け取ったAPI を使うため、毎回違う[diagnosisId] であるので url という変数にしている

// 例.
// useSWR(
//   shouldFetch ? `/api/diagnosis/${diagnosisId}/result` : null,
//   fetcher
// );

// ここでSWRに渡しているURLは、例えばこうなります。
// 例.
// diagnosisId = abc123
// /api/diagnosis/abc123/result

// - SWRは、そのURLを fetcher の引数として渡します。
// const fetcher = async (url: string) => {
// の url には、実際には以下が入ります。
// /api/diagnosis/abc123/result

// - そのため、
// const response = await fetch(url, {...}
// は、実質こう書いているのと同じです。
// const response = await fetch(
//   `/api/diagnosis/${diagnosisId}/result`,
//   {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   }
// );

// - SWRの流れ
// diagnosisId
// ↓
// abc123
// ↓
// SWR のキーを作る
// ↓
// / api / diagnosis / abc123 / result
// ↓
// SWR が fetcher(url) を呼ぶ
// ↓
// url = "/api/diagnosis/abc123/result"
// ↓
// fetch(url) でAPIを呼ぶ


// なぜ url にするのか
// - SWR では、「APIのURL」と「取得関数」を分ける書き方をする
// 例.
// useSWR(APIのURL,データ取得関数);

// - このファイルの場合
// useSWR(
//   `/api/diagnosis/${diagnosisId}/result`,
//   fetcher
// );

// と書くことで、fetcher は「渡されたURLへGETする共通関数」になる
// 以下のように書ける

// const fetcher = async (url: string) => {
//   return fetch(url);
// };










// ポイント
// - フロント側は token を Authorization header に入れてAPIを呼ぶ
// - SWR を使うことで、毎回変わる可能性がある [diagnosisId] にある diagnosisId を元に URL を作成している。
// そして、useSWR(...) 内で作成した取得関数を使い、その中で、URL を呼び出している
// - API側は supabase.auth.getUser(token) で本人確認する
// - session 取得は毎回 getSession せず useSupabaseSession で行う






// 役割
// - URLから diagnosisId を取る
// - tokenをAPIに渡す
// - APIから診断結果を受け取る
// - 画面に表示する



// - このファイル内の流れ

// `web/app/diagnosis/[diagnosisId]/result/page.tsx`
//   ↓
// page.tsx が URL から diagnosisId を取得
//   ↓
// 認証
// useSupabaseSession で token を取得し、ログイン確認
//   ↓
// token と diagnosisId が揃ったら SWR が動く
//   ↓
// useSWR(APIのURL,データ取得するための共通関数) として指定する。
// 指定したデータの取得するための共通関数(fetcher) として作成。
//   ↓
// const fetcher(共通関数) の中で、fetch(url) とすることで、
// GET /api/diagnosis/[diagnosisId]/result を行う
// API(`web/app/api/diagnosis/[diagnosisId]/result.route.ts`) を呼ぶ
// API が毎回違うため、SWR を使用している
//   ↓
// `web/app/api/diagnosis/[diagnosisId]/result.route.ts`
//   ↓
// API側 で Authorization header に token を受け取る
//   ↓
// API側で supabase.auth.getUser(token) で token を検証
//   ↓
// user.id と diagnosisId で本人の診断だけ取得
//   ↓
// ranking / diffranking を作成
//   ↓
// JSON形式で本人の診断結果だけフロント(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)に返す
//   ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx`
//   ↓
// フロント側が画面にチャートとランキングを表示
//   ↓
// 「今回の履歴詳細を見る」・「マイページ」 の<Link>...</Link> から
// `web/app/history/[diagnosisId]/page.tsx`・`web/app/mypage/page.tsx` へ遷移可能





// 全体の流れ

// AnswerForm.tsx に結果ページURL を返す
// ↓
// `web/app/api/diagnosis/answers/route.ts` から返ってきた nextHref に router.push で遷移
// 次の質問ページ(`web/app/diagnosis/step/[step]/page.tsx`) 
// or
// 結果ページ(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx`
// ↓
// useParams で URL から diagnosisId を取得
// ↓
// useSupabaseSession で token(ログイン状態) を取得
// ↓
// token と diagnosisId が揃ったら SWR が動かす
// ↓
// SWR で作成した、fetcher(指定したデータの取得するための共通関数) で `/api/diagnosis/[diagnosisId]/result` を呼ぶ
// ↓
// `web/app/api/diagnosis/[diagnosisId]/result/route.ts`
// ↓
// GET /api/diagnosis/[diagnosisId]/result
// ↓
// 認証
// getAuthenticatedUser(request) で token を検証し、ログイン中ユーザーかどうかを確認し、取得
// ↓
// ログイン中ユーザー情報を取得後、user.id を取得し、使用可能
// ↓
// 認可
// Prismaで diagnosisId + user.id で本人の診断かどうかを確認
// ↓
// URL の [id] から params で診断ID(diagnosisId) を取得
// ↓
// diagnosisId + user.id + COMPLETED で本人の診断だけ取得
// ↓
// 栄養素スコアランキング(ranking) 作成
// ↓
// 前回診断スコア(previousDiagnosis) を取得
// ↓
// 前回との差分(diffRanking) 作成
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx` に ranking / diffRanking を返す(本人の診断結果をJSON形式で返す)
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx` で画面に診断結果(チャート と ランキング) を表示





"use client";

import LinkButton from "@/components/ui/LinkButton";
import useSWR from "swr";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import SafeRadarChart from "@/components/SafeRadarChart";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
// APIから受け取る診断結果データの型を読み込む
import type {
  DiagnosisResultResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { PageLoading } from "@/components/ui/PageLoading";


// DiagnosisResultResponse には成功時のデータと失敗時のデータの両方が入る可能性がある
// DiagnosisResultResponse の中から success: true の型(成功時のデータ)だけを取り出す
type DiagnosisResultSuccessResponse = Extract<
  DiagnosisResultResponse,
  { success: true }
>;



// このページはブラウザ側で動くので、最初に await で止まる形ではなく、
// いったん画面を返してから useEffect でデータを取りに行く流れ
// 後でstateを更新する形
export default function ResultPage() {
  // URLの [diagnosisId] を取得する
  const params = useParams<{ diagnosisId: string }>();
  const router = useRouter();
  // URLから診断IDを取り出す
  const diagnosisId = params.diagnosisId;

  // ログイン中の token と ログイン状態を確認中かどうかを取得する(ログイン確認)
  // - session 取得処理をページごとに書かず、共通フックにまとめて実行
  // - SWR にも isLoading があるため、名前がぶつからないように useSupabaseSession の isLoading は isSessionLoading と名前を変える
  const { token, isLoading: isSessionLoading } = useSupabaseSession();

  // SWR を使い API を呼びだす
  // - この関数の中で SWR で指定したURL(url) を fetch(url)を行い、取得し、API を呼び出し、結果を処理する
  const fetcher = async (url: string): Promise<DiagnosisResultSuccessResponse> => {
    // token が無い場合、未ログイン扱い
    if (!token) {
      throw new Error("ログインが必要です");
    }

    // 取得した token(access_token) に Bearer を付けて Authorization header に入れて API を呼び出す。
    // - useSupabaseSession.ts が返している token は access_token だけなので、
    // フロント側でAPIへ送る時は 「Bearer 」 を付ける必要がある
    // - API側の getAuthenticatedUser.ts が期待している形は以下の状態のため
    // Authorization: `Bearer ${token}`
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store", // 結果は毎回最新のものを見たいのでキャッシュしない
    });

    // API から返ってきたレスポンスをJSONとして取得
    const responseData: DiagnosisResultResponse = await response.json();

    // HTTP処理がエラーの場合の処理
    if (!response.ok) {
      const errorData = responseData as ApiErrorResponse;
      throw new Error(errorData.message ?? "結果取得に失敗しました");
    }

    // API処理がエラーの場合の処理
    if (!responseData.success) {
      throw new Error(responseData.message ?? "結果取得に失敗しました");
    }

    // 成功時のデータだけをSWRに返す
    return responseData;
  };

  // session の読み込みが終わっている・token がある・diagnosisId がある
  // この3つの条件が揃ったときだけAPIを呼び出す
  const shouldFetch = !isSessionLoading && !!token && !!diagnosisId;

  // token がまだ無い・diagnosisId がまだ無い・ログイン確認中 の時はAPIを呼び出さない
  // - 条件が揃っているときだけAPI を呼び出す
  // - SWR は 第1引数に null を渡すと API を呼び出さないので、shouldFetch が false のときは null を渡してAPI呼び出しを止める
  const {
    data,
    error,
    isLoading,
  } = useSWR(
    shouldFetch ? `/api/diagnosis/${diagnosisId}/result` : null,
    fetcher
  );


  // session 確認後、token が無ければログインページへ遷移する
  // useEffect で、未ログイン時の場合のリダイレクト処理を行う
  useEffect(() => {

    if (!isSessionLoading && !token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);

  // 読み込み中の時の表示
  if (isSessionLoading || isLoading) {
    return <PageLoading />;
  }

  // diagnosisIdがない・エラー・データがない場合の表示
  if (!diagnosisId) {
    return <div>診断IDが見つかりません</div>;
  }

  // tokenがない場合はログインページへ移動する
  if (!token) {
    return <div>ログインページへ移動中...</div>;
  }

  // エラー時の表示
  if (error) {
    return <div>{error.message}</div>;
  }

  // データがない場合の表示
  if (!data) {
    return <div>結果データがありません</div>;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1>診断結果</h1>

      <section>
        <h2>栄養素バランス</h2>
        {/* API から受けとった ranking を SafeRadarChart へ渡し、レーダーチャートを描画する。 */}
        <SafeRadarChart ranking={data.ranking} />
      </section>

      <section>
        {/* 順位・栄養素名・今回の点数を表示 */}
        <h2>不足しやすい栄養素ランキング</h2>

        {/* 前回との差分付きランキング */}
        {/* diffRanking の配列を1件ずつ取り出して表示 */}
        {data.diffRanking.map((item, index) => (
          <div key={item.nutrientId}>
            {/* index は 0から始まるので 「+ 1」をする */}
            {index + 1}位 {item.nutrient} {item.score}点
            {/* 前回との差分がある場合だけ表示 */}
            {/* プラスの時は「+」、マイナスの時は「-」を表示 */}
            {item.diff !== null && (
              <span>
                {" "}
                (前回 {item.diff > 0 ? "+" : ""}
                {item.diff})
              </span>
            )}
          </div>
        ))}
      </section>

      <nav
        aria-label="診断結果の移動"
        className="mt-8 flex flex-wrap gap-3"
      >
        {/*
          LinkButton でページ遷移を可能にする
          - あらかじめ行き先が決まっている通常ページ移動のため LinkButton を使用する
        */}
        {/*
          - 今回の履歴詳細を見る
          → primary
          → 黒背景・白文字

          - マイページへ
          → secondary
          → 白背景・枠線
        */}
        {/* 履歴詳細ページへ の <LinkButton></LinkButton> を用意し、今回の診断ID(diagnosisId) を元に`web/app/history/[diagnosisId]/page.tsx` へ遷移可能にする */}
        {/* primary: 主ボタン */}
        <LinkButton href={`/history/${diagnosisId}`}>
          今回の履歴詳細を見る
        </LinkButton>

        {/* マイページへ の <LinkButton></LinkButton> を用意し、`web/app/mypage/page.tsx` へ遷移可能にする */}
        {/* secondary: 副ボタン */}
        <LinkButton href="/mypage" variant="secondary">
          マイページへ
        </LinkButton>
      </nav>
    </main>
  );
}