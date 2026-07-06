// web/app/api/diagnosis/answers/route.ts


// 全体の概要
// - 作成済み diagnosis に1問分の回答を保存するAPI
// 診断開始API(`web/app/api/diagnosis/start`)で作成済みのdiagnosisのID(diagnosisId)をクライアントから受け取り、
// ログイン中ユーザー本人の診断であることを確認したうえで回答を保存し、
// 最後の質問の場合、スコア計算し保存・診断完了・結果ページURLを返却を行うAPI


// 役割
// - ユーザーが質問1問回答する度に呼ばれるAPI
// - ログインしているか
// - その診断は本人のものか
// - 完了済み診断ではないか
// - 回答値は正しいか
// - 今回答すべきstepか
// - questionIdはそのstepのものか
// - 全質問に回答済みか
// - スコア計算できるか



// ポイント
// - 新しく Diagnosis を作成しない
// - クライアントから userId を受け取らない
// - API Route内で redirect() しない
// - 画面遷移は行わない
// - 回答フォームの表示は行わない




// - このファイル内の流れ

// AnswerForm.tsx
// ↓
// POST /api/diagnosis/answers
// ↓
// `web/app/api/diagnosis/answers/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// 認可
// diagnosisId + user.id で本人確認
// ↓
// 回答値が1〜3か確認
// ↓
// currentStep(現在回答するべきステップ) と order(現在の回答ステップ) が一致するか確認
// ↓
// questionId と order が一致するか確認
// ↓
// 回答保存
// ↓
// 最後でなければ次のstepへ
// ↓
// 最後ならスコア計算して COMPLETED にする
// ↓
// `AnswerForm.ts`に 結果ページURL(nextHref)を返す




// 全体の流れ

// `web/app/diagnosis/step/[step]/AnswerForm.tsx`
// ↓
// ユーザーが回答を入力
// ↓
// POST /api/diagnosis/answers
// ↓
// `web/app/api/diagnosis/answers/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// diagnosisId / questionId / value / order を作る
// ↓
// 認可
// diagnosisId + user.id で本人確認
// ↓
// 回答値が1〜3か確認
// ↓
// Diagnosis が COMPLETED 済みではないか確認
// ↓
// currentStep と order が一致するか確認
// ↓
// questionId と order が一致するか確認
// ↓
// 最後の質問か判定
// ↓
// 最後の質問ではない場合
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
// ↓
// `AnswerForm.tsx` に nextHref(結果ページURL) を返す
// ↓
// `web/app/api/diagnosis/answers/route.ts` から返ってきた nextHref に router.push で遷移
// 次の質問ページ(`web/app/diagnosis/step/[step]/page.tsx`) 
// or
// 結果ページ(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)







import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import type {
  SaveDiagnosisAnswersRequest,
  SaveDiagnosisAnswersResponse,
} from "@/types/diagnosisApi";

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
// - 表示順はresult/route.ts 側で並び替える。ここでは変換だけ行う。
function buildScoreRows(scoreMap: Record<string, number>): ScoreRow[] {
  return Object.entries(scoreMap).map(([nutrientId, total]) => ({
    nutrientId,
    total,
  }));
}




// POSTリクエストを受け取るAPI関数
export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------認証チェック---------------------------------------------

    // 共通の認証処理を呼び出し、実行
    const authResult = await getAuthenticatedUser(request);

    // ログインしていない・token が不正・token が期限切れ の場合の処理
    if (authResult.error) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // ここまで来た場合、ログイン中ユーザーであることが確定する
    // 以降、 user.id を使用可能
    const user = authResult.user;
    // -------------------------------------------------------------------------------------------------

    // リクエストbodyをJSONとして読み取り、型をつける。取得失敗対策行っておく
    // - answers/route.ts で request body としてユーザーの回答値を初めて受け取るため
    // - 以降の本人確認・ステップ確認・回答保存には この body の値 を元に行なっていく重要な値のため
    const body = (await request.json().catch(() => null)) as | SaveDiagnosisAnswersRequest | null;

    if (!body) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "リクエスト内容が正しくありません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }


    // bodyから必要な値(診断ID・質問ID・回答値・順番)を取り出す
    // - userId は body から受け取らない。
    // - Supabase token から取得した user.id を使用するため
    const { diagnosisId, questionId, value, order } = body;


    // 送られてきた bodyの中身が正しいかチェック
    // - 診断ID(diagnosisId) の有無
    // - 質問ID(questionId) の有無
    // - 回答値(value)が整数かどうか
    // - 回答値が 1~3 の数字かどうか
    // - 現在の回答step(order) は整数かどうか
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

    // ----------------------------------認可チェック-------------------------------------------
    // 本人の診断か確認して取得(認可処理)
    // - 指定された diagnosisId と ログイン中ユーザー本人の user.id の両方が一致する診断だけ取得
    // - 他人の diagnosisId を送られても取得できない状態
    // - この診断は本当にログイン中ユーザーのもの を確認
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
        message: "診断が見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }
    // ----------------------------------------------------------------------------------------------

    // 完了済みの診断の場合は回答を再回答できない(保存させない状態)
    if (diagnosis.status === "COMPLETED") {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "この診断はすでに完了しています",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 回答するべきstep(currentStep) と 現在の回答step(order) の一致しているか確認
    // - 「今、この診断は Step 何番を回答する状態か？」・「送られてきた order はそれと一致しているか？」をチェック
    // - URL や request を直接書き換えて、本来の順番ではない質問に回答されることを防ぐため
    if (diagnosis.currentStep !== order) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "現在のステップと回答ステップが一致しません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 質問総数チェック
    // - 今の order が最後の質問かどうか判断するため
    const total = await prisma.diagnosisQuestion.count();

    if (total === 0 || order < 1 || order > total) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "ステップが正しくありません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // questionId と order の対応確認
    // - 送られてきた questionId が、本当にその order の質問か確認
    // - step 1 の画面なのに step 2 の questionId を送る のような不正な送信を防ぐ
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
        message: "質問が正しくありません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 最後の質問かどうか判定
    const isLast = order >= total;

    // 回答保存処理(transaction でまとめて行う)
    // 最後の質問ではない場合
    // - 回答を保存
    // - currentStep を次へ進める
    if (!isLast) {
      await prisma.$transaction(async (tx) => {
        // 回答を保存処理
        // - 回答を保存 → upsert
        // - 初回回答 → create
        // - 再回答 → update
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

        // 次のステップへ進める処理
        // - 診断の現在ステップ(currentStep)を次の質問番号に遷移するため更新
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

      return NextResponse.json(responseBody, { status: 200 });
    }

    // 回答保存処理(transaction でまとめて行う)
    // 最後の質問の場合
    // - 最後の回答保存
    // - 全回答取得
    // - スコア計算
    // - 古いスコア削除
    // - 新しいスコア保存
    // - Diagnosis を COMPLETED に更新
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

      // 今回の診断(diagnosisId)に紐づく全回答を取得
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
      // - 未回答がある場合、診断を完了させない
      // - 全質問数に対して回答数が多すぎる、少なすぎる状態を防ぐため
      if (answers.length !== total) {
        throw new Error("NOT_ALL_QUESTIONS_ANSWERED");
      }

      // 質問ID(diagnosisQuestionId) と 栄養素ID(nutrientId) を取得
      const questions = await tx.diagnosisQuestion.findMany({
        select: {
          id: true,
          nutrientId: true,
        },
      });

      // 質問ID → 栄養素ID の対応表を作成
      const questionMap = buildQuestionMap(questions);
      // 回答一覧 → 栄養素ごとの合計点 の対応表を作成
      const scoreMap = buildScoreMap(answers, questionMap);
      // scoreMap をDB保存用のスコア配列に変換する表を作成
      const scoreRows = buildScoreRows(scoreMap);

      // 回答値の有無・回答値を保存用に変換出来ているかチェック
      if (scoreRows.length === 0) {
        throw new Error("FAILED_TO_CALCULATE_SCORE");
      }

      // 同じ診断IDの古いスコアを削除
      // - 再計算したスコアと2重登録にならないようするため
      await tx.diagnosisNutrientScore.deleteMany({
        where: {
          diagnosisId,
        },
      });

      // 今回の診断の新しい栄養素スコアをまとめて保存
      await tx.diagnosisNutrientScore.createMany({
        data: scoreRows.map((row) => ({
          diagnosisId,
          nutrientId: row.nutrientId,
          score: row.total,
        })),
      });

      // 診断を完了状態("COMPLETED")に更新
      // - この後、結果ページや履歴ページで表示対象になる
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

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("failed to save diagnosis answer:", error);

    // 全質問数に対して同じ回答数が無い場合のエラー処理
    if (error instanceof Error) {
      if (error.message === "NOT_ALL_QUESTIONS_ANSWERED") {
        const responseBody: SaveDiagnosisAnswersResponse = {
          success: false,
          message: "全ての質問に回答してください",
        };

        return NextResponse.json(responseBody, { status: 400 });
      }

      // 回答値が存在しない・回答値を保存用に変換出来ていない(scoreRows が空)場合のエラー処理
      if (error.message === "FAILED_TO_CALCULATE_SCORE") {
        const responseBody: SaveDiagnosisAnswersResponse = {
          success: false,
          message: "スコア計算に失敗しました",
        };

        return NextResponse.json(responseBody, { status: 400 });
      }
    }

    // 回答保存処理内で1つでも失敗している場合のエラー処理
    // - transaction で行なっているため
    const responseBody: SaveDiagnosisAnswersResponse = {
      success: false,
      message: "回答の保存に失敗しました",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}