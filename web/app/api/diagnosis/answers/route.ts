import { prisma } from "@/lib/prisma";


//schema.prismaに設計した型(model DiagnosisResult)に必要なID,値をbodyとしてまとめて書きやすく

//$transaction(async (tx) => {...})
// 中の処理は途中でエラーが起これば全部処理失敗
// エラーが起こらなければ全部成功
// txは「transaction用prisma」

//const diagnosisResult...
// この人がこの診断をしたというヘッダー
// idは自動生成(cuid)

//await tx.diagnosisAnswer.create({...});
// 1件ずつcreateはしない
// createManyで速く、安全にcreateする

//JSは「1行だけifに属する」という仕様のためifの後ろにreturn追加

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
      //DiagnosisResultを作成
      const diagnosisResult = await tx.diagnosisResult.create({
        data: {
          userId,
          diagnosisId,
        },
      });
      //DiagnosisAnswerをまとめて作成
      await tx.diagnosisAnswer.createMany({
        data: answers.map((answer: AnswerInput) => ({
          diagnosisResultId: diagnosisResult.id,
          diagnosisId,
          questionId: answer.questionId,
          value: answer.value,
        })),
      });
      return diagnosisResult;
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