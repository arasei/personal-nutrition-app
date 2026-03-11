// 履歴一覧からクリックされた診断ID(URL(/history/[id]))を使ってPrismaでDBからその診断のデータ1件取得し、診断結果(栄養スコア)を表示する履歴詳細ページ

// URL例
// /history/abc123
// [id]=abc123
// abc123=Diagnosis.id=params.id

// 履歴詳細ページで表示するものは現状4つ
// ① 診断日
// ② 栄養スコア一覧
// ③ 上位栄養素
// ④ 不足栄養素

// Diagnosis
//    ↓
// DiagnosisNutrientScore
//    ↓
// Nutrient
// このrelationを使い3テーブルを1度に取得
// 栄養素スコア表示に使用

// 処理流れ

// 履歴一覧ページ
//    ↓ クリック
// /history/123
//    ↓
// ServerComponent+DB
//    ↓
// PrismaでDBから診断データ(Diagnosis)取得
//    ↓
// 診断データを元に栄養素スコア(scores)と栄養素名(nutrient)を取得
//    ↓
// 画面栄養素スコア表示

// つまり
// 履歴の1件の中身を見て、履歴詳細に必要なデータを持ってきて表示するページ

// 履歴詳細ページ → ServerComponent + Prisma(Prisma直呼び)
// 履歴詳細ページは1件の重い全データをDBから取得するページ
// 履歴詳細ページはServerComponentを使用して表示
// 例)
// ・診断日
// ・栄養スコア全部
// ・不足栄養素
// ・ランキング


//Prisma読み込み
import { prisma } from "@/lib/prisma"

type Props = {
  params: {
    id: string
  }
}
//params取得
//SeverComponent使用
export default async function HistoryDetailPage({ params }: Props) {

  //診断(Diagnosis)を1件取得
  const diagnosis = await prisma.diagnosis.findUnique({
    //URLのIDを持つ診断を1件検索
    where: {
      id: params.id
    },
    //includeで関連しているデータを一緒に取得
    include: {
      scores: {
        include: {
          nutrient: true
        }
      }
    }
  })

  if (!diagnosis) {
    return <p>データが見つかりません</p>
  }

  return (
    <div>
      <h1>診断詳細</h1>


      {/* 日付表示 */}
      <p>
        診断日:
        {new Date(diagnosis.createdAt).toLocaleDateString()}
      </p>


      {/* スコア表示 */}
      <h2>栄養素スコア</h2>
      <ul>
        {diagnosis.scores.map((score) => (
          <li key={score.id}>
            {score.nutrient.name} : {score.score}
          </li>
        ))}
      </ul>
    </div>
    
  )

}