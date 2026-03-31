// 履歴一覧からクリックされた診断ID(URL(/history/[id]))を使ってPrismaでDBからその診断のデータ1件取得し、診断結果(栄養スコア)を表示する履歴詳細ページ

// URL例
// /history/abc123
// [id]=abc123
// params.id=abc123

// 履歴詳細ページで表示するものは現状6つ
// ① 診断日
// ② 全栄養スコア一覧
// ③ 上位栄養素
// ④ 不足栄養素
// ⑤ 前回との差分
// ⑥ チャート表示

// 関連テーブル(使用しているrelation)
// Diagnosis
//    ↓
// DiagnosisNutrientScore
//    ↓
// Nutrient

// 処理流れ

// 履歴一覧ページ
//    ↓ クリック
// /history/123
//    ↓
// ServerComponent+DB
//    ↓
// PrismaでDBから今回の診断データ(currentDiagnosis)取得
//    ↓
// PrismaでDBから前回の診断データ(previousDiagnosis)取得
//    ↓
// 診断データを元に栄養素スコア(scores)と栄養素名(nutrient)を取得
//    ↓
// 今回のスコア(scores)を見やすい形(nutrientScores)に整形(nutrient.name, nutrientId, score)
//    ↓
// 上位3件(topNutrients)を作成
//    ↓
// 下位3件(lowNutrients)を作成
//    ↓
// 前回との差分(differences)を作成
//    ↓
// チャート用のデータ(ranking)に変換
//    ↓
// 画面栄養素スコア・チャート表示


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

// このページに渡ってくるURLのパラメータの型定義
type Props = {
  params: {
    id: string
  }
}


//今回の診断のスコアをDBから取得
//params取得
//ServerComponent使用
export default async function HistoryDetailPage({ params }: Props) {
  const { id } = await params

  //今回の診断(Diagnosis)を1件取得
  const currentDiagnosis = await prisma.diagnosis.findUnique({
    //URLのIDを持つ診断を1件検索
    where: { id },
    //includeで関連しているスコアと栄養素名も一緒に取得
    include: {
      scores: {
        include: {
          nutrient: true,
        },
      },
    },
  })

  if (!currentDiagnosis) {
    return <p>データが見つかりません</p>
  }

  //前回の診断を取得
  const previousDiagnosis = await prisma.diagnosis.findFirst({
    where: {
      userId: currentDiagnosis.userId,
      createdAt: {
        lt: currentDiagnosis.createdAt,
      },
    },
    include: {
      scores: {
        include: {
          nutrient: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  //栄養スコアを見やすい形に整える
  // .sort((a, b) => b.score - a.score);でscoreが高い順に並び替え
  const nutrientScores = currentDiagnosis.scores
    .map((score) => ({
      nutrient: score.nutrient.name,
      nutrientId: score.nutrientId,
      score: score.score,
    }))
    .sort((a, b) => b.score - a.score)

  //上位3件
  const topNutrients = nutrientScores.slice(0, 3)

  //下位3件
  const lowNutrients = [...nutrientScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)


  //前回との差分表示


  //現在の各栄養素について、差分表示用データを作成
  const differences = nutrientScores.map((current) => {
    //差分計算する対象を同じ栄養素IDとして一致するかどうかで判断
    const previous = previousDiagnosis?.scores.find(
      (item) => item.nutrientId === current.nutrientId
    )

    //前回スコアがあるかどうかをtrue/falseで判断するため
    const hasPrevious = !!previous
    //前回スコアがない時nullにする。
    const previousScore = previous?.score ?? null
    //前回スコアがある時、差分計算する。
    const diff = hasPrevious ? current.score - previous.score : null

    //最初の初期値
    let diffLabel = "前回データなし"

    //差分の内容ごとの表示文の条件分岐
    if (diff !== null) {
      if (diff > 0) {
        diffLabel = `+${diff} 改善`
      } else if (diff < 0) {
        diffLabel = `${diff} 低下`
      } else {
        diffLabel = "0 変化なし"
      }
    }

    //フロント側に返す用に差分表示用データを作成
    return {
      nutrient: current.nutrient,
      nutrientId: current.nutrientId,
      current: current.score,
      previous: previousScore,
      diff,
      hasPrevious,
      diffLabel,
    }
  })

  //チャート用のデータ形に変換
  //nutrientはそのまま、score を total に変換して、SafeRadarChartに渡す。
  const ranking = nutrientScores.map((item) => ({
    nutrient: item.nutrient,
    total: item.score,
  }))

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">診断詳細</h1>
      {/* 日付表示 */}
      <p>診断日: {new Date(currentDiagnosis.createdAt).toLocaleDateString()}</p>


      {/* スコア表示 */}
      {/* チャート表示 */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">栄養素スコア</h2>
        <SafeRadarChart ranking={ranking}/>
        <ul className="space-y-1">
          {/* 全栄養素のスコア一覧を表示 */}
          {nutrientScores.map((score) => (
            <li key={score.nutrientId}>
              {score.nutrient} : {score.score}
            </li>
          ))}
        </ul>
      </section>

      {/* 上位3件 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">上位栄養素</h2>
        <ul className="space-y-1">
          {topNutrients.map((nutrient) => (
            <li key={nutrient.nutrientId}>
              {nutrient.nutrient} : {nutrient.score}
            </li>
          ))}
        </ul>
      </section>

      {/* 下位3件 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">不足栄養素</h2>
        <ul className="space-y-1">
          {lowNutrients.map((nutrient) => (
            <li key={nutrient.nutrientId}>
              {nutrient.nutrient} : {nutrient.score}
            </li>
          ))}
        </ul>
      </section>

      {/* 前回との差分 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">前回との差分</h2>
        <ul className="space-y-1">
          {differences.map((item) => (
            <li key={item.nutrientId}>
              {item.nutrient} : 現在 {item.current}
              {" / "}
              前回 {item.previous ?? "なし"}
              {" / "}
              {item.diffLabel}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}