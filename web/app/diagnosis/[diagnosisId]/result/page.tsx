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
import { useParams } from "next/navigation";
import SafeRadarChart from "@/components/SafeRadarChart";
// APIから受け取るデータの型を読み込む
import type { DiagnosisResultResponse } from "@/types/diagnosisApi";

// このページはブラウザ側で動くので、最初に await で止まる形ではなく、
// いったん画面を返してから useEffect でデータを取りに行く流れ
// 後でstateを更新する形
export default function ResultPage() {
  const params = useParams();
  // 型の都合上、as stringとする
  const diagnosisId = params.diagnosisId as string;

  // APIから受け取る診断結果データを保存する場所
  const [data, setData] = useState<DiagnosisResultResponse | null>(null);
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

        // 結果取得API呼び出し
        const response = await fetch(`/api/diagnosis/${diagnosisId}/result`);

        if (!response.ok) {
          throw new Error("結果取得に失敗しました");
        }

        // API(json形式)のデータを指定した型で受け取る
        const result: DiagnosisResultResponse = await response.json();
        // APIから取得した結果データ(result)をstateに保存
        setData(result);
      } catch (err) {
        console.error(err);
        setError("結果取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    // diagnosisIdがある時だけAPIを呼び出すため
    if (diagnosisId) {
      fetchResult();
    }
  }, [diagnosisId]);

  if (loading) {
    return <div>読み込み中...</div>
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!data) {
    return <div>結果データがありません</div>
  }

  return (
    <div>
      <h1>健康診断</h1>
      <h2>栄養バランス</h2>

      {/* APIから受け取ったrankingをSafeRadarChartへ渡し、レーダーチャートを描画する。 */}
      <SafeRadarChart ranking={data.ranking} />

      {/* 順位・栄養素名・今回の点数を表示 */}

      {/* diffRankingの配列を1件ずつ取り出して表示 */}
      {data.diffRanking.map((item, index) => (
        <div key={item.nutrient}>
          {/* indexは0から始まるので 「+ 1」をする */}
          {index + 1}位 {item.nutrient} {item.total}点
          {/* 差分がある時だけ表示 */}
          {/* プラスの時は「+」、マイナスの時は「-」を表示 */}
          {item.diff !== null && (
            <span>
              (前回 {item.diff > 0 ? "+" : ""} {item.diff})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}