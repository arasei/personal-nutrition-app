// web/app/api/diagnosis/start/route.ts


// 診断を開始するためのAPI
// クライアント(StartButton.tsx)からのリクエストを受け取り、Supabase の access_tokenを使用して認証されたユーザーを確認し、
// その認証済みユーザーの user.id を使い、Prisma の User テーブルに同じ id の User が存在するようにしてから、
// そのユーザーに紐づく新しい診断レコード(Diagnosis)をPrismaを使用してデータベースに作成し、フロント(StartButton.tsx)に診断ID(diagnosisId)をフロントに返す。


// このAPIの役割
// クライアントから Authorization ヘッダーで token を受け取る(クライアントからのリクエストを受け取る)
// tokenが存在するか確認する。(Supabaseを使用して認証されたユーザーを確認する)
// Supabase Auth に token を渡して、ログイン中ユーザーを確認する
// token が不正、または未ログインの場合は 401 を返す
// Supabase Auth から取得した user.id を使う
// Prisma の User テーブルに同じ id の User がなければ作成する
// tokenが存在し、Userが存在する状態でDiagnosisを1件作成する(Prismaを使用して、認証されたユーザーに関連付けられた新しい診断レコードをデータベースに作成する)
// diagnosisIdを返す(作成された診断レコードのIDをにStartButton.tsx返す)


// このAPIがやらないこと
// 回答保存はしない
// DiagnosisAnswerはまだ作らない
// 診断スコアはまだ作らない
// userIdをbodyから受け取らない(サーバー側でSupabaseから取得するため)


// なぜ userId を body から受け取らないのか
// クライアントから userId を送る形にすると、他人の userId を送れてしまう可能性があるため
// サーバー側で Supabase の token を検証し、ログイン中本人の user.id を使う方が安全なため

// なぜ prisma.user.upsert() を行うのか
// Diagnosis.userId は Prisma の User.id を参照している
// Supabase Auth にユーザーが存在していても、Prisma の User テーブルに同じ id の User がない場合がある
// その状態で Diagnosis を作成すると、Diagnosis_userId_fkey の外部キー制約エラーになる
// そのため、Diagnosis 作成前に User テーブルへ Supabase Auth の user.id を同期する



// 流れ
// /mypage
//   ↓
// 「診断を始める」ボタン
//   ↓
// StartButton.tsx
//   ↓
// Supabase session から token を取得
//   ↓
// token を Authorization ヘッダー で/api/diagnosis/startに送る
//   ↓
// /api/diagnosis/start
//   ↓
// Authorization ヘッダーから token を取得
//   ↓
// tokenがあるか確認
//   ↓
// createClientForServer() で Supabase サーバー用クライアントを作成
//   ↓
// supabase.auth.getUser(token) でtokenをSupabaseに送って、ログイン中ユーザーのモノかどうかを確認
//   ↓
// tokenが不正 / 未ログインならエラー(401)を返す
//   ↓
// tokenが正しいと確認出来た場合、user.id を取得
//   ↓
// prisma.user.upsert() でSupabase Auth の user.id と同じ id の User を Prisma の User テーブルに用意する(同期処理)
//   ↓
// prisma.diagnosis.create() で、その user.id でDiagnosisテーブルにDiagnosisを1件作成
//   ↓
// 作成した diagnosisId をフロント(StartButton.tsx)に返す
//   ↓
// StartButton.tsx が step1 へ遷移



import { prisma } from "@/lib/prisma";
import { createClientForServer } from "@/lib/supabase/server";
import type { StartDiagnosisResponse } from "@/types/diagnosisApi";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      const responseBody: StartDiagnosisResponse = {
        success: false,
        message: "認証情報がありません",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    if (!authHeader.startsWith("Bearer ")) {
      const responseBody: StartDiagnosisResponse = {
        success: false,
        message: "認証形式が正しくありません",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    //クライアントが送ったAuthorization ヘッダーから token を取得
    const token = authHeader.replace("Bearer ", "").trim();

    // tokenがない場合は未ログインとして扱う
    // tokenがあるか空かどうかをチェック
    // 失敗時に返すレスポンスの中身
    // StartDiagnosisResponseを付けることでこのレスポンスが共通型に合っているか確認する
    if (!token) {
      const responseBody: StartDiagnosisResponse = {
        success: false,
        message: "ログインが必要です",
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

    // Prisma の User テーブルに、Supabase Auth の user.id と同じ User が存在するようにする
    // あれば使う(update)・なければ作る(create)
    await prisma.user.upsert({
      where: {
        id: user.id,
      },
      update: {},
      create: {
        id: user.id,
      },
    });

    //DiagnosisテーブルにDiagnosisを1件作成
    // Diagnosis 作成時にログイン中ユーザーへ紐付ける
    // Supabaseから取得した user.id を使用して、この診断をログイン中ユーザー本人の診断として作成
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