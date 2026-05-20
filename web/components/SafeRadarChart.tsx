// web/components/SafeRadarChart.tsx

//SafeRadarChart を経由することで、ブラウザで動いた後だけRadarChart.tsxを描画するための中継コンポーネント




// 流れ

// result/page.tsx
//   ↓
// <SafeRadarChart ranking={data.ranking} />
// data.ranking を渡す
//   ↓
// SafeRadarChart
//   ↓
// dynamic import で RadarChart をブラウザ側だけ読み込む
//   ↓
// ranking.map(item => item.nutrient)
// ranking.map(item => item.total)
//   ↓
// 読み込み中は「チャートを読み込み中...」
//   ↓
// 読み込み完了
//   ↓
// RadarChart 表示
//   ↓
// Chart.js用データに変換
//   ↓
// Chart.js でレーダーチャート描画



"use client";

// ranking の1件分の型を共通型(web/types/diagnosisApi)から読み込む
import type { ResultRankingItem } from "@/types/diagnosisApi";
import dynamic from "next/dynamic";


// 実際にチャートを描画する RadarChart をブラウザ側だけで読み込む
const RadarChart = dynamic(() => import("./RadarChart"), {
  ssr: false,
  loading: () => <p>チャートを読み込み中...</p>
});

// rankingを受け取るためのPropsの型を定義
// nutrientId, nutrient, total を持つ rankingを安全に受け取り、使えるようにするため
// result/page.tsx から渡される data.ranking と型を揃える必要がある。
type Props = {
  ranking: ResultRankingItem[];
};


// SafeRadarChartがrankingをpropsとして受け取る。
// propsに型をつけるため
// ResultRankingItem[] はResultRankingItem(ランキング1件分のデータが複数入っている) の配列
export default function SafeRadarChart({ ranking }: Props) {

  //最後にRadarChartにrankingを渡して表示しています
  // SafeRadarChartは中継役だから
  // RadarChart側もrankingを受け取れる形になっている必要がある
  return <RadarChart ranking={ranking} />;
}