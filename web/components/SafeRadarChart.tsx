// web/components/SafeRadarChart.tsx

//SafeRadarChart を経由することで、ブラウザで動いた後だけRadarChart.tsxを描画するための中継コンポーネント




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

import { useEffect, useState } from "react";
// 実際にチャートを描画する RadarChart を読み込む
import RadarChart from "@/components/RadarChart";
// ranking の1件分の型を共通型(web/types/diagnosisApi)から読み込む
import type { ResultRankingItem } from "@/types/diagnosisApi";

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
  //最初は描画しないようにしている
  // Chart.js系でSSRと相性が悪い時のhydration errorを防ぐため
  // 最初はfalse、画面がブラウザで動いた後にtrueに変えた時にRadarChartを表示。
  const [mounted, setMounted] = useState(false);

//画面表示後にmountedをtrueにする。
// ブラウザで動いた後だけチャートを動かすため
// []にすることで最初の1回だけ動かす。
  useEffect(() => {
    setMounted(true);
  }, []);

  //まだブラウザで mounted していなければ何も表示しない
  // SSRとクライアント表示のズレを防ぐために必要
  // このif(...)によりhydration error回避できるようにする
  if (!mounted) return <p>チャートを読み込み中...</p>;

  //最後にRadarChartにrankingを渡して表示しています
  // SafeRadarChartは中継役だから
  // RadarChart側もrankingを受け取れる形になっている必要がある
  return <RadarChart ranking={ranking} />;
}