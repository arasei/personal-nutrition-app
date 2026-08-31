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

// このファイルで使用する Chart.js の設定
// - scales: レーダーチャート専用の放射状の軸の表示ルール設定場所
// - plugins: チャートの凡例やツールチップなどの追加表示の設定場所



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
// ranking.map(item => item.score)
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

// global.css のカラートークンと同じ色を使用する
const RADAR_CHART_COLORS = {
  primary: "#059669",
  primaryHover: "#047857",
  primaryFill: "rgba(5, 150, 105, 0.18)",
  border: "#e2e8f0",
  muted: "#64748b",
  surface: "#ffffff",
} as const;

// 320px でも横にはみ出しにくいように、長い栄養素名だけ2行にする。
const MULTILINE_POINT_LABELS: Record<string, string[]> = {
  "ビタミンB群": ["ビタミン", "B群"],
  "オメガ3脂肪酸": ["オメガ3", "脂肪酸"],
  "ビタミンC": ["ビタミン", "C"],
  "ビタミンD": ["ビタミン", "D"],
};

// レーダーチャートに表示する栄養素名を必要な名前だけ2行へ変換する
// - Chart.js が軸の栄養素名を描画するときに使用する
function formatPointLabel(label: string): string | string[] {
  return MULTILINE_POINT_LABELS[label] ?? label;
}

// チャートの表示ルールを定義

// responsive: 画面幅に合わせて、チャートの大きさを自動調節する
// - スマホ → 画面幅に収まる
// - PC → 親要素の幅まで広がる
// - これだけではPC で大きくなりすぎるので、後で max-w-xl を使用する

// maintainAspectRatio: チャートの縦横比を保つ
// - レーダーチャートを自然な形に保つ
// - 横幅だけ広くなり、縦横バランスが崩れる のを防ぐため

// aspectRatio: 横幅と高さの比率を 1 : 1 (正方形) にする

// scales: レーダーチャート専用の放射状の軸を設定
// - min: 0 → 最小値を0にする(グラフの中心)
// - max: 100 → 最大値を100にする(グラフの外側)
// - ticks.stepSize: 20 → 目盛りの間隔を20点ごとに作る
// - ticks.display: 目盛りの数字を非表示にする

const options: ChartOptions<"radar"> = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1,
  // レーダーチャートの端と栄養素名の間に余白を作る
  layout: {
    padding: 12,
  },

  scales: {
    r: {
      min: 0,
      max: 100,

      ticks: {
        // 目盛り線を20点間隔で作る
        stepSize: 20,

        // 320pxで中央の数字が重ならないように目盛りの数字だけ隠す
        display: false,
      },

      // 五角形・八角形などの外周線
      grid: {
        color: RADAR_CHART_COLORS.border,
      },

      // 中心から各栄養素へ伸びる線
      angleLines: {
        color: RADAR_CHART_COLORS.border,
      },

      // チャート周囲の栄養素名
      pointLabels: {
        display: true,
        callback: formatPointLabel,
        color: RADAR_CHART_COLORS.muted,
        padding: 6,
        font: {
          size: 11,
          weight: 500,
          lineHeight: 1.2,
        },
      },
    },
  },

  // pluginsのlegendで、1種類だけの凡例を非表示にしてチャートの表示領域を広げる
  plugins: {
    legend: {
      // 現在はデータ系列が1種類だけなので非表示にする
      display: false,
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
        data: ranking.map((item) => item.score),
        // 面の薄い塗り
        backgroundColor: RADAR_CHART_COLORS.primaryFill,

        // 外周の線
        borderColor: RADAR_CHART_COLORS.primary,

        // 各栄養素のデータ点
        pointBackgroundColor: RADAR_CHART_COLORS.primary,
        pointBorderColor: RADAR_CHART_COLORS.surface,

        // マウスを重ねたときの点
        pointHoverBackgroundColor: RADAR_CHART_COLORS.surface,
        pointHoverBorderColor: RADAR_CHART_COLORS.primaryHover,

        borderWidth: 2,
        // 栄養素ごとのスコア位置を点として確認しやすくする
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
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