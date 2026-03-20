//SafeRadarChart を経由することで、ブラウザで動いた後だけRadarChart.tsxを描画するための中継コンポーネント

//動きのイメージ
// page.tsx
//   ↓ rankingを渡す
// SafeRadarChart.tsx
//   ↓
// mounted = false(ブラウザでマウント未完了)
//   ↓
// まだ表示しない
//   ↓
// useEffect実行
//   ↓
// mounted = true(ブラウザでマウント完了)
//   ↓
// RadarChart.tsx を表示
//   ↓
// レーダーチャート表示

"use client";

import { useEffect, useState } from "react";
import RadarChart from "@/components/RadarChart";

//rankingの1件分の形を定義
// nutrientとtotalを安全に使えるようにするため
// nutrientが文字列、totalが数値であることをpage.tsx側と揃える必要がある。
type RankingItem = {
  nutrient: string;
  total: number;
};


//SafeRadarChartがrankingをpropsとして受け取る。
// propsに型をつけるため
// RankingItem[]はRankingの配列
export default function SafeRadarChart({
  ranking,
}: {
  ranking: RankingItem[];
}) {
  //最初は描画しないようにしている
  // Chart.js系でSSRと相性が悪い時のhydration errorを防ぐため
  // 最初はfalse、画面がブラウザで動いた後にtrueに変えた時にRadarChartを表示。
  const [mounted, setMounted] = useState(false);

//画面表示後にmountedをtrueにする。。
// ブラウザで動いた後だけチャートを動かすため
// []にすることで最初の1回だけ動かす。
  useEffect(() =>{
    setMounted(true);
  }, []);

  //まだmountedしていなければ何も表示しない
  // SSRとクライアント表示のズレを防ぐため
  // このif(...)によりhydration error回避できるようにする
  if (!mounted) return <p>チャートを読み込み中...</p>;

  //最後にRadarChartにrankingを渡して表示しています
  // SafeRadarChartは中継役だから
  // RadarChart側もrankingを受け取れる形になっている必要がある
  return <RadarChart ranking={ranking} />
}