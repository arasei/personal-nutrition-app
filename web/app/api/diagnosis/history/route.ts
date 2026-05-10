// web/app/api/diagnosis/history/route.ts


// 履歴APIの設計
// ログイン中ユーザーのtokenを確認し、本人の診断履歴だけを新しい順に取得するAPI
// 各診断のスコアを不足度が高い順に並べ、上位3栄養素だけを返す


// ログインユーザーの診断履歴をDBから取得

// 各履歴をcreatedAtで各診断のscoresをscoreのtotalの降順に並べて取得(scores を含めるために include を使用)

// 各診断ごとに total の高い順で上位3つだけ取得

//フロントに渡すデータの型に変換して返す





// 流れ

// /history ページ
//    ↓
// Supabaseから access_token を取得
//    ↓
// /api/diagnosis/history に token を送る
//    ↓
// API側で token を確認
//    ↓
// Supabaseから user.id を取得
//    ↓
// Prismaで Diagnosis を userId: user.id の履歴だけ検索
//    ↓
// 不足上位3栄養素だけ整形
//    ↓
// フロントに返す



import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClientForServer } from "@/lib/supabase/server";
import type {
  DiagnosisHistoryItem,
  GetDiagnosisHistoryResponse,
} from "@/types/diagnosisApi"


export async function GET(req: Request) {
  // Authorizationヘッダー から tokenを取得
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "認証情報がありません" },
      { status: 401 }
    );
  }

  // Authorizationヘッダー が"Bearer token" の形か確認
  if (!authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "認証形式が正しくありません" },
      { status: 401 }
    );
  }

  // "Bearer xxxxx" から token部分だけを取り出す
  const token = authHeader.replace("Bearer ", "").trim();

  // Supabaseのサーバー用クライアントを作成
  const supabase = createClientForServer();

  // token をSupabase に確認して、ログイン中ユーザーを取得
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json(
      { error: "ログインが必要です" },
      { status: 401 }
    );
  }

  
  // ログイン中ユーザー本人の診断履歴だけをDBから取得
  // 取得するデータ、取得する順番を指定して取得する
  const diagnoses = await prisma.diagnosis.findMany({
    where: { userId: user.id, },
    orderBy: { createdAt: "desc", },
    include: {
      scores:{
        orderBy: { score: "desc", },
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
    histories: formatted,
  };

  //変換したデータをJSON形式でフロントに返す
  return NextResponse.json(responseBody);
}

