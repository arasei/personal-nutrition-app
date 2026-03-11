// 履歴APIの設計
// ユーザーの診断履歴を新しい順に取得し、各診断の上位3栄養素だけを返すAPI


// ログインユーザーの診断履歴をDBから取得

// 各履歴をcreatedAtでscoresのtotalの降順に並べて取得(scores を含めるために include を使用)

// 各診断ごとに total の高い順で上位3つだけ取得

//フロントに渡すデータの型に変換して返す

// User
//   ↓
// Diagnosis（新しい順）
//   ↓
// scores（total順）
//   ↓
// 上位3つだけslice




import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"


export async function GET(req: Request) {

  //URL(例: /api/diagnosis/history?userId=xxx)をURLオブジェクトに変換して、URLをパーツごと(パス、クエリなど)に分解
  // 変換、分解したモノ(searchParams)からクエリパラメータ(userId)を安全に取得する
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userIdが必要です" }, { status: 400 })
  }

  
  //DBから診断履歴を全て取得
// 取得するデータ、取得する順番を指定して取得する
  const diagnoses = await prisma.diagnosis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      scores:{
        orderBy: { score: "desc" }
      }
    }
  })

  //diagnosis配列をフロントに渡すデータの型に変換
  const formatted = diagnoses.map((diagnosis) =>({
    id: diagnosis.id,
    createdAt: diagnosis.createdAt,
    topNutrients: diagnosis.scores.slice(0, 3)
  }))
  //変換したデータをJSON形式でフロントに返す
  return NextResponse.json(formatted)
}

