//web/app/api/diagnosis/complete/route.ts

//全体の概要
// 診断回答を受け取り、診断履歴を作成し、回答を保存し、栄養素スコアを計算してランキングを保存するAPI
// 診断完了時に「Diagnosis作成→回答保存→スコア計算→栄養素スコア一括保存」を一つのtransactionで実行する

// 全体の流れ
// ユーザーが診断完了ボタンを押す
// サーバーで一気に処理(スコア計算)
// 履歴として完全な1セットを完成させてDBに保存
// 結果ページに遷移して、保存したスコアを表示


// ユーザーが診断完了ボタンを押す(フロント)
// ↓ 
// APIにPOST(POST /api/diagnosis/complete実行)
// ↓
// JSONを受け取る
// ↓
// transaction開始
// ↓
// diagnosis作成
// ↓
// answersを保存
// ↓
// question取得
// ↓
// 栄養素スコア計算
// ↓
// ranking作成
// ↓
// Score保存
// ↓
// transaction終了
// ↓
// レスポンス(result)を返却





import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    //JSON形式で取得
    // フロントから送られたrequest bodyをreq.json()で取得、
    // その中のuserIdとanswersを分解して使える形にする
    const body = await req.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        { error: "JSONが不正です" },
        { status: 400 }
      )
    }

    //JSONから必要な値を取得
    const { userId, answers } = body

    if (!userId || !answers ) {
      return NextResponse.json(
        { error: "userIdまたはanswersが不足しています"},
        { status: 400 }
      )
    }

    //$transactionで、複数のDB操作を一つのまとまりとして実行する
    const result = await prisma.$transaction(async (tx) => {
      //診断履歴作成
      const diagnosis = await tx.diagnosis.create({
        data: {
          userId,
          status: "COMPLETED",
          completedAt: new Date()
        }
      })

      //回答保存
      // 回答をフロント形式からDB保存形式へ変換してDBに一括保存(Answerを保存)
      await tx.diagnosisAnswer.createMany({
        data: answers.map((a: {questionId: string; value: number }) => ({
          diagnosisId: diagnosis.id,
          questionId: a.questionId,
          value: a.value,
          answeredAt: new Date()
        }))
      })

      //スコア計算

      //スコア集計表(箱)を作成
      const scoreMap: Record<string, number> = {}

      //質問データを取得
      const questions = await tx.diagnosisQuestion.findMany({
        select: {
          id: true,
          nutrientId: true
        }
      })

      //質問に対応する栄養素の表(箱)を作成
      const questionMap: Record<string, string> = {}

      //questionMapにデータ登録
      // 質問データからquestionIdをキーにしてnutrientIdを登録
      for (const q of questions) {
        questionMap[q.id] = q.nutrientId
      }

      //栄養素ごとにループでスコア集計
      for (const a of answers) {
        const nutrientId = questionMap[a.questionId]

        //その栄養素がscoreMapに存在しない場合は初期値0として作成。
        if (!scoreMap[nutrientId]) {
          scoreMap[nutrientId] = 0
        }

        //スコア加算
        scoreMap[nutrientId] += a.value
      }


      //栄養素ごとに合計スコアが高い順にrankingを作成
      // const rankingは表示用に整形されたデータ
      // Object.entries(scoreMap)でobject → array(配列)に変換
      // .mapで[]を分解して{}に代入
      // .sortでスコアが高い順に並び替え
      const ranking = Object.entries(scoreMap)
        .map(([nutrientId, total]) => ({ nutrientId, total }))
        .sort((a, b) => b.total - a.total)

        //スコア保存(複数の栄養素スコアを一括保存)
        // DB保存用にrankingをDBのカラム名に合わせて再整形してる
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
