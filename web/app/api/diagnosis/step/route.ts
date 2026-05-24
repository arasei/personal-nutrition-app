// web/app/api/diagnosis/step/route.ts

// 診断ステップ画面から呼ばれて、現在の質問データを返すAPI
// サーバー側で本人確認してDBから質問を取得


// Authorization token確認

// Supabaseでログインユーザー確認

// diagnosisId + user.id で本人の診断か確認

// step番号チェック

// 質問取得

// total / isLast を返却




// 流れ

// web/app/diagnosis/step/[step]/page.tsx
//   ↓
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
//   ↓
// Authorization: Bearer token
//   ↓
// route.ts
//   ↓
// Supabaseで Authorization token を確認
//   ↓
// user.id を取得し、ログイン中ユーザーかどうかを確認
//   ↓
// Prismaで diagnosisId + user.id で本人の診断かどうかを確認
//   ↓
// DiagnosisQuestion から order = step の番号に合う質問を取得
//   ↓
// page.tsx に以下を返す
// {
//   success: true,
//   question,
//   total,
//   isLast
// }
//   ↓
// page.tsx が質問を表示


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientForServer } from "@/lib/supabase/server";
import type { DiagnosisStepResponse } from "@/types/diagnosisApi";

// 診断ステップ画面で表示する「現在の質問」を取得するAPI
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
export async function GET(
  request:NextRequest
): Promise<NextResponse<DiagnosisStepResponse>> {
  try {
    // フロントから送られてきた Authorization header を取得
    const authorization = request.headers.get("Authorization");

    // Bearer token があるか確認
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { 
          success: false,
          message: "ログインが必要です",
        },
        { status: 401 }
      );
    }

    // Bearer token から Bearer を取り除き、token 本体を取得
    const token = authorization.replace("Bearer ", "").trim();

    // サーバー側の Supabase client を作成
    const supabase = createClientForServer();

    // token を Supabase に渡して、ログイン中ユーザー情報を確認して取得
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    // Supabase側でエラー or userが取得できない場合
    if (error || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "ログイン情報を確認できませんでした",
        },
        { status: 401 }
      );
    }

    // URL から diagnosisId と step を取得(クエリパラメータ取得)
    const diagnosisId = request.nextUrl.searchParams.get("diagnosisId");
    const step = request.nextUrl.searchParams.get("step");

    // diagnosisId がない場合
    if (!diagnosisId) {
      return NextResponse.json(
        {
          success: false,
          message: "診断IDがありません",
        },
        { status: 400 }
      );
    }

    // step が URL についてない場合
    if (!step) {
      return NextResponse.json(
        {
          success: false,
          message: "ステップ番号がありません",
        },
        { status: 400 }
      );
    }

    // step を数値に変換
    // URL から取得した step は文字列。数値にする必要がある。
    const stepNum = Number(step);

    // step が番号として正しいかチェック
    if (
      !Number.isFinite(stepNum) ||
      !Number.isInteger(stepNum) ||
      stepNum < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "不正なステップ番号です",
        },
        { status: 400 }
      );
    }

    // diagnosisId と user.id でログイン中ユーザー本人の診断か確認
    // 「この診断IDは存在するか」と「ログイン中ユーザー本人の診断か」
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

    // 診断がない or 本人の診断ではない場合
    if (!diagnosis) {
      return NextResponse.json(
        {
          success: false,
          message: "診断データが見つかりません",
        },
        { status: 404 }
      );
    }

    // 完了済み診断なら step を表示しない
    // 完了済み診断の質問ページを開く動きを防ぎ、完了済み診断の回答の変更を防ぐため
    if (diagnosis.status === "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          message: "この診断はすでに完了しています",
        },
        { status: 400 }
      );
    }

    // currentStep と stepNum が違う場合は表示しない
    // URL を直接触り、先の質問を表示することを防ぐため
    if (diagnosis.currentStep !== stepNum) {
      return NextResponse.json(
        {
          success: false,
          message: "現在のステップと表示ステップが一致しません",
        },
        { status: 400 }
      );
    }

    // 全質問数 total を取得
    const total = await prisma.diagnosisQuestion.count();

    // 質問が1件も登録されていない場合
    if (total === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "診断質問が登録されていません",
        },
        { status: 404 }
      );
    }

    // step が 全質問数(total) を超えてないか確認
    if(stepNum > total) {
      return NextResponse.json(
        {
          success: false,
          message: "存在しないステップ番号です",
        },
        { status: 404 }
      );
    }

    // order = stepNum に対応する質問を取得
    const question = await prisma.diagnosisQuestion.findFirst({
      where: {
        order: stepNum,
      },
      select: {
        id: true,
        questionText: true,
        order: true,
      },
    });

    // step に対応する質問が見つからなかった場合
    if (!question) {
      return NextResponse.json(
        {
          success: false,
          message: "質問が見つかりません",
        },
        { status: 404 }
      );
    }

    // 成功レスポンス
    // question / total / isLast をフロントに返す(質問データ)
    // isLast: stepNum === total, 最後の質問かどうか
    return NextResponse.json({
        success: true,
        diagnosisId: diagnosis.id,
        question,
        total,
        isLast: stepNum === total,
    });
  } catch (error) {
    console.error("failed to fetch diagnosis step:", error);

    return NextResponse.json(
      {
        success: false,
        message: "診断ステップの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}