import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, answers } = body

    const result = await prisma.$transaction(async (tx) => {
      //Diagnosis(1つの履歴箱)作成
      const diagnosis = await tx.diagnosis.create({
        data: {
          userId,
          status: "COMPLETED",
          completedAt: new Date()
        }
      })

      //回答をフロント形式からDB保存形式へ変換して一括保存(Answerを保存)
      await tx.diagnosisAnswer.createMany({
        data: answers.map((a: any) => ({
          diagnosisId: diagnosis.id,
          questionId: a.questionId,
          value: a.value,
          answeredAt: new Date()
        }))
      })

      //スコア計算

      //スコア集計箱を作成
      const scoreMap: Record<string, number> = {}

      //栄養素ごとに合計点をループでIDを利用して集計
      for (const a of answers) {
        if (!scoreMap[a.nutrientId]) {
          scoreMap[a.nutrientId] = 0
        }
        scoreMap[a.nutrientId] += a.value
      }

      //栄養素ごとの合計スコアが入ったscoreMapをもとに、点数が高い順にrankingを作成
      //rankingは表示用に整形されたデータ
      const ranking = Object.entries(scoreMap)
        .map(([nutrientId, total]) => ({ nutrientId, total }))
        .sort((a, b) => b.total - a.total)

        //スコア保存(複数の栄養素スコアを一括保存)
        //DB保存用にrankingをDBのカラム名に合わせて再整形してる
        await tx.diagnosisNutrientScore.createMany({
          data: ranking.map((r) => ({
            diagnosisId: diagnosis.id,
            nutrientId: r.nutrientId,
            score: r.total
          }))
        })

        return {
          diagnosisId: diagnosis.id,
          ranking
        }
    })

    return Response.json(result)
  } catch (error) {
    console.error(error)
    return Response.json({ error: "保存に失敗しました" }, { status: 500 })
  }
}
