// web/app/api/diagnosis/answers/route.ts

// 作成済み diagnosis に1問分の回答を保存するAPI
// 診断開始API(web/app/api/diagnosis/start)で作成済みのdiagnosisのID(diagnosisId)をクライアントから受け取り、
// ログイン中ユーザー本人の診断であることを確認したうえで回答を保存するAPI
// 最後の質問の場合、スコア保存・診断完了・結果ページURL返却を行う

// 役割
// クライアントから送られた token を Authorization ヘッダーから受け取る。
// tokenを元に Supabase でログイン中ユーザーを確認する
// body から diagnosisId / questionId / value / order を受け取る
// その diagnosisId がログイン中ユーザー本人のものか確認する
// 本人の diagnosis に対して、1問分の回答(DiagnosisAnswer)を upsert でまとめて保存する
// 最後の質問でなければ currentStep を次の番号に更新し、次の質問URL(nextHref)を渡す
// 最後の質問なら、全回答を集計して DiagnosisNutrientScore を保存し、Diagnosis を完了状態に更新する
// 成功 / 失敗のレスポンスを共通型 SaveDiagnosisAnswersResponse で返す
// 開始APIで作成した診断(diagnosis)を再利用して、回答(diagnosisAnswer)をまとめて保存している
// 本人確認をtoken検証で行い、さらにその診断(diagnosis)が本人のものであるかを確認し、
// 本人の診断(diagnosis)にしか回答し、保存できないようにしている




// このAPIがやること

// 1問分の回答を保存する
// token からログイン中ユーザーを確認する
// diagnosisId + userId で本人の診断か確認する
// 1問1回答を upsert で保存している
// 最後の質問の場合、栄養素スコアを集計して DiagnosisNutrientScore に保存する
// 最後の質問の場合、Diagnosis を COMPLETED に更新する
// transaction でまとめて更新している
// questionId と order の不一致の場合、弾いてる
// Bearer token形式 に対応している
// 次に遷移するURLを nextHref として返す




// このAPIがやらないこと

// 新しく Diagnosis を作成しない
// クライアントから userId を受け取らない
// API Route内で redirect() しない
// 画面遷移は行わない
// 回答フォームの表示は行わない






// bodyで受け取る値

// diagnosisId: どの診断に対する回答か
// questionId: どの質問に対する回答か
// value: 回答値
// order: 現在の質問番号






// userIdをbodyから受け取らない理由

// userId はクライアントから送らせず、Authorization ヘッダーの token を使って
// サーバー側で Supabase から取得する。
// これにより、他人の userId を送って回答を保存する流れを防ぐ。






// 認可処理

// diagnosisId と Supabase から取得した user.id を使って Diagnosis を検索する。
// 一致する Diagnosis が存在しない場合は、本人の診断ではないため 403 Forbidden を返す。
// これにより、他人の diagnosisId に回答を保存できないようにする。





// 回答保存の考え方

// DiagnosisAnswer は「1つの診断 × 1つの質問 = 1回答」のため、
// createMany ではなく upsert を使う。
// 初回回答なら create、同じ質問に再回答した場合は update する。





// 最後の質問ではない場合

// 回答保存後、Diagnosis の currentStep を order + 1 に更新する。
// レスポンスで次の質問ページのURLを nextHref として返す。
// 例: /diagnosis/step/2?diagnosisId=xxx




// 最後の質問の場合

// 回答保存後、今回の診断に紐づく全回答を取得する。
// 質問IDから栄養素IDをたどり、栄養素ごとの合計スコアを計算する。
// 古い DiagnosisNutrientScore を削除し、新しいスコアを保存する。
// Diagnosis を COMPLETED に更新し、completedAt を保存する。
// レスポンスで結果ページのURLを nextHref として返す。





// transaction を使う理由

// 最後の質問では、以下の複数のDB更新をまとめて行うため。
// ・古い DiagnosisNutrientScore の削除
// ・新しい DiagnosisNutrientScore の作成
// ・Diagnosis の完了更新
// 途中で失敗した場合に中途半端な状態を残さないため、prisma.$transaction を使う。





// レスポンスの考え方
// 成功時: { success: true, nextHref: "..." }
// 認証失敗時: { success: false, message: "Unauthorized" }
// 認可失敗時: { success: false, message: "Forbidden" }
// リクエスト不正時: { success: false, message: "Invalid request body" }
// サーバーエラー時: { success: false, message: "Failed to save diagnosis answer" }
// スコア計算失敗時: { success: false, message: "Failed to calculate score" }
// フロントとサーバーで共通型 SaveDiagnosisAnswersResponse を使い、レスポンスの形をそろえる。










// 全体の流れ

// AnswerForm.tsx
//   ↓
// Authorization: Bearer token
// diagnosisId / questionId / value / order を渡す
//   ↓
// api/diagnosis/answers/route.ts
//   ↓
// Bearer tokenからtoken本体を取り出す
//   ↓
// Supabaseに token を渡し、user 確認(ログインユーザーかを確認)
//   ↓
// diagnosisId + user.id で本人の診断か確認
//   ↓
// questionId + order が正しい組み合わせか確認
//   ↓
// DiagnosisAnswerをupsert で回答をまとめて保存
//   ↓
// 最後の質問か判定
//   ├─ No
//   │   ↓
//   │ currentStep更新
//   │   ↓
//   │ 次の質問URLを返す
//   │
//   └─ Yes
//       ↓
//       全回答取得
//       ↓
//       栄養素ごとにスコア集計
//       ↓
//       scoreRows作成(保存用スコア配列を作成)
//       ↓
//       古いscores削除
//       ↓
//       新しいscores保存
//       ↓
//       DiagnosisをCOMPLETEDに更新
//       ↓
//       結果ページURLを返す








import { prisma } from "@/lib/prisma";
import { createClientForServer } from "@/lib/supabase/server";
import type {
  SaveDiagnosisAnswersRequest,
  SaveDiagnosisAnswersResponse,
} from "@/types/diagnosisApi";
import { NextRequest, NextResponse } from "next/server";

// 回答1件分の型
type AnswerItem = {
  questionId: string;
  value: number;
};

// 質問と栄養素の対応関係を表す型
type QuestionItem = {
  id: string;
  nutrientId: string;
};

// 栄養素の合計スコアをDB保存用の1行分のスコアデータの型
type ScoreRow = {
  nutrientId: string;
  total: number;
};

// 質問一覧から、質問IDと栄養素IDの対応表を作成
function buildQuestionMap(questions: QuestionItem[]) {
  // 質問IDと栄養素IDの対応表
  const questionMap: Record<string, string> = {};

  for (const q of questions) {
    questionMap[q.id] = q.nutrientId;
  }

  return questionMap;
}

// 回答一覧と質問→栄養素の対応表を使って、栄養素ごとの合計点を作る関数
function buildScoreMap(
  answers: AnswerItem[],
  questionMap: Record<string, string>
) {
  // 栄養素ごとの合計点を入れる箱
  const scoreMap: Record<string, number> = {};

  // 回答の questionId から、対応する nutrientId を取り出す
  for (const a of answers) {
    const nutrientId = questionMap[a.questionId];

    // 対応する栄養素IDがなければその回答をスキップ
    if (!nutrientId) continue;

    // その栄養素の合計点に、回答値を足す
    scoreMap[nutrientId] = (scoreMap[nutrientId] ?? 0) + a.value;
  }

  return scoreMap;
}

// scoreMap を保存用の配列に変換する
// 栄養素ごとの合計点を、保存しやすい配列形式に変換する
// 表示順はresult/route.ts 側で並び替える。ここでは変換だけ行う。
function buildScoreRows(scoreMap: Record<string, number>): ScoreRow[] {
  return Object.entries(scoreMap).map(([nutrientId, total]) => ({
    nutrientId,
    total,
  }));
}




// POSTリクエストを受け取るAPI関数
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Unauthorized",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    if (!authHeader.startsWith("Bearer ")) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Invalid authorization format",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    //クライアントが送ってきたリクエストヘッダーからAuthorization(token)を取得
    const token = authHeader.replace("Bearer ", "").trim();

    // tokenがない場合は、未ログインとして扱い、
    // 回答保存を許可しないために「401 Unauthorized」を返す
    if (!token) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Unauthorized",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // サーバー側Supabaseクライアントを作成
    const supabase = createClientForServer();

    //tokenをSupabaseに渡して、そのtokenのユーザーを確認(ログイン中かどうか)(認証処理)
    const { data, error, } = await supabase.auth.getUser(token);
    // Supabaseから返ってきたユーザー情報を取り出す
    const user = data.user;

    if (error || !user) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Unauthorized",
      };
      return NextResponse.json(responseBody, { status: 401 });
    }

    //リクエストbodyをJSONとして読み取り、型をつける
    const body: SaveDiagnosisAnswersRequest = await request.json();
    // bodyから必要な値を取り出す
    // userIdは受け取らない
    const { diagnosisId, questionId, value, order } = body;

    //bodyの中身が正しいかチェック
    if (
      !diagnosisId ||
      !questionId ||
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      typeof order !== "number" ||
      !Number.isInteger(order)
    ) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Invalid request body",
      };
      return NextResponse.json(responseBody, { status: 400 });
    }

    // 本人の診断か確認(認可処理)
    // diagnosisId と user.id の両方が一致するもの
    // 診断の id で診断の存在だけ確認
    const diagnosis = await prisma.diagnosis.findFirst({
      where: { 
        id: diagnosisId,
        userId: user.id,
      },
      select: { 
        id: true,
        status: true,
      },
    });

    if (!diagnosis) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Forbidden",
      };

      return NextResponse.json(responseBody, { status: 403 });
    }

    // 完了済みの診断の場合は回答を保存させない
    if (diagnosis.status === "COMPLETED") {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Diagnosis already completed",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 質問総数チェック
    // 今の order が最後の質問かどうか判断するため
    const total = await prisma.diagnosisQuestion.count();

    if (total === 0 || order < 1 || order > total) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Invalid step",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // questionId と order が本当に対応しているかのチェック
    const question = await prisma.diagnosisQuestion.findFirst({
      where: {
        id: questionId,
        order,
      },
      select: {
        id: true,
      },
    });

    if (!question) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Invalid question",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 回答を保存(upsert)
    // 初回回答 → create
    // 再回答 → update
    await prisma.diagnosisAnswer.upsert({
      where: {
        diagnosisId_questionId: {
          diagnosisId,
          questionId,
        },
      },
      update: {
        value,
        answeredAt: new Date(),
      },
      create: {
        diagnosisId,
        questionId,
        value,
        answeredAt: new Date(),
      },
    });

    // 現在の質問が最後かどうか判定
    const isLast = order >= total;



    // 最後の質問の場合の処理
    // スコア集計・完了処理実行



    if (isLast) {

      // 今回の診断に紐づく回答一覧を全て取得
      const answers = await prisma.diagnosisAnswer.findMany({
        where: { diagnosisId },
        select: {
          questionId: true,
          value: true,
        },
      });

      // 質問IDと栄養素IDの対応表を取得
      const questions = await prisma.diagnosisQuestion.findMany({
        select: {
          id: true,
          nutrientId: true,
        },
      });

      // 質問ID → 栄養素ID の対応表を作成
      const questionMap = buildQuestionMap(questions);
      // 回答一覧を元に、栄養素ごとの合計点を作成
      const scoreMap = buildScoreMap(answers, questionMap);
      // スコアマップをDB保存用のスコア配列に変換
      const scoreRows = buildScoreRows(scoreMap);

      // スコアが算出できていない(scoreRowsが空)場合はエラー
      if (scoreRows.length === 0) {
        const responseBody: SaveDiagnosisAnswersResponse = {
          success: false,
          message: "Failed to calculate score",
        };

        return NextResponse.json(responseBody, { status: 400 });
      }

      // 複数のDB更新を$transactionでまとめて実行
      await prisma.$transaction(async (tx) => {
        // 同じ診断IDの既存スコア削除
        await tx.diagnosisNutrientScore.deleteMany({
          where: { diagnosisId },
        });

        // 栄養素ごとのスコアをまとめて保存
        await tx.diagnosisNutrientScore.createMany({
          data: scoreRows.map((row) => ({
            diagnosisId,
            nutrientId: row.nutrientId,
            score: row.total,
          })),
        });

        // 診断を完了状態に更新
        await tx.diagnosis.update({
          where: { id: diagnosisId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            currentStep: total,
          },
        });
      });

      // 最後の質問の後の成功レスポンス
      // nextHrefでフロントに次のURL(診断結果ページ)を返す設計
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: true,
        nextHref: `/diagnosis/${diagnosisId}/result`,
      };

      return NextResponse.json(responseBody, { status: 200 });
    }




    // 最後の質問ではない場合の処理


    // 診断の現在ステップ(currentStep)を次の質問番号に更新
    await prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: {
        currentStep: order + 1,
      },
    });

    // 次の質問ページのURLをレスポンスに入れる
    const responseBody: SaveDiagnosisAnswersResponse = {
      success: true,
      nextHref: `/diagnosis/step/${order + 1}?diagnosisId=${diagnosisId}`,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    // catch (error)で予期しないエラーの場合の処理
    console.error("failed to save diagnosis answer:", error);

    const responseBody: SaveDiagnosisAnswersResponse = {
      success: false,
      message: "Failed to save diagnosis answer",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}
