//Server ComponentとしてDBからランキングを直接取得→集計→前回診断データにより差分ランキング作成→画面表示するページ

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
// 前回診断取得
// ↓
// 差分計算
// ↓
// mapでランキング + 差分を描画


//今回の変更
//rankingを作成する場所が「API」から「Server Component」に移動
//App Routerの動的ルート([diagnosisId])を使用するとroute.tsでのAPI呼び出しをURLから診断IDを取得して行うことができるため、
// 以前のようにClient ComponentでAPI route.tsからfetchする必要がなくなった。
//以前はClient ComponentでAPI route.tsからfetchしていたが、今回はURLから診断IDを取得してAPIを呼び出す仕様(App Router)に変更

//result/page.tsx(Server Component)内でDBから回答を直接取得して栄養素ごとのスコアを集計するロジックを実装し、
// { nutrient, total}の形でrankingを作成して、ranking.mapでランキングを描画する部分も実装

//await prisma.diagnosis.findMany({})で前回診断データ取得
// 同一ユーザーの診断履歴を取得
//let diffMap: Record<string, number> = {};で前回スコアマップ作成
// 前回スコアをMap化
//const diffRanking = ranking.map((item)で差分ランキング作成
// 現在ランキング差分情報を追加
//UI表示
// ランキング表示をmapでレンダリング


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
    const nutrient = item.question.nutrientId;
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

    //この診断の診断IDに紐づくユーザーIDを取得
    // 前回診断を取得するため
    const currentDiagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      select: { userId: true },
    });

    //前回の診断を取得
    // 診断履歴をDBから複数件取得
    // 前回との差分を出すには、今回だけでなく前回の診断も必要だから
    const diagnoses = await prisma.diagnosis.findMany({
      //「このユーザーの診断だけ」を取る。
      where: {
        userId: currentDiagnosis?.userId,
      },
      //新しい診断順に並べている
      orderBy: {
        createdAt: "desc",
      },
      //2件だけ取得(今回と前回)
      take: 2,
      //診断本体だけでなく、その診断に紐づく栄養素スコアも一緒にとる。
      include: {
        scores: true,
      },
    });

    //前回データの取り出し
    const previous = diagnoses[1];


    //差分計算

    //差分計算用の箱
    // 前回スコアを入れておくための箱を作成
    let diffMap: Record<string, number> = {};


    //前回スコアをdiffMapに追加
    // if(previous){...}で前回診断があるときだけ処理を進めています。
    // for (const item of previous.scores) {...}では、前回診断の栄養素スコアを1件ずつ見ている。
    // diffMap[item.nutrientId] = item.score;は、「栄養素ID→前回スコア」の形で保存している。
    if (previous) {
      for (const item of previous.scores) {
        diffMap[item.nutrientId] = item.score;
      }
    }

    
    //今回のランキング(ranking)1件ずつに対して、差分情報(diffRanking)を追加。
    const diffRanking = ranking.map((item) => {
      //今回の栄養素に対応する前回スコアを取り出す。
      const prev = diffMap[item.nutrient];
      //前回スコアがあれば差分を計算し、なければnullにする。
      const diff = prev !== undefined ? item.total - prev : null;

      //表示に必要な情報をまとめた新しいオブジェクトを返す。
      // diffRanking配列の完成
      return {
        nutrient: item.nutrient,
        total: item.total,
        diff,
      };
    });



    //診断結果として画面にランキングと差分をUI表示
    // 取得した配列をmapで1つずつ取り出して表示
    return (
      <div>
        <h1>健康診断</h1>
        {/* 差分付きランキングを1件ずつ表示 */}
        {diffRanking.map((item, index) => (
          //Reactで各行を識別するためにkeyをつけている
          <div key={item.nutrient}>
            {/* 順位、栄養素名、今回の点数を表示 */}
            {index + 1}位 {item.nutrient} {item.total}点
            {/* 差分があるときだけ表示 */}
            {item.diff !== null && (
              <span>
                {/* 差分がプラスの時だけ「+」を表示 */}
                (前回 {item.diff > 0 ? "+" : ""}
                {/* 実際の差分値を表示 */}
                {item.diff})
              </span>
            )}
          </div>
        ))}
      </div>
    )
}
