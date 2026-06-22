// web/app/api/diagnosis/step/route.ts

// 全体の概要
// - 診断ステップ画面(`web/app/diagnosis/step/[step]/page.tsx`)から呼ばれて、現在のURL の step に対応する質問データを返すAPI
// - サーバー側で本人確認してDBから質問を取得





// ポイント
// - diagnosis.currentStep: DB に保存されている、現在、ユーザーが進めるべきステップ
// - stepNum: URL から取得した、画面に表示しようとしているステップ番号

// 例. 
// if (diagnosis.currentStep !== stepNum) {...} は以下を比較する。
// 現在はステップ3までしか進んでいないのに、
// URLを直接書き換えてステップ5を見ようとしている
// ↓
// 表示させない






// このファイル内の流れ

// `web/app/diagnosis/step/[step]/page.tsx`
// ↓
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
// ↓
// `web/app/api/diagnosis/step/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// diagnosisId + user.id で本人の診断か確認
// ↓
// currentStep(現在のステップ) と stepNum(URLで指定された表示したいstep番号) を比較
// ↓
// 質問数 total を取得
// ↓
// order = stepNum の質問を1件取得
// ↓
// question / total / isLast を返す




// 全体の流れ

// `web/app/diagnosis/step/[step]/page.tsx` を開く
//   ↓
// `/diagnosis/step/1?diagnosisId=xxx`
//   ↓
// useParams で URL から step を取る
//   ↓
// useSearchParams で diagnosisId を取る
//   ↓
// Supabase session から token を取る
//   ↓
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
//   ↓
// `web/app/api/diagnosis/step/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// Prismaで diagnosisId + user.id で本人の診断かどうかを確認
//   ↓
// currentStep と URL の step が一致するか比較し、確認
//   ↓
// 質問数 total を取得
//   ↓
// DiagnosisQuestion から order = step の番号に合う質問を取得
//   ↓
// page.tsx に以下を返す(質問データ)
// {
//   success: true,
//   question,
//   total,
//   isLast
// }
//   ↓
// page.tsx が画面に質問を表示
//   ↓
// AnswerForm.tsx で回答を入力
//   ↓
// POST /api/diagnosis/answers
//   ↓
// `/api/diagnosis/answers` に回答保存成功
//   ↓
// nextHref へ移動
// 次の質問ページ(`web/app/diagnosis/step/[step]/page.tsx`) 
// or
// 結果ページ(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)




import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DiagnosisStepResponse } from "@/types/diagnosisApi";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

// 診断ステップ画面で表示する「現在の質問」を取得するAPI
// - GET /api/diagnosis/step?diagnosisId=xxx&step=1
export async function GET(
  request: NextRequest
): Promise<NextResponse<DiagnosisStepResponse>> {
  try {
    // ----------------------------------認証チェック-------------------------------------------

    // 共通の認証処理を呼び出し、実行
    const authResult = await getAuthenticatedUser(request);

    // ログインしていない・token が不正・token が期限切れ の場合の処理
    if (authResult.error) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }
    
    // ここまで来た場合、ログイン中ユーザーであることが確定する
    // 以降、 user.id を使用可能
    const user = authResult.user;
    // ----------------------------------------------------------------------------------------------

    // URL から diagnosisId と step を取得(クエリパラメータ取得)
    const diagnosisId = request.nextUrl.searchParams.get("diagnosisId");
    const step = request.nextUrl.searchParams.get("step");

    // diagnosisId がない場合
    if (!diagnosisId) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "診断IDがありません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // step が URL についてない場合
    if (!step) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "ステップ番号がありません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // step を数値に変換
    // - URL から取得した step は文字列。数値にする必要がある。
    const stepNum = Number(step);

    // step が番号として正しいかチェック
    if (
      !Number.isFinite(stepNum) ||
      !Number.isInteger(stepNum) ||
      stepNum < 1
    ) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "不正なステップ番号です",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // ----------------------------------認可チェック-------------------------------------------

    // diagnosisId と user.id でログイン中ユーザー本人の診断か確認
    // - 「この診断IDは存在するか」と「ログイン中ユーザー本人の診断か」
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
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "診断データが見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }
    // ----------------------------------------------------------------------------------------------

    // 完了済み診断なら step を表示しない
    // - 完了済み診断の質問ページを開く動きを防ぎ、完了済み診断の再回答・回答の変更を防ぐため
    if (diagnosis.status === "COMPLETED") {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "この診断はすでに完了しています",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // currentStep と stepNum が違う場合は表示しない
    // - diagnosis.currentStep: DB に保存されている、現在、ユーザーが進めるべきステップ番号
    // - stepNum: URL で指定された表示したいステップ番号
    // - URL を直接触り、先の質問を表示することを防ぐため
    if (diagnosis.currentStep !== stepNum) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "現在のステップと表示ステップが一致しません",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 全質問数 total を取得
    const total = await prisma.diagnosisQuestion.count();

    // 質問が1件も登録されていない場合
    if (total === 0) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "診断質問が登録されていません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // step が 全質問数(total) を超えてないか確認
    if (stepNum > total) {
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "存在しないステップ番号です",
      };

      return NextResponse.json(responseBody, { status: 404 });
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
      const responseBody: DiagnosisStepResponse = {
        success: false,
        message: "質問が見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // 成功レスポンス
    // - question / total / isLast をフロントに返す(質問データ)
    // - isLast: stepNum === total, 最後の質問かどうか
    const responseBody: DiagnosisStepResponse = {
      success: true,
      diagnosisId: diagnosis.id,
      question,
      total,
      isLast: stepNum === total,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("failed to fetch diagnosis step:", error);

    const responseBody: DiagnosisStepResponse = {
      success: false,
      message: "診断ステップの取得に失敗しました",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}