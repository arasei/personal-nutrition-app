
//集計APIからランキングを取得して画面表示するページ

// 構成
// ① 結果ページを作る
// ② calculate API を叩く(APIにアクセス)
// ③ calculate/route.tsよりranking を受け取る(stateに保存する)
// ④ map で回して表示する

//api/diagnosis/calculate/route.tsで、診断回答をもとに栄養素ごとのスコアを集計してランキングを作るロジックを実装
// 次はそのAPIを呼び出して結果ページに表示する部分を作成。
//api/diagnosis/calculate/route.tsで、{ nutrient, total }という形でランキング(ranking)を返すようにしているので、
// 結果ページではそのランキングを受け取って、栄養素とスコアを表示するようにする。(ranking.map(item => item.nutrient) と書けるようにしている)

"use client";

import { useEffect, useState } from "react";

type RankingItem = {
  nutrient: string;
  total: number;
};

export default function ResultPage() {
  //rankingを保存するための箱(state)を作る
  //rankingをstateで持つ
  const [ ranking, setRanking ] = useState<RankingItem[]>([]);

  //useEffectでページロード時にAPIを呼び出す
  //API呼び出し
  //APIのURLは/api/diagnosis/calculate?diagnosisId=123 とする(診断IDは仮で123にしている)
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/diagnosis/calculate?diagnosisId=123");
      const data = await res.json();
      setRanking(data.ranking);
    };

    fetchData();
  }, []); //空の依存配列で、ページロード時に一度だけ実行



  //取得した配列をmapで1つずつ取り出して表示
  //indexを使って順位も表示する(index番号を仕様するため+1して1位から表示)
  //ranking.map(item => item.nutrient) と書けるようにしているので、item.nutrient と item.total を表示する
  return (
    <div>
      <h1>診断結果</h1>
      {ranking.map((item,index) => (
        <div>
          {index + 1}位: {item.nutrient} ({item.total}点)
        </div>
      ))}
    </div>
  )
}