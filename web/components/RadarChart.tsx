//rankingデータをChart.js用データに変換し、レーダーチャート表示するコンポーネント

//診断結果で算出した栄養素ランキング(ranking)をChart.jsを使ってレーダーチャートとして表示する機能

//数値データ
// ↓
//視覚化

//今回追加した要素
//Chart.js
// グラフを描画するためのJavaScriptライブラリ

//react-chartjs-2
// ReactからChart.jsを使うためのラッパー

//RadarChart.tsx
// rankingデータをレーダーチャートに変換するコンポーネント


//今回の構造
// DB (Prisma)
//    ↓
// rankingデータ
//    ↓
// ResultPage (Server Component)
//    ↓ props
// RadarChart (Client Component)
//    ↓
// Chart.js
//    ↓
// レーダーチャート表示




"use client";

//Chart.jsの必要な機能だけ読み込む
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

//React用のRadarコンポーネントを読み込む。
import { Radar } from "react-chartjs-2";

//Chart.jsの使用する機能を登録
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

//受け取る時のrankingの型を定義
type Props = {
  ranking: {
    nutrient: string;
    total: number;
  } [];
};


//受け取ったデータ(ranking)をchart.js形式に変換(数値データ→グラフ)
export default function RadarChart({ ranking }: Props) {
  const data = {
    labels: ranking.map((r) => r.nutrient),
    datasets: [
      {
        label: "栄養スコア",
        data: ranking.map((r) => r.total),
        backgroundColor: "rgba(54,162,235,0.2)",
        borderColor: "rgba(54,162,235,1)",
      },
    ],
  };

  //グラフに変換したモノ(const data ={...})をRadarコンポーネントに渡す。
  return <Radar data={data}/>
}