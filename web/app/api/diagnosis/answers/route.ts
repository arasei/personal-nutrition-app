//このAPIは
// 診断回答のリクエストを受け取り、
// 診断結果と回答一覧ををtransactionでまとめて保存するAPI

//DBで増えるもの
// DiagnosisResultが1件増える
// DiagnosisAnswerが複数件増える

//DiagnosisResultとDiagnosisAnswerを作るために必要な情報は何か？

//ID系(紐付けるため)
// userId
// diagnosisId
// questionId

//値系(意味のあるデータ)
// value(回答の値)

//フロントで自然に作れる形にする
// フロント側のイメージ
// const answers = [
//       { questionId: "q_1", value: 3},
//       { questionId: "q_2", value: 1},
// ];
//これをそのまま送れる形にする


//一つにまとめる
//bodyを決めます
//POST(新規保存)
// {
//   "userId": "user_123",
//   "diagnosisId": "nutrition_basic",
//   "answers": [
//     { "questionId": "q_1", "value": 3 }
//     { "questionId": "q_2", "value": 1 }
//   ]
// }

//PUTとPOSTの違いを整理

//POST(初回)
// DiagnosisResultを作る
// Answerを作る
// {
//   "userId": "user_123",
//   "diagnosisId": "nutrition_basic",
//   "answers": [...]
// }

//PUT(更新)
// 既存のDiagnosisResultを更新
// 更新にuserIdとdiagnosisIdは不要
// Answerを入れ替える
// {
//   "diagnosisResultId": "res_001",
//   "answers": [...]
// }

//余計なものは入れない
// ❌ createdAt
// ❌ updatedAt
// ❌ score（まだ計算してない）

// 👉 DBが勝手にやることは送らない


//型として書いてみる
//設計図

//POST
// type SaveDiagnosisResult = {
//   userId: String;
//   diagnosisId: String;
//   answers: {
//     questionId: String;
//     value: number;
//   }[];
// };

//PUT
// type UpdateDiagnosisRequest = {
//   diagnosisResultId: String;
//   answers: {
//     questionId: String;
//     value: number;
//   }[];
// };

//transactionと対応しているか確認
// answers.map(a => ({
//   diagnosisResultId,
//   questionId: a.questionId,
//   value: a.value
// }))

//1対1で対応している
//変換が起こらない
//ミスが起きにくい


//流れイメージ

// [ユーザー]
//    ↓ 回答
// [フロント state]
//    ↓ そのまま送信
// [API body]
//    ↓ そのまま保存
// [DB]


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