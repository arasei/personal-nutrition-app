// web/app/diagnosis/[diagnosisId]/result/page.tsx

// ClientComponentでAPIを呼び出して、診断結果を画面に表示するページ

// API(result/route.ts)から結果をもらう
// もらったデータを表示するだけ

// URLからdiagnosisIdを取得し、結果取得APIを呼んで、
// 受け取った診断結果をチャートとランキング一覧で表示する




// result/route.ts = データ作成担当
// APIRouteが裏で結果データを作る

// result/page.tsx = 画面表示担当
// このpage.tsxはAPIから結果データを受け取って表示する
// DBには直接触らず、表示だけを担当するページ



// token 送信について

// Supabase session から access_token を取得し、
// Authorization header に token を付けて結果取得APIを呼び出す
// result API側では token から user.id を取得し、
// diagnosisId がログイン中ユーザー本人の診断か確認する



// 今回のポイント
// フロント側は token を Authorization header に入れてAPIを呼ぶ
// API側は supabase.auth.getUser(token) で本人確認する
// フロントとAPIで Authorization の形式を必ず揃える
// データ取得と状態管理は SWR に寄せるとスッキリする
// session取得は毎回 getSession せず useSupabaseSession にまとめる


// なぜ普通の関数コンポーネント？
// Client Component は「先に描画、あとで取得」だから

// useEffect は未ログイン時にログインページへ遷移するために使う
// データ取得自体は useSWR が担当する



// 以下の時に使用するページ
// 診断が完了した直後に結果を見る
// 履歴一覧から過去の結果を見る
// 前回との差分を確認する
// 栄養バランスをチャートで見る



// 役割
// URLから diagnosisId を取る
// tokenをAPIに渡す
// APIから結果を受け取る
// 画面に表示する



// 流れ

// result/page.tsx
//   ↓
// page.tsx が URL から diagnosisId を取得
//   ↓
// useSupabaseSession で token を取得
//   ↓
// token と diagnosisId が揃ったら SWR が動く
//   ↓
// fetcher が /api/diagnosis/[diagnosisId]/result を呼ぶ
//   ↓
// route.ts 側で Authorization header に token を受け取る
//   ↓
// route.ts 側で supabase.auth.getUser(token) で token を検証
//   ↓
// user.id と diagnosisId で本人の診断だけ取得
//   ↓
// ranking / diffranking を作成
//   ↓
// JSON形式で本人の診断結果だけ返す
//   ↓
// page.tsx が画面にチャートとランキングを表示



"use client";

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

  // ログイン中の token と ログイン状態を確認中かどうかを取得する
  // SWR にも isLoading があるため、名前がぶつからないように useSupabaseSession の isLoading は isSessionLoading と名前を変える
  const { token, isLoading: isSessionLoading } = useSupabaseSession();

  // SWR が API を呼ぶときに使う関数
  // この関数の中で fetchし、API を呼び出し、結果を処理する
  const fetcher = async (url: string): Promise<DiagnosisResultSuccessResponse> => {
    // token が無い場合、未ログイン扱い
    if (!token) {
      throw new Error("ログインが必要です");
    }

    // token をそのまま Authorization header に入れて API を呼び出す
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
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
  // 条件が揃っているときだけAPI を呼び出す
  // SWR は 第1引数に null を渡すと API を呼び出さないので、shouldFetch が false のときは null を渡す
  const {
    data,
    error,
    isLoading,
  } = useSWR(
    shouldFetch ? `/api/diagnosis/${diagnosisId}/result` : null,
    fetcher
  );


  // APIを呼び出して結果を取得する関数
  // 画面表示時やdiagnosisIdが変わったときにAPI(web/app/api/diagnosis/[diagnosisId]/result/route.ts)を呼び出し描画し、データ取得する。
  useEffect(() => {

    if (!isSessionLoading && !token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);

  // 読み込み中の時の表示
  if (isSessionLoading || isLoading) {
    return <div>読み込み中...</div>;
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
    <div>
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
            {index + 1}位 {item.nutrient} {item.total}点
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
    </div>
  );
}