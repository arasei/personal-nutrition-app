"use server";

//各stepで回答保存する用のServer Action(stepページ用)
//DBにDiagnosisAnswerを保存できる状態にする。
//Server Actionが「遷移の部分を行う」

//全体の流れ：
//質問に回答→Server Actionで回答保存→次の質問へリダイレクト

//質問が最後なら結果ページへリダイレクト
//質問ページコンポーネントからform経由で呼び出される
//formDataで必要な値を受け取る設計

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

//回答保存アクション
export async function saveAnswer(formData: FormData) {
  //formDataから必要な値を取得
  //取得したdiagnosisId, questionIdの受け取り方を以下で指定する
  const diagnosisId = formData.get("diagnosisId") as string;//診断ID
  const questionId = formData.get("questionId") as string;//質問ID
  const answerRaw = formData.get("answer");//回答値
  const orderRaw = formData.get("order");//現在の質問の順番

  //取得した値は指定通りかand存在するか(nullでは無いこと)チェック
  //いずれかが欠けている場合はエラーを投げる
  if (!diagnosisId || !questionId || !answerRaw || !orderRaw) {
    throw new Error ("Invalid form data");
  }
  
  //answer, orderを数値に変換し、変換後の値が数値として正しいかチェック
  const answer = Number(answerRaw);
  const order = Number(orderRaw);

  if (!Number.isFinite(answer) || !Number.isInteger(answer)) {
    throw new Error("Answer must be a integer");
  }
  if (!Number.isFinite(order) || !Number.isInteger(order)) {
    throw new Error("Order must be a integer");
  }

  //Prisma Clientを使ってDBに回答を保存
  await prisma.diagnosisAnswer.create({
    data: {
      diagnosis_id: diagnosisId,
      question_id: questionId,
      answer_value: answer,
      answered_at: new Date(),
    },
  });

//次の質問へredirect
//次の質問ページに遷移する際、診断ID(diagnosisId)をクエリパラメータで渡す設計に変更
  redirect (`/diagnosis/step/${order + 1}?diagnosisId=${diagnosisId}`)
}

