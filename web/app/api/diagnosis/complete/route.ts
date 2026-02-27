//web/app/api/diagnosis/complete/route.ts

//今は使用していない。将来用の実装

// 診断完了時に「Diagnosis作成→回答保存→スコア計算→栄養素スコア一括保存」を一つのtransactionで実行するAPI

// 全体の流れ
// ユーザーが診断完了ボタンを押す
// サーバーで一気に処理(スコア計算)
// 履歴として完全な1セットを完成させてDBに保存
// 結果ページに遷移して、保存したスコアを表示


// フロント
// ↓ POST
// API
// ↓
// transaction開始
// ↓
// Diagnosis作成
// ↓
// Answerを保存
// ↓
// スコア計算
// ↓
// Score保存
// ↓
// transaction終了
// ↓
// レスポンスを返却


//まずフロントからAPIに送られてきた(POST)診断回答(request body)をconst body = ...で中身をjson形式にして取り出して、
// const { userId, answers } = bodyで必要な値(userId, answers)を抜き取る指定する

//次に、prismaの$transactionを使って、診断結果の保存とスコア計算を一つの処理としてまとめる



//Diagnosis作成
// transaction内で、まずDiagnosis(一つの診断の履歴がわかる箱)を作成して、



//画像を一括保存(Answerを保存)
// その新たに作成したdiagnosisのIDや取り出したanswersの中身をDiagnosisAnswerテーブルの形式に変換して
// diagnosisAnswerに今回の診断結果(answers)をcreateManyで一括保存する
// ここでのanswers.map((a: any) => ({...}))は、フロントから送られてきたanswersをDBに保存出来る形式に変換するための処理
// (a:any)という型を指定して、a.questionIdやa.valueなどの必要な値を抜き取って、
// diagnosisAnswerテーブルのカラムに合わせた形({ diagnosisId: diagnosis.id, questionId: a.questionId, value: a.value, answeredAt: new Date() })に変換している
// aはanswersの中の一つ一つの回答を指し、a.questionIdやa.valueはフロントから送られてきた回答の中の質問IDや回答値を指す
// anyは型の指定で、今回は簡単のためにanyを使ってなんでもok型、型チェックを無効化、実際には適切な型を定義して使用する



//スコア計算
// スコア集計箱(scoreMap)を作成して、answersをループして、栄養素ごとにスコアを集計する

//スコア集計箱を作成
// 集計する形をRecord<string, number>で型を定義して、keyが栄養素、valueがスコアの合計になるようにする
// キー: string 値: number
// こういう箱
// {
//   鉄分: 5,
//   ビタミンB: 3
// }



//栄養素ごとに合計点をループで集計
// forでanswersをループして、scoreMapに栄養素ごとにスコアを足していき最終の栄養素ごとの合計点を計算する
// まだその栄養素がscoreMapに存在しない場合は初期値0としてスタートするために作成。
// if (!scoreMap[a.nutrient]) {
//    scoreMap[a.nutrient] = 0
// }
// 値が今回存在する栄養素はscoreMap[a.nutrient]に今回の回答値(a.value)を足していく



//栄養素ごとに合計スコアが高い順にrankingを作成
// Object.entries(scoreMap)でオブジェクト(scoreMapのキーと値)を[key,value]のペア配列に変換して、
// オブジェクト
// {
//   鉄分: 5,
//   ビタミンB: 3
// }

// 配列
// [
//   ["鉄分", 5],
//   ["ビタミンB", 3]
// ]

// mapで各要素を{nutrient, total}の形式に変換し、(sortしやすい、DB保存しやすい、フロントに渡しやすい)
// .map((["鉄分", 5]) => ({ nutrient: "鉄分", total: 5 }))

// sortでtotalを点数が高い順に並び替える
// これにより、スコアが高い順に栄養素が並ぶrankingが完成する
// b.total - a.total
// 正の値 → bが前
// 負の値 → aが前



//スコア保存(複数の栄養素スコアを一括保存)
// 次に、保存した回答からスコアを計算して、診断IDと栄養素ごとのスコアをDiagnosisNutrientScoreテーブルに保存する
// 最後に、transactionが成功したら診断IDとランキングをレスポンスとして返す

// ranking.map((r) => ({})でDBに保存する形式に変換している。
// DBのmodel DiagnosisNutrientScoreのカラム内のscoreに今回ranking内で計算したtotalを保存したいのでscore: r.totalとしている



import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    //フロントから送られたrequest bodyをreq.json()で取得、
    // その中のuserIdとanswersを分解して使える形にする
    const body = await req.json()
    const { userId, answers } = body

    //$transactionで、複数のDB操作を一つのまとまりとして実行する
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
