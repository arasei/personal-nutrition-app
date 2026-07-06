//診断開始後に送られてきた回答データを受け取り、1回分の診断本体(Diagnosis)を作成して、その診断に属する回答一覧(DiagnosisAnswer)をまとめて保存するAPI

//診断1回分をひとまとまりで保存するためのAPI

//schema.prismaに設計した型(model DiagnosisResult)に必要なID,値をbodyとしてまとめて書きやすく

// 全体の流れ
// フロントから回答送信
//   ↓
// answers/route.ts
//   ↓
// body を受け取る
//   ↓
// 必須チェック
//   ↓
// transaction 開始
//   ↓
// Diagnosis を1件作成
//   ↓
// answers を DiagnosisAnswer 用に変換
//   ↓
// diagnosis.id に紐づけて createMany で保存
//   ↓
// 成功レスポンスを返す


//$transaction(async (tx) => {...})
// 中の処理は途中でエラーが起これば全部処理失敗
// エラーが起こらなければ全部成功
// txは「transaction用prisma」

//const diagnosis...
// この人がした診断1回分の親データを作成
// 各回答が「どの診断に属するか」を決めるため
// idは自動生成(cuid)

//await tx.diagnosisAnswer.createMany({...});
// 回答配列をcreateMany(...)で一括保存。
// 回答は複数存在するので1件ずつではなく、まとめて安全に速く保存。

//JSは「1行だけifに属する」という仕様のためifの後ろにreturn追加


import { prisma } from "@/lib/prisma";

type AnswerInput = {
  questionId: string;
  value: number;
};

export async function POST(req:Request) {
  try {
    //リクエストボディを取得(フロントから送られたJSON)
    const body = await req.json();
    //model DiagnosisResultに必要なid,値をまとめる
    const { userId, diagnosisId, answers } = body;
    //必須チェック(最低限)
    //空のままDBに送らない
    if ( !userId || !diagnosisId || !answers.length ) {
      return Response.json(
        { message: "Invalid request body" },
        { status:400 }
      );
    }
    //transaction開始
    const result = await prisma.$transaction(async (tx) => {
      //Diagnosisを作成
      const diagnosis = await tx.diagnosis.create({
        data: {
          userId,
        },
      });
      //DiagnosisAnswerをまとめて作成
      await tx.diagnosisAnswer.createMany({
        data: answers.map((answer: AnswerInput) => ({
          diagnosisId: diagnosis.id,
          questionId: answer.questionId,
          value: answer.value,
        })),
      });
      return diagnosis;
    });

    //成功レスポンス
    // フロントはこのIDを持って次画面へ
    return Response.json({
      success: true,
      diagnosisResultId: result.id,
    });
  } catch (error) {
    console.error(error);
    //失敗時(自動ロールバック済み)
    return Response.json(
      { message: "Failed to save diagnosis answers" },
      { status: 500 }
    );
  }
}