// web/app/api/diagnosis/history/route.ts


// 履歴APIの設計
// ログイン中ユーザーのtokenを確認し、本人の完了済み診断履歴だけを新しい順に取得するAPI
// 各診断のスコア(scores)を不足度が高い順(score昇順)に並べ、上位3栄養素だけを返す


// ログインユーザーの診断履歴をDBから取得

// 各診断の scores を score の昇順に並べて取得する

// score が低い = 不足度が高い

// score が低いほど不足しやすい扱いのため、不足度が高い順として先頭3件を返す

//フロントに渡すデータの型に変換して返す





// 流れ

// /historyを開く
//   ↓
// Supabaseからsessionを取得
//   ↓
// access_tokenを取り出す
//   ↓
// /api/diagnosis/historyへ送る
//   ↓
// API側でtoken確認
//   ↓
// user.id を取得
//   ↓
// 本人の履歴だけ取得(Prisma で userId: user.id の履歴だけ検索)
//   ↓
// scores を score 昇順で取得
//   ↓
// 上位3栄養素だけ整形
//   ↓
// history/page.tsx に返す
//   ↓
// data.histories(履歴一覧)を画面に表示
//   ↓
// クリックで /history/[id] へ移動



import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClientForServer } from "@/lib/supabase/server";
import type {
  DiagnosisHistoryItem,
  GetDiagnosisHistoryResponse,
} from "@/types/diagnosisApi";


export async function GET(req: Request) {
  try {
    // Authorizationヘッダー から tokenを取得
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      const responseBody: GetDiagnosisHistoryResponse = {
        success: false,
        message: "認証情報がありません",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // Authorizationヘッダー が"Bearer token" の形か確認
    if (!authHeader.startsWith("Bearer ")) {
      const responseBody: GetDiagnosisHistoryResponse = {
        success: false,
        message: "認証形式が正しくありません",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // "Bearer xxxxx" から token部分だけを取り出す
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      const responseBody: GetDiagnosisHistoryResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // Supabaseのサーバー用クライアントを作成
    const supabase = createClientForServer();

    // token をSupabase に確認して、ログイン中ユーザーを取得
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      const responseBody: GetDiagnosisHistoryResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    
    // ログイン中ユーザー本人の診断履歴だけをDBから取得
    // 取得するデータ、取得する順番を指定して取得する
    // score: "asc" → 昇順、scoreの低い順に並べる。scoreが低いほど不足度が高い扱いのため、昇順で並べることで不足度が高い順になる
    // slice(0, 3) → 上位3件だけを取得するために、配列の先頭から3件だけを抜き取る
    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc", },
      include: {
        scores:{
          orderBy: { score: "asc", },
          include: { nutrient: true, },
        },
      },
    });

    //diagnosis配列をフロントに渡すデータの型に変換
    // toISOString() → APIやDB連携で使いやすい、標準的な文字列にする。データとして送るために使う
    const formatted: DiagnosisHistoryItem[] = diagnoses.map((diagnosis) =>({
      id: diagnosis.id,
      createdAt: diagnosis.createdAt.toISOString(),
      topNutrients: diagnosis.scores.slice(0, 3).map((score) => ({
        nutrientId: score.nutrientId,
        nutrientName: score.nutrient.name,
        score: score.score,
      })),
    }));

    const responseBody: GetDiagnosisHistoryResponse = {
      success: true,
      histories: formatted,
    };

    //変換したデータをJSON形式でフロントに返す
    return NextResponse.json(responseBody, {status: 200 });
  } catch (error) {
    console.error("診断履歴取得APIエラー:", error);

    const responseBody: GetDiagnosisHistoryResponse = {
      success: false,
      message: "診断履歴の取得に失敗しました",
    };

    return NextResponse.json(responseBody, {status: 500 });
  }
}


