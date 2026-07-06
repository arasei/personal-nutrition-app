// web/app/api/diagnosis/history/route.ts



// 全体の概要
// - ログイン中ユーザーのtokenを確認し、本人の完了済み診断履歴だけを新しい順に取得し、
// 履歴一覧のそれぞれの診断カードに、各診断のスコア(scores)を不足度が高い順(score昇順 "asc" score が低い)に並べ、不足度が高い上位3栄養素と日付を返すAPI



// ポイント
// - lowNutrients = 不足度が高い順の上位3栄養素
// - scores: 各診断の栄養素スコア
// scores: {
//           orderBy: { score: "asc" }, // score が低い順 = 不足度が高い
//           include: { nutrient: true },
//         },

// - 日付のデータの扱い方
// - APIで日付を返すとき
// データとして使いやすい文字列の状態に変換して返す
//   ↓
// toISOString()

// - 画面に日付を表示するとき
//   ↓
// toLocaleDateString()




// - このファイル内の流れ

// 履歴一覧をページを開く
// ↓
// `web/app/history/page.tsx`
// ↓
// GET /api/diagnosis/history/route.ts
// ↓
// `web/app/api/diagnosis/history/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts でログインユーザー情報(user)確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// ログインユーザーの診断履歴をDBから取得
// ↓
// 各診断の scores を score の昇順("asc")(score が低い順)に並べて取得する
// ↓
// score が低い = 不足度が高い
// ↓
// score が低いほど不足しやすい扱いのため、不足度が高い順として先頭3件(lowNutrients)を返す
// ↓
// 履歴一覧表示する為に整形したデータの配列を histories として、作成し、
// 型を付けて `web/app/history/page.tsx` に返す
// ↓
// `web/app/history/page.tsx`
// ↓
// `web/app/history/page.tsx` で履歴一覧(histories)表示






// 全体の流れ

// 履歴一覧ページを開く
//   ↓
// `web/app/history/page.tsx`
//   ↓
// 認証
// useSupabaseSession で token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// GET /api/diagnosis/history/route.ts
// /history/page.tsx が token を /api/diagnosis/history へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/history/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// Prismaで user.id で本人の完了済み診断だけ取得(Prisma で userId: user.id の履歴だけ検索)
//   ↓
// scores を score 昇順(score の低い順 = 不足度が高い順)で取得
//   ↓
// 不足度が高い順で並べたランキングの上位3栄養素(lowNutrients)だけ整形して作成
//   ↓
// 履歴一覧表示に必要な値(histories) を `web/app/history/page.tsx` に返す
//   ↓
// `web/app/history/page.tsx`
//   ↓
// `web/app/history/page.tsx` で data.histories(履歴一覧)を画面に表示
//   ↓
// <Link href={`/history/${history.id}`} key={history.id}>
// 診断履歴詳細のリンクを1つクリックで `web/app/history/[diagnosisId]/page.tsx`(診断履歴詳細ページ) へ遷移可能
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// useParamsで [diagnosisId] を取得
//   ↓
// 認証
// useSupabaseSession で token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// GET /api/diagnosis/history/${diagnosisId}/route.ts
// `web/app/history/[diagnosisId]/page.tsx` が token を `web/app/api/diagnosis/history/[diagnosisId]/route.ts` へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/history/[diagnosisId]/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// URLの [diagnosisId] から diagnosisId(診断ID) を取得
//   ↓
// 認可
// 今回の診断を diagnosisId + user.id + COMPLETED で本人の完了済み診断に絞り取得
//   ↓
// 前回診断も user.id で本人に絞って取得
//   ↓
// 今回の scores を見やすい配列(栄養素+栄養素ID+点数)に整形(nutrientScores)
//   ↓
// スコア上位3件を作る(topNutrients)
//   ↓
// スコア下位3件を作る(lowNutrients)
//   ↓
// 同じnutrientIdを元に前回との差分を作る(differences)
//   ↓
// 前回データがあるか判定
// ├─ ある → diff を計算
// └─ ない → 前回データなし
//   ↓
// createdAt を toISOString() で文字列にする
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` に 診断履歴詳細を表示するために
// 必要な値(
// success: true,
// id: currentDiagnosis.id,
// createdAt: currentDiagnosis.createdAt.toISOString(),
// nutrientScores,
// topNutrients,
// lowNutrients,
// differences,
// ) を返す
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` で画面に診断履歴詳細を表示







import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import type {
  DiagnosisHistoryItem,
  GetDiagnosisHistoryResponse,
} from "@/types/diagnosisApi";


export async function GET(request: Request) {
  try {
    // ----------------------------------認証チェック-----------------------------------------------

    // 共通の認証処理を呼び出し、実行
    const authResult = await getAuthenticatedUser(request);

    // ログインしていない・token が不正・token が期限切れ の場合の処理
    if (authResult.error) {
      const responseBody: GetDiagnosisHistoryResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // ここまで来た場合、ログイン中ユーザーであることが確定する
    // 以降、 user.id を使用可能
    const user = authResult.user;
    // -------------------------------------------------------------------------------------------



    // ----------------------------------認可チェック-------------------------------------------
    // ログイン中ユーザー本人の診断履歴だけを完了済みに絞り、DBから取得
    // - 取得するデータ、取得する順番を指定して取得する
    // - scores: score を低い順に並べた栄養素(不足度が高い順)
    // - score: "asc" → 昇順、scoreの低い順に並べる。scoreが低いほど不足度が高い扱いのため、昇順で並べることで不足度が高い順になる
    // - slice(0, 3) → 上位3件だけを取得するために、配列の先頭から3件だけを抜き取る
    // - score が 低い順 "asc"(不足している順番・0に近い)
    // - score が 高い順 "desc"(満たしている順番・0から遠い)
    const diagnoses = await prisma.diagnosis.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        // score を低い順に並べた栄養素(不足度が高い順)
        scores: {
          orderBy: { score: "asc" },
          include: { nutrient: true },
        },
      },
    });
    // ----------------------------------------------------------------------------------------------

    // diagnosis配列をフロントに渡すデータの型に変換
    // - toISOString() → APIやDB連携で使いやすい、標準的な文字列にする。データとして送るために使う
    // - slice(0, 3) → 上位3件だけを取得するために、配列の先頭から3件だけを抜き取る
    // - score が低い順に並んだ栄養素(scores)から、不足傾向が高い先頭3件を lowNutrients として返す
    const formatted: DiagnosisHistoryItem[] = diagnoses.map((diagnosis) => ({
      id: diagnosis.id,
      createdAt: diagnosis.createdAt.toISOString(),
      lowNutrients: diagnosis.scores.slice(0, 3).map((score) => ({
        nutrientId: score.nutrientId,
        nutrientName: score.nutrient.name,
        score: score.score,
      })),
    }));

    const responseBody: GetDiagnosisHistoryResponse = {
      success: true,
      histories: formatted,
    };

    // 変換したデータをJSON形式でフロントに返す
    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("診断履歴取得APIエラー:", error);

    const responseBody: GetDiagnosisHistoryResponse = {
      success: false,
      message: "診断履歴の取得に失敗しました",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}


