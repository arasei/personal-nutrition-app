// 各質問ごとに回答を保存し、最後の質問の時だけ栄養素スコアを計算してDiagnosisNutrientScoreに保存し、
// 診断を完了状態に更新結果ページへ遷移するServer Actionページ

//各質問毎に回答保存する用のServer Action(stepページ用)
//DBに回答データ(DiagnosisAnswer)を保存できる状態にすることが主な目的

//このServer Actionページの役割
// 回答保存
// 次の質問への遷移
// 最後の質問かどうかの判定
// 全回答取得(今回の診断の全回答を取得する)
// 栄養素集計(栄養素ごとに回答値を合計してスコアを作る)
// 結果保存(履歴比較に必要な結果データを保存)
// 完了更新(診断完了状態に更新)
// 結果ページ遷移




//流れ
// 質問に答える
//    ↓
// saveAnswer が呼ばれる
//    ↓
// DiagnosisAnswer を保存
//    ↓
// 最後の質問か判定
//    ├ いいえ → 次の質問へ
//    └ はい
//         ↓
//       全回答を取得
//         ↓
//       質問と栄養素の対応表を取得
//         ↓
//       栄養素ごとに点数を集計
//         ↓
//       DiagnosisNutrientScore を保存
//         ↓
//       Diagnosis を COMPLETED に更新
//         ↓
//       結果ページへ




"use server";

import { prisma } from "@/lib/prisma";
//次の質問ページや結果ページへ遷移するために使用
import { redirect } from "next/navigation";

//関数で使用する値の型定義
// 関数の返り値がわかりやすくするため
type AnswerItem = {
  questionId: string;
  value: number;
};

type QuestionItem = {
  id: string;
  nutrientId: string;
};

type RankingItem = {
  nutrientId: string;
  total: number;
};

//questionId→nutrientId対応表を作成する関数
// 質問ID(questionId)をキーにして、その質問に対応する栄養素ID(nutrientId)を登録
// 質問IDから栄養素IDをすぐ引ける状態により回答集計をしやすくするため
function buildQuestionMap(questions: QuestionItem[]) {
  const questionMap: Record<string, string> = {};

  for (const q of questions) {
    questionMap[q.id] = q.nutrientId;
  }

  return questionMap;
}

//回答一覧から1問ずつに対応する栄養素ごとに集計して栄養素ごとの集計スコア表を作成する関数
// DiagnosisNutrientScoreを保存する元データを作るため
function buildScoreMap(answers: AnswerItem[], questionMap: Record<string, string>) {
  const scoreMap: Record<string, number> = {};

  for (const a of answers) {
    const nutrientId = questionMap[a.questionId];

    if (!nutrientId) continue;

    if (!scoreMap[nutrientId]) {
      scoreMap[nutrientId] = 0;
    }

    scoreMap[nutrientId] += a.value;
  }

  return scoreMap;
}

//scoreMapをDB保存用に配列に変換すし、スコアが高い順に並び替える関数
// createManyに渡す時、.map()、.sort()、では配列の形にする必要があるため
function buildRanking(scoreMap: Record<string, number>): RankingItem[] {

  return Object.entries(scoreMap)
    .map(([nutrientId, total]) => ({
      nutrientId,
      total,
    }))

    .sort((a, b) => b.total - a.total);
}

//回答保存処理
export async function saveAnswer(formData: FormData) {
  //formDataから必要な値を取得
  //取得したdiagnosisId, questionId, answer, orderの受け取り方を以下で指定する
  // フォーム側とサーバー側両方で同じキー(diagnosisId, questionId, answer, order)を指定して値をやりとりする設計
  const diagnosisId = formData.get("diagnosisId") as string;//診断ID
  const questionId = formData.get("questionId") as string;//質問ID
  const answerRaw = formData.get("answer");//回答値
  const orderRaw = formData.get("order");//現在の質問の順番

  //取得した値は指定通りかand存在するか(nullでは無いこと)チェック
  // いずれかが欠けている場合はエラーを投げる
  if (!diagnosisId || !questionId || !answerRaw || !orderRaw) {
    throw new Error ("Invalid form data");
  }
  
  //answer, orderを数値に変換し、変換後の値が数値として正しいかチェック
  // フォーム値は文字列として受け取るため、数値として計算するため
  const answer = Number(answerRaw);
  const order = Number(orderRaw);

  if (!Number.isFinite(answer) || !Number.isInteger(answer)) {
    throw new Error("Answer must be a integer");
  }
  if (!Number.isFinite(order) || !Number.isInteger(order)) {
    throw new Error("Order must be a integer");
  }


  //Prisma Clientを使ってDBに回答を保存する場所、方法を指定して処理
  // 同じ診断の中の、同じ質問の回答は1件だけしか保存できないことを指定
  // upsertで回答を「DBに無ければ作る」、「DBにあれば更新する」その後保存する
  // 初回回答→新規作成(create)
  // 再回答→更新(update)
  await prisma.diagnosisAnswer.upsert({
    where: {
      diagnosisId_questionId: {
        diagnosisId: diagnosisId,
        questionId: questionId,
      },
    },
    update: {
      value: answer,
      answeredAt:new Date(),
    },
    create: {
      diagnosisId: diagnosisId,
      questionId: questionId,
      value: answer,
      answeredAt: new Date(),
    }
  })

  //次の質問へ遷移処理(redirect)
  // 次の質問ページに遷移する際、診断ID(diagnosisId)をクエリパラメータで渡し、引き継ぐ設計

  //質問数の合計をDBから取得
  // 質問の順番(order)は0始まりで、質問数(total)は1始まりのため、order >= totalで最後の質問かどうかを判定するために必要
  const total = await prisma.diagnosisQuestion.count();

  //if(order >= total){...}で最後の質問かどうかを判定
  //最後の質問の時に結果保存処理を行い、結果ページへ遷移する
  //orderは現在の質問の順番(0始まり)、totalは質問の総数
  if (order >= total) {
    //その診断に紐づく全回答を取得
    // 今回の診断ID(diagnosisId)に属する診断回答(DiagnosisAnswer)を全件取得
    // 栄養素スコアは1問分ではなく全回答の合計で算出するため
    const answers = await prisma.diagnosisAnswer.findMany({
      where: { diagnosisId: diagnosisId },
      select: {
        questionId: true,
        value: true,
      },
    });

    //質問ID(questionId)と栄養素ID(nutrientId)の対応表を取得
    // questionIdのままではどの栄養素へ加点すれば良いかわからないため
    // questionIdを元にnutrientIdを取得できるようにする
    const questions = await prisma.diagnosisQuestion.findMany({
      select: {
        id: true,
        nutrientId: true,
      },
    });

    //関数を使って対応表・合計スコア・ランキングを作成
    const questionMap = buildQuestionMap(questions);
    const scoreMap = buildScoreMap(answers, questionMap);
    const ranking = buildRanking(scoreMap);

    
    //同じ診断IDの既存スコアを削除
    // 再診断の際に古いスコアを残さない
    // 重複保存を防ぐため
    await prisma.diagnosisNutrientScore.deleteMany({
      where: { diagnosisId },
    });

    //栄養スコアをDBに保存
    // ここで初めて履歴詳細・結果ページが読む結果データが保存される
    // currentDiagnosisId, nutrientId, scoreのセットを診断ごとに保存する
    // currentDiagnosis.scoresを成立させるため
    // この処理が無いと結果ページと履歴ページでスコアが0点のままになってしまう
    await prisma.diagnosisNutrientScore.createMany({
      data: ranking.map((r) => ({
        diagnosisId,
        nutrientId: r.nutrientId,
        score: r.total, 
      })),
    });

    //診断を完了状態に更新
    // Prisma Studioで見た時に「途中保存」ではなく「完了済み診断」とわかるようにするため
    await prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    redirect(`/diagnosis/${diagnosisId}/result`);
  } else {
    redirect (`/diagnosis/step/${order + 1}?diagnosisId=${diagnosisId}`);
  }
}

