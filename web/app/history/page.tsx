// 履歴APIからデータを取得して、上位3栄養素付きの履歴一覧を画面に表示するページ

//APIから履歴データ(配列)が返る
//履歴データをmapで画面に並べる

//流れまとめ

// 履歴ページ(/history)を作る
//       ↓
// Server Component内でfetchを使用し、自作API経由でデータ取得（将来的には直接Prisma呼び出しへ変更予定）
//       ↓
// APIを呼ぶ(fetch)する
//       ↓
// JSON形式で受け取る
//       ↓
// 上位3栄養素を表示する(mapで一覧表示)



import React from "react"

//Server ComponentでAPIを呼び出す
async function getHistory() {
  const res = await fetch("http://localhost:3000/api/diagnosis/history?userId=123",{
    //キャッシュ無しで常に最新のデータを取得する
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error("履歴取得に失敗しました")
  }

  return res.json()
}


//画面表示ロジック
//履歴一覧を表示
//日付表示
//上位3栄養素の表示
export default async function HistoryPage() {
  const histories = await getHistory()

  return (
    <div>
      <h1>診断履歴</h1>

      {histories.length === 0 && <p>履歴がありません</p>}

      {histories.map((history: any) => (
        <div key={history.id} style={{ border: "1px solid gray", margin: "16px", padding: "16px"}}>
          <p>日付: {new Date(history.createdAt).toLocaleDateString()}</p>
          <h3>上位3栄養素</h3>
          <ul>
            {history.topNutrients.map((nutrient: any, index: number) => (
              <li key={index}>
                {nutrient.nutrientId} : {nutrient.score}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}