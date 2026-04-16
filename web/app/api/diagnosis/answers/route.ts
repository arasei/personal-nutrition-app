// 作成済み diagnosis に回答を保存するAPI
// 診断開始API(web/app/api/diagnosis/start)で作成済みのdiagnosisのID(diagnosisId)をクライアントから受け取り、そのdiagnosisに対する回答を保存するためのAPI

// 役割
// クライアントから送られた token を使って、ログイン中ユーザーを確認する
// body から diagnosisId と answers を受け取る
// その diagnosisId がログイン中ユーザー本人のものか確認する
// 本人の diagnosis に対して、回答一覧(DiagnosisAnswer)をまとめて保存する
// 成功 / 失敗のレスポンスを返す
// 開始APIで作成した診断(diagnosis)を再利用して、回答(diagnosisAnswer)をまとめて保存している
// 本人確認をtoken検証で行い、さらにその診断(diagnosis)が本人のものであるかを確認し、
// 本人の診断(diagnosis)にしか回答し、保存できないようにしている




// answers/route.tsは新しくdiagnosisを作らない

// 今は diagnosisId は body から受けたもの を使っています。

// bodyで受けるのはdiagnosisIdとanswers

// userIdはクライアントから受け取らない。
// tokenを使い、サーバー側でSupabaseから取得するため
// tokenはAuthorizationヘッダーで送る

// 他人のdiagnosisIdには保存しない
// そのため、diagnosisIdの所有者チェックが必要


// 今の設計では $transaction が必須ではない
// ・主な書き込み処理が DiagnosisAnswer の createMany(...) 1回だから
// ・Diagnosis の新規作成は開始APIで行っており、このAPIでは行わないから


// レスポンスの考え方
// ・成功時: { success: true }
// ・失敗時: { success: false, message: "..." }
// ・フロントとサーバーで共通型を使って、レスポンスの形をそろえる






// 全体の流れ
// フロントから token + diagnosisId + answers を送信
//   ↓
// answers/route.ts
//   ↓
// Authorizationヘッダーから token を取得
//   ↓
// Supabaseにtokenを送ってログイン中ユーザーを確認
//   ↓
// body から diagnosisId と answers を取得
//   ↓
// 必須チェック
//   ↓
// diagnosisId が本人のものか確認
//   ↓
// DiagnosisAnswer を createMany でまとめて保存
//   ↓
// 成功レスポンスを返す



import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import {
  SaveDiagnosisAnswersRequest,
  SaveDiagnosisAnswersResponse,
} from "@/types/diagnosisApi";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    //クライアントが送ってきたAuthorizationヘッダーからtokenを取得
    const token = request.headers.get("Authorization") ?? "";

    //tokenをSupabaseに送ってログイン中ユーザーを確認(認証処理)
    const { data: { user }, error, } = await supabase.auth.getUser(token);

    if (error || !user) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Unauthorized",
      };
      return NextResponse.json(responseBody, { status: 401 });
    }

    //bodyからdiagnosisIdとanswersを受け取る
    const body: SaveDiagnosisAnswersRequest = await request.json();
    const { diagnosisId, answers } = body;

    //必須チェック
    if (
      !diagnosisId ||
      !Array.isArray(answers) ||
      answers.length === 0 ||
      answers.some(
        (answer) =>
          !answer.questionId ||
          typeof answer.value !== "number"
      )
    ) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Invalid request body",
      };
      return NextResponse.json(responseBody, { status: 400 });
    }

    //diagnosisIdが本人のものか確認(認可処理)
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      select: { id: true, userId: true },
    });

    if (!diagnosis || diagnosis.userId !== user.id) {
      const responseBody: SaveDiagnosisAnswersResponse = {
        success: false,
        message: "Forbidden",
      };

      return NextResponse.json(responseBody, { status: 403 });
    }

    //回答を保存
    await prisma.diagnosisAnswer.createMany({
      data: answers.map((answer) => ({
        diagnosisId,
        questionId: answer.questionId,
        value: answer.value,
      })),
    });

    const responseBody: SaveDiagnosisAnswersResponse = {
      success: true,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("failed to save diagnosis answers:", error);

    const responseBody: SaveDiagnosisAnswersResponse = {
      success: false,
      message: "Failed to save diagnosis answers",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}
