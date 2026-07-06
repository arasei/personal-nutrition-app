// web/app/api/diagnosis/start/route.ts


// 全体の概要
// - 診断を開始するためのAPI

// - ログイン中ユーザーの token を検証し、本人用の Diagnosis レコードを新しく作成して diagnosisId を返すAPI

// - フロント(`web/app/diagnosis/start/StartButton.tsx`)からのリクエストを受け取り、Supabase の access_tokenを使用して認証されたユーザーを確認し、
// その認証済みユーザーの user.id を使い、Prisma の User テーブルに同じ id の User が存在するのか確認し、なければ作成する、
// そのユーザーに紐づく新しい診断レコード(Diagnosis)をPrismaを使用してデータベースに作成し、フロント(`web/app/diagnosis/start/StartButton.tsx`)に診断ID(diagnosisId)をフロントに返す。





// このAPIの役割
// - getAuthenticatedUser(request) で認証する
// - getAuthenticatedUser(request) で Authorization token を検証し、ログイン中ユーザーを取得する
// - token が不正、または未ログインの場合は 401 を返す
// - Supabase Auth から取得した user.id を使う
// - Prisma の User テーブルに同じ id の User がなければ作成する
// - tokenが存在し、Userが存在する状態でDiagnosisを1件作成する(Prismaを使用して、認証されたユーザーに関連付けられた新しい診断レコードをデータベースに作成する)
// - diagnosisIdを返す(作成された診断レコードのIDをフロント(`web/app/diagnosis/start/StartButton.tsx`)に返す)





// ポイント
// - `web/app/api/diagnosis/start/route.ts` は認可に使う diagnosisId を作成する段階なので、
// 既存の diagnosisId に対する認可チェックは行わない
// ただし、誰でも作成できてはいけないため、認証は必須
// - 認証済みの userId を使って Diagnosis を作成することで、他人の userId で診断を作成できないようにしている
// - 回答保存はしない
// - DiagnosisAnswerはまだ作らない
// - 診断スコアはまだ作らない
// - userIdをbodyから受け取らない(サーバー側でSupabaseから取得するため)





// - このファイル内の流れ

// `web/app/diagnosis/start/page.tsx`
//   ↓
// ユーザーが ボタン「診断を始める」を押す
//   ↓
// `web/app/diagnosis/start/StartButton.tsx`
//   ↓
// useSupabaseSession.ts で token を取得して、ログイン確認
//   ↓
// token を `diagnosis/start/StartButton.tsx` に渡す
//   ↓
// token がない場合は /login へ遷移
// or
// token がある場合は token を付けて `/api/diagnosis/start` を呼ぶ
// POST /api/diagnosis/start
//   ↓
// `web/app/api/diagnosis/start/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// 認証失敗
// tokenが不正 / 未ログインならエラー(401)を返す
//   ↓
// 認証成功
// tokenが正しいと確認出来た場合、user.id を取得
//   ↓
// prisma.user.upsert() でSupabase Auth の user.id と同じ id の User を Prisma の User テーブルに用意する(同期処理)
// あれば使う(update)・なければ作る(create)
//   ↓
// prisma.diagnosis.create() で、その user.id でDiagnosisテーブルにDiagnosisを1件作成
//   ↓
// 作成した diagnosisId をフロント(`web/app/diagnosis/start/StartButton.tsx`)に返す







// - 全体の流れ

// `web/app/diagnosis/start/page.tsx`
// ↓
// ユーザーが ボタン「診断を始める」を押す
// ↓
// `web/app/diagnosis/start/StartButton.tsx` を呼び出す
// ↓
// `web/app/diagnosis/start/StartButton.tsx`
// ↓
// useSupabaseSession.ts で token を取得して、ログイン確認
// ↓
// token を `diagnosis/start/StartButton.tsx` に渡す
// ↓
// token がない場合は /login へ遷移
// or
// token がある場合は token を付けて `/api/diagnosis/start` を呼ぶ
// POST /api/diagnosis/start
// ↓
// `web/app/api/diagnosis/start/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
// ↓
// API側で user.id を取得し、使用可能
// ↓
// API側で Diagnosis 作成
// ↓
// API側から diagnosisId を  `web/app/diagnosis/start/StartButton.ts` に返す
// ↓
// `web/app/diagnosis/start/StartButton.ts`
// ↓
// 返ってきた diagnosisId を使い `/diagnosis/step/1?diagnosisId=xxx` に遷移




import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import type { StartDiagnosisResponse } from "@/types/diagnosisApi";

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------認証チェック---------------------------------------------

    // 共通の認証処理を呼び出し、実行
    const authResult = await getAuthenticatedUser(request);

    // ログインしていない・token が不正・token が期限切れ の場合の処理
    if (authResult.error) {
      const responseBody: StartDiagnosisResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // ここまで来た場合、ログイン中ユーザーであることが確定する
    // 以降、 user.id を使用可能
    const user = authResult.user;
    // -------------------------------------------------------------------------------------------------

    // Prisma の User テーブルに、Supabase Auth の user.id と同じ User が存在するようにする
    // - あれば使う(update)・なければ作る(create)
    // - Supabase Auth にはユーザーがいても、Prisma 側の User テーブルに存在しない場合を防ぐため
    await prisma.user.upsert({
      where: {
        id: user.id,
      },
      update: {},
      create: {
        id: user.id,
      },
    });

    // DiagnosisテーブルにDiagnosisを1件作成
    // - Diagnosis 作成時にログイン中ユーザーへ紐付ける
    // - Supabaseから取得した user.id を使用して、この診断をログイン中ユーザー本人の診断として作成
    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId: user.id,
        currentStep: 1,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
      select: {
        id: true,
      },
    });

    // 成功レスポンス
    // - 作成した diagnosisId をStartDiagnosisResponseの共通の型でStartButton.tsxに返す
    const responseBody: StartDiagnosisResponse = {
      success: true,
      diagnosisId: diagnosis.id,
    };
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    // 失敗レスポンス
    // - StartDiagnosisResponseの共通の型で返す
    console.error("Failed to start diagnosis:", error);

    const responseBody: StartDiagnosisResponse = {
      success: false,
      message: "診断開始に失敗しました",
    };
    return NextResponse.json(responseBody, { status: 500 });
  }
}