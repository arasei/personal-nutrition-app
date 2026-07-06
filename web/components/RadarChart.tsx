// web/components/RadarChart.tsx

// rankingデータをChart.js用データ(labels/datasets)に変換し、レーダーチャートとして表示するコンポーネント

// 診断結果で算出した栄養素ランキング(ranking)をChart.jsを使ってレーダーチャートとして表示する機能

// 数値データ
// ↓
// 視覚化

// 今回追加した要素
// Chart.js
// グラフを描画するためのJavaScriptライブラリ本体

// react-chartjs-2
// ReactからChart.jsを使うためのラッパー

// RadarChart.tsx
// rankingデータをレーダーチャートに変換するコンポーネント




// 流れ
// result/page.tsx
//   ↓
// data.ranking を渡す
//   ↓
// SafeRadarChart
//   ↓
// ブラウザでマウント済みか確認
//   ↓
// mounted = true
//   ↓
// RadarChart
//   ↓
// ranking.map(item => item.nutrient)
// ranking.map(item => item.total)
//   ↓
// Chart.js用データに変換
//   ↓
// レーダーチャート表示






"use client";

// Chart.jsの必要な機能だけ読み込む
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

// React用のRadarコンポーネントを読み込む。
import { Radar } from "react-chartjs-2";
// ranking の1件分の型を共通型(web/types/diagnosisApi)から読み込む
import type { ResultRankingItem } from "@/types/diagnosisApi";

// Chart.jsの使用する機能を登録
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// rankingを受け取るためのPropsの型を定義
// web/components/RadarChart.tsx 専用の型
type Props = {
  ranking: ResultRankingItem[];
};


// 受け取ったデータ(ranking)をchart.js形式に変換(数値データ→グラフ)
export default function RadarChart({ ranking }: Props) {
  const data = {
    labels: ranking.map((item) => item.nutrient),
    datasets: [
      {
        label: "栄養スコア",
        data: ranking.map((item) => item.total),
        backgroundColor: "rgba(54,162,235,0.2)",
        borderColor: "rgba(54,162,235,1)",
      },
    ],
  };

  // グラフに変換したモノ(const data ={...})をRadarコンポーネントに渡す。
  return <Radar data={data} />
}