// web/app/api/diagnosis/start/route.ts

// 診断を開始するためのAPI
// クライアントからのリクエストを受け取り、Supabaseを使用して認証されたユーザーを確認し、
// そのユーザーに関連付けられた新しい診断レコードをPrismaを使用してデータベースに作成し、フロント(StartButton.tsx)に診断IDを返す。


// このAPIの役割
// tokenを受け取る(クライアントからのリクエストを受け取る)
// tokenが本物か確認する。(Supabaseを使用して認証されたユーザーを確認する)
// 本物ならDiagnosisを1件作成する(Prismaを使用して、認証されたユーザーに関連付けられた新しい診断レコードをデータベースに作成する)
// diagnosisIdを返す(作成された診断レコードのIDをクライアントに返す)

// このAPIがやらないこと
// 回答保存はしない
// DiagnosisAnswerはまだ作らない
// userIdをbodyから受け取らない(サーバー側でSupabaseから取得するため)



// 流れ
// /mypage
//   ↓
//   ↓
// StartButton.tsx
//   ↓
// token を Authorization で/api/diagnosis/startに送る
//   ↓
// /api/diagnosis/start
//   ↓
//   ↓
// クライアントからリクエスト(token)を受け取る
//   ↓
// Authorizationからtoken取得
//   ↓
// tokenがあるか確認
//   ↓
// createClientForServer()
//   ↓
// tokenをSupabaseに送って、このtokenはログイン中ユーザーのモノかどうかを確認
//   ↓
// tokenが不正 / 未ログインならエラーを返す
//   ↓
// tokenが確認出来た場合、user.id を取得
//   ↓
// その user.id でDiagnosisテーブルにDiagnosisを1件作成
//   ↓
// 作成した diagnosisId をフロント(StartButton.tsx)に返す
//   ↓
// StartButton.tsx が step1 へ遷移



import { prisma } from "@/lib/prisma";
import { createClientForServer } from "@/lib/supabase/server";
import { StartDiagnosisResponse } from "@/types/diagnosisApi";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    //クライアントが送ったAuthorization ヘッダーから token を取得
    const token = request.headers.get("Authorization") ?? "";

    // tokenがない場合は未ログインとして扱う
    // tokenがあるか空かどうかをチェック
    // 失敗時に返すレスポンスの中身
    // StartDiagnosisResponseを付けることでこのレスポンスが共通型に合っているか確認する
    if (!token) {
      const responseBody: StartDiagnosisResponse = {
        success: false,
        message: "Unauthorized",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // サーバー側でSupabaseを使う為にクライアント作成
    const supabase = createClientForServer();

    //token を Supabase に送って、ログイン中ユーザーのモノであるか確認し、 user.id を取得する
    const { data, error } = await supabase.auth.getUser(token);
    const user = data.user;

    //token が不正 / 未ログイン(user === null)ならエラーを返す
    // この場合は、Diagnosisを作成しない
    if (error || !user) {
      const responseBody: StartDiagnosisResponse = {
        success: false,
        message: "Unauthorized",
      };
      return NextResponse.json(responseBody, { status: 401 });
    }

    //DiagnosisテーブルにDiagnosisを1件作成
    // Supabaseから取得した user.id を使用
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
    // 作成した diagnosisId をStartDiagnosisResponseの共通の型でStartButton.tsxに返す
    const responseBody: StartDiagnosisResponse = {
      success: true,
      diagnosisId: diagnosis.id,
    };
    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    //失敗レスポンス
    // StartDiagnosisResponseの共通の型で返す
    console.error("Failed to start diagnosis:", error);

    const responseBody: StartDiagnosisResponse = {
      success: false,
      message: "Failed to start diagnosis",
    };
    return NextResponse.json(responseBody, { status: 500 });
  }
}