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
// async function Component() は Server Component 的な考え方に近い
// Client Component は普通の関数 + state 更新で考える
// await は async 関数の中でしか使えない
// useEffect(async () => {}) は避ける
// useEffect の中で async 関数を作って呼ぶのが定番


// なぜ普通の関数コンポーネント？
// Client Component は「先に描画、あとで取得」だから

// なぜ useEffect の中で async 関数を作る？
// useEffect 自体は async にしづらいので、await を使う場所を中に分けるため



// 以下の時に使用するページ
// 診断直後の結果表示
// 履歴から結果を見直す
// 前回との差分確認



// 役割
// useParamsでURLからdiagnosisIdを取得
// useEffectで結果取得APIを呼び出し、APIから結果データを取得
// API通信の状態を管理
// 読み込み中・エラー・成功の状態を切り替える
// rankingとdiffRankingで結果をチャートとランキング一覧で表示



// 流れ
// result/page.tsx
//    ↓
// useParams で diagnosisId 取得
//    ↓
// useEffect で API(result/route.ts) 呼び出し
//    ↓
// loading / error / data を更新
//    ↓
// 成功したら
//   ├─ SafeRadarChart に ranking を渡す
//   └─ diffRanking を map で一覧表示



"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SafeRadarChart from "@/components/SafeRadarChart";
import { supabase } from "@/lib/supabase/client";
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

  // APIから受け取る診断結果データを保存する場所
  // type DiagnosisResultSuccessResponse = ... によりdata に入るのは成功データだけ
  // ranking / diffRanking を安全に使える
  const [data, setData] = useState<DiagnosisResultSuccessResponse | null>(null);
  // 読み込み中かどうかを管理する場所
  const [loading, setLoading] = useState(true);
  // エラーメッセージを保存する場所
  const [error, setError] = useState<string | null>(null);


  // APIを呼び出して結果を取得する関数
  // 画面表示時やdiagnosisIdが変わったときにAPI(web/app/api/diagnosis/[diagnosisId]/result/route.ts)を呼び出し描画し、データ取得する。
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        // supabaseから現在のログインsessionを取得
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // sessionからAPIに送る access_tokenを取り出す
        // 「?.」があるので、sessionがない場合でもエラーにならない
        const token = session?.access_token;

        // tokenが無い場合、未ログイン扱い
        if (!token) {
          setError("ログインが必要です");
          router.replace("/login");
          return;
        }

        // 診断結果取得API呼び出し
        // URLの [diagnosisId] を使って、その診断結果を取りに行く
        // API側で「このリクエストを送ったユーザーは誰か？」を確認するため Authorization header にtokenを入れる
        const response = await fetch(`/api/diagnosis/${diagnosisId}/result`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store", // 結果は毎回最新のものを見たいのでキャッシュしない
        });

        // APIから返ってきたレスポンスをJSONとして取得
        const responseData: DiagnosisResultResponse = await response.json();

        // HTTP処理がエラーの場合の処理
        if (!response.ok) {
          const errorData = responseData as ApiErrorResponse;
          setError(errorData.message ?? "結果取得に失敗しました");
          return;
        }

        // API処理がエラーの場合の処理
        if (!responseData.success) {
          setError(responseData.message ?? "結果取得に失敗しました");
          return;
        }

        // APIから取得した結果データ(responseData)をstateに保存
        // 成功時だけ setData(responseData) を行う
        // これにより、画面が再描画されて、SafeRadarChartやランキング一覧にデータが渡って表示される
        setData(responseData);
      } catch (error) {
        console.error("結果取得エラー:", error);
        setError("結果取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    // diagnosisIdがある時だけAPIを呼び出す
    // URLからIDが取れない状態でAPIを呼ばないため
    if (!diagnosisId) {
      setError("診断IDが見つかりません");
      setLoading(false);
      return;
    }

    fetchResult();
  // diagnosisId または router が変わったときに useEffect を再実行する
  }, [diagnosisId, router]);

  // 読み込み中の表示
  if (loading) {
    return <div>読み込み中...</div>;
  }

  // エラー時の表示
  if (error) {
    return <div>{error}</div>;
  }

  // データがない場合の表示
  if (!data) {
    return <div>結果データがありません</div>;
  }

  return (
    <div>
      <h1>診断結果</h1>

      <section>
        <h2>栄養バランス</h2>

        {/* APIから受け取ったrankingをSafeRadarChartへ渡し、レーダーチャートを描画する。 */}
        <SafeRadarChart ranking={data.ranking} />
      </section>

      <section>
        {/* 順位・栄養素名・今回の点数を表示 */}
        <h2>不足しやすい栄養素ランキング</h2>

        {/* 前回との差分付きランキング */}
        {/* diffRankingの配列を1件ずつ取り出して表示 */}
        {data.diffRanking.map((item, index) => (
          <div key={item.nutrientId}>
            {/* indexは0から始まるので 「+ 1」をする */}
            {index + 1}位 {item.nutrient} {item.total}点
            {/* 前回との差分がある時だけ表示 */}
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