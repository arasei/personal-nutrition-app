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






// 全体の流れ

// AnswerForm.tsx
//   ↓
// ユーザーが回答を入力
//   ↓
// 回答値が 1〜3 の整数か確認
//   ↓
// Supabase から token を取得
//   ↓
// diagnosisId / questionId / value / order を作る
//   ↓
// POST /api/diagnosis/answers
//   ↓
// API側で token 確認
//   ↓
// user を取得
//   ↓
// diagnosisId + user.id で本人確認
//   ↓
// Diagnosis が COMPLETED 済みではないか確認
//   ↓
// currentStep と order を確認
//   ↓
// questionId と order を確認
//   ↓
// 最後の質問か判定
//   ↓

// 最後ではない場合
//   ├─ 回答保存
//   ├─ currentStep を次へ更新
//   └─ 次の質問URLを返す

// 最後の質問の場合
//   ├─ 回答保存
//   ├─ 全回答を取得
//   ├─ 栄養素スコア計算
//   ├─ DiagnosisNutrientScore 保存
//   ├─ Diagnosis を COMPLETED に更新
//   └─ 結果ページURLを返す

// AnswerForm.tsx
//   ↓
// APIから返ってきた nextHref に router.push で遷移








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

// 回答一覧を元に、質問→栄養素の対応表を使って、栄養素ごとの合計点を作る関数
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

// scoreMap(栄養素ごとの合計点) をDB保存用の配列に変換する
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
      value < 1 ||
      value > 3 ||
      typeof order !== "number" ||
      !Number.isInteger(order)
    ) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "回答値は1~3の整数で入力してください",
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
        currentStep: true,
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

    // 「今、この診断は Step 何番を回答する状態か？」・「送られてきた order はそれと一致しているか？」をチェック
    // URL を直接触り、本来の順番ではない質問に回答されることを防ぐため
    if (diagnosis.currentStep !== order) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "現在のステップと回答ステップが一致しません",
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

    // 最後の質問かどうか判定
    const isLast = order >= total;

    // 最後の質問ではない場合
    if (!isLast) {
      await prisma.$transaction(async (tx) => {
        // 回答を保存
        // 回答を保存(upsert)
        // 初回回答 → create
        // 再回答 → update
        await tx.diagnosisAnswer.upsert({
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

        // 次のステップへ進める
        // 診断の現在ステップ(currentStep)を次の質問番号に更新
        await tx.diagnosis.update({
          where: {
            id: diagnosisId,
          },
          data: {
            currentStep: order + 1,
          },
        });
      });

      const responseBody: SaveDiagnosisAnswersResponse = {
        success: true,
        nextHref: `/diagnosis/step/${order + 1}?diagnosisId=${diagnosisId}`,
      };

      return NextResponse.json(responseBody, {status: 200 });
    }

    // 最後の質問の場合
    const resultPageHref = await prisma.$transaction(async (tx) => {

      // 最後の回答を保存
      await tx.diagnosisAnswer.upsert({
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

      // 今回の診断に紐づく全回答を取得
      const answers = await tx.diagnosisAnswer.findMany({
        where: {
          diagnosisId,
        },
        select: {
          questionId: true,
          value: true,
        },
      });

      // 全質問数に対して同じ回答数があるかチェック
      // 未回答がある場合、診断を完了させない
      // 全質問数に対して回答数が多すぎる、少なすぎる状態を防ぐため
      if (answers.length !== total) {
        throw new Error("NOT_ALL_QUESTIONS_ANSWERED");
      }

      // 質問ID と 栄養素ID の対応表を取得
      const questions = await tx.diagnosisQuestion.findMany({
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

      // スコアが算出できていない(scoreRows が空)場合はエラー
      if (scoreRows.length === 0) {
        throw new Error("FAILED_TO_CALCULATE_SCORE");
      }

      // 同じ診断IDの古いスコアを削除
      await tx.diagnosisNutrientScore.deleteMany({
        where: {
          diagnosisId,
        },
      });

      // 新しいスコアをまとめて保存
      await tx.diagnosisNutrientScore.createMany({
        data: scoreRows.map((row) => ({
          diagnosisId,
          nutrientId: row.nutrientId,
          score: row.total,
        })),
      });

      // 診断を完了状態に更新
      await tx.diagnosis.update({
        where: {
          id: diagnosisId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          currentStep: total,
        },
      });

      return `/diagnosis/${diagnosisId}/result`;
    });

    const responseBody: SaveDiagnosisAnswersResponse = {
      success: true,
      nextHref: resultPageHref,
    };

    return NextResponse.json(responseBody, {status: 200 });
  } catch (error) {
    console.error ("failed to save diagnosis answer:", error);

    if (error instanceof Error) {
      if (error.message === "NOT_ALL_QUESTIONS_ANSWERED") {
        const responseBody: SaveDiagnosisAnswersResponse = {
          success: false,
          message: "全ての質問に回答してください",
        };

        return NextResponse.json(responseBody, { status: 400 });
      }

      if (error.message === "FAILED_TO_CALCULATE_SCORE") {
        const responseBody: SaveDiagnosisAnswersResponse = {
          success: false,
          message: "Failed to calculate score",
        };

        return NextResponse.json(responseBody, { status: 400 });
      }
    }

    const responseBody: SaveDiagnosisAnswersResponse = {
      success: false,
      message: "Failed to save diagnosis answer",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}