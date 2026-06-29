// web/components/RadarChart.tsx

// 全体の概要
// - rankingデータをChart.js用データ(labels/datasets)に変換し、レーダーチャートとして表示するコンポーネント
// - 診断結果で算出した栄養素ランキング(ranking)をChart.jsを使ってレーダーチャートとして表示する機能


// ポイント

// 数値データ
// ↓
// 視覚化


// このファイルで使用する Chart.js の機能
// - ChartJS.register(...): Chart.js で使う部品の登録 
// - RadialLinearScale: レーダーチャートの放射状の軸
// - PointElement: データの点
// - LineElement: 点を結ぶ線
// - Filler: 内側の塗りつぶし
// - Tooltip: マウスを乗せた時の詳細
// - Legend: 栄養スコア の グラフの 色 や 線 の説明欄
// - plugins: チャートの追加機能の設定場所


// 今回追加した要素
// - Chart.js
// グラフを描画するためのJavaScriptライブラリ本体

// - react-chartjs-2
// ReactからChart.jsを使うためのラッパー

// - RadarChart.tsx
// rankingデータをレーダーチャートに変換するコンポーネント




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
// max-w-xl の箱に入れる
//   ↓
// Chart.js でレーダーチャート描画





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
// Chart.js を書く時の型 を読み込む
// - Chart.js に渡せる設定だけを書けるようにするために必要
import type { ChartOptions } from "chart.js";

// Chart.jsの使用する機能を登録
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

// rankingを受け取るためのPropsの型を定義
// - web/components/RadarChart.tsx 専用の型
type Props = {
  ranking: ResultRankingItem[];
};

// チャートの表示ルールを定義

// responsive: 画面幅に合わせて、チャートの大きさを自動調節する
// - スマホ → 画面幅に収まる
// - PC → 親要素の幅まで広がる
// - これだけではPC で大きくなりすぎるので、後で max-w-xl を使用する

// maintainAspectRatio: チャートの縦横比を保つ
// - レーダーチャートを自然な形に保つ
// - 横幅だけ広くなり、縦横バランスが崩れる のを防ぐため

// aspectRatio: 横幅と高さの比率を 1 : 1 (正方形) にする

// plugins(チャートの追加機能の追加場所) で legend(グラフの色や線の説明欄) の position をチャートの上部("top")に指定
const options: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1,
  plugins: {
    legend: {
      position: "top",
    },
  },
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
  // - div の className で チャートを置く箱の幅と位置 を指定 
  // w-full: 親要素の幅いっぱいまで使う(画面幅に合わせて小さく・大きくなる)
  // max-w-xl: 最大幅を制限する
  // - PC幅が広い時でも、チャートの大きさは 最大 576px 程度までとし、それ以上大きくならない
  // mx-auto: チャートを中央寄せにする

  // Radar
  // - Radar が data(栄養素名とスコアのデータ) とoptions(チャートの表示ルール) を受け取ってグラフを描画する
  return (
    <div className="mx-auto w-full max-w-xl">
      <Radar data={data} options={options} />
    </div>
  );
}