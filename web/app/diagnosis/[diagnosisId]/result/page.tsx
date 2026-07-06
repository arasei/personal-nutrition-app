//Server ComponentとしてDBからランキングを直接取得→集計→画面表示するページ

// 構成
// URL入力アクセス
// ↓
// [diagnosisId] に値が入る、paramsからdiagnosisIdを取得
// ↓
// prismaでDBから診断回答を取得して集計(Server Component (page.tsx))
// ↓
// scoreMapで栄養素ごとの合計を計算
// ↓
// rankingを作成
// ↓
// mapでランキングを描画


//今回の変更
//rankingを作成する場所が「API」から「Server Component」に移動
//App Routerの動的ルート([diagnosisId])を使用するとroute.tsでのAPI呼び出しをURLから診断IDを取得して行うことができるため、
// 以前のようにClient ComponentでAPI route.tsからfetchする必要がなくなった。
//以前はClient ComponentでAPI route.tsからfetchしていたが、今回はURLから診断IDを取得してAPIを呼び出す仕様(App Router)に変更

//result/page.tsx(Server Component)内でDBから回答を直接取得して栄養素ごとのスコアを集計するロジックを実装し、
// { nutrient, total}の形でrankingを作成して、
// ranking.mapでランキングを描画する部分も実装


import { prisma } from "@/lib/prisma";

type RankingItem = {
  nutrient: string;
  total: number;
};

//診断回答を入力したURLからparamsで取得
export default async function ResultPage({
  params, } : { params: { diagnosisId: string };
}) {
  const { diagnosisId } = params;
  //診断ログ(diagnosisAnswerの中身と紐付けしたdiagnosisQuestion内のnutrition)を取得
  const answers = await prisma.diagnosisAnswer.findMany({
    where: { diagnosisId },
    include: {
      question: true,
    },
  });

  //スコア集計箱を作成
  const scoreMap: Record<string, number> = {};

  //ループで集計
  for (const item of answers) {
    const nutrient = item.question.nutrient;
    const point = item.value;

    scoreMap[nutrient] = (scoreMap[nutrient] ?? 0) + point;
  }

  //不足順を計算
  const ranking: RankingItem[] = Object.entries(scoreMap)
    .sort((a, b) => a[1] - b[1])
    .map(([nutrient, total]) => ({
      nutrient,
      total,
    }));



    //取得した配列をmapで1つずつ取り出して表示
    //indexを使って順位も表示する(index番号を使用するため+1して1位から表示)
    //ranking.map(item => item.nutrient) と書けるようにしているので、item.nutrient と item.total を表示する
    return (
      <div>
        <h1>健康診断</h1>
        {ranking.map((item, index) => (
          <div key={item.nutrient}>
            {index + 1}位: {item.nutrient} ({item.total}点)
          </div>
        ))}
      </div>
    )
}
