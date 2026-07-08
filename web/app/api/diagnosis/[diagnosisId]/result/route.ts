// web/app/api/diagnosis/[diagnosisId]/result/route.ts



// 全体の概要
// - 画面に見せるための結果データを作るAPI
// - ログイン中ユーザー本人の完了済み診断情報だけをDBから取得し、保存済みscores から栄養素ランキングと前回との差分を作ってJSONで返すAPI
// - 「この診断IDの結果を見せて」と言われた時に、本当にその人の結果か確認して、本人のものなら集計して返す仕組み



// 役割
// - ログイン確認
// - 本人の診断か確認
// - 完了済み診断か確認
// - スコアが保存されているか確認
// - ランキング作成
// - 前回診断取得
// - 差分作成
// - 型付きレスポンス返却


// ポイント
// - 回答を栄養素ごとに集計し、前回との差分も作成する
// - previousScoreMap は 前回診断のスコアを入れておく箱
// - ranking は 今回診断の栄養素スコアランキング
// - diffRanking は 今回スコア と 前回スコア の差分





// - このファイル内の流れ

// `web/app/diagnosis/step/[step]/page.tsx`(質問ページ)
// 質問ページ に 返ってきた nextHref に router.push で結果ページへ遷移
// ↓
// GET /api/diagnosis/[diagnosisId]/result
// ↓
// `web/app/api/diagnosis/[diagnosisId]/result/route.ts`(結果ページ)
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// diagnosisId + user.id + COMPLETED で本人の完了済み診断を取得
// ↓
// 保存済み scores を不足順に並べる
// ↓
// 前回診断を探す
// ↓
// 前回との差分を作る
// ↓
// ranking / diffRanking を返す





// - 全体の流れ

// AnswerForm.tsx に結果ページURL を返す
// ↓
// `web/app/api/diagnosis/answers/route.ts` から返ってきた nextHref に router.push で遷移
// 次の質問ページ(`web/app/diagnosis/step/[step]/page.tsx`) 
// or
// 結果ページ(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)
// ↓
// GET /api/diagnosis/[diagnosisId]/result
// ↓
// `web/app/api/diagnosis/[diagnosisId]/result/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token を検証し、ログイン中ユーザー情報(user)を確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// 認可
// Prismaで diagnosisId + user.id で本人の診断かどうかを確認
// ↓
// URL の [id] から params で診断ID(diagnosisId) を取得
// ↓
// diagnosisId + user.id + COMPLETED で本人の診断だけ取得
// ↓
// 栄養素スコアランキング(ranking) 作成
// ↓
// 前回診断スコア(previousDiagnosis) を取得
// ↓
// 前回との差分(diffRanking) 作成
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx` に ranking / diffRanking を返す(本人の診断結果をJSON形式で返す)
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx`
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx` で画面に診断結果(チャート と ランキング) を表示





// このAPIは最後にJSONで診断結果を返すため
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// このAPIが返すJSONの型を指定するため
import type { DiagnosisResultResponse } from "@/types/diagnosisApi";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";


// このAPIが受け取るparamsの型を定義
// - Props は Next.jsがroute.tsに渡してくる内部的な引数の形
type Props = {
  params: Promise<{ diagnosisId: string }>;
};
// ログイン中ユーザーの完了済み診断だけを取得し、
// 保存済みスコアからランキングと前回差分を作成して返す
// - request から Authorization header を取得
// - params から diagnosisId を取得
export async function GET(request: Request, { params }: Props) {
  try {
    // ----------------------------------認証チェック-------------------------------------------

    // 共通の認証処理を呼び出し、実行
    const authResult = await getAuthenticatedUser(request);

    // ログインしていない・token が不正・token が期限切れ の場合の処理
    if (authResult.error) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // ここまで来た場合、ログイン中ユーザーであることが確定する
    // 以降、 user.id を使用可能
    const user = authResult.user;
    // ----------------------------------------------------------------------------------------------

    // URL の [diagnosisId] にある diagnosisId(診断ID) を取得・確認
    const { diagnosisId } = await params;

    // [diagnosisId] に diagnosisId(診断ID) 無い場合
    if (!diagnosisId) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "診断IDが必要です",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // ----------------------------------認可チェック-------------------------------------------
    // 今回の診断結果のデータを1つ取得
    // - 「ログイン中ユーザー本人の完了済み診断」に限定してDBから取得
    // - URL の diagnosisId が存在するが、でもログイン中ユーザー本人の診断ではないという場合、取得できない状態
    // - where: {...}で今回の診断ID(diagnosisId)・ログイン中ユーザー本人の情報(user.id)・完了済み診断("COMPLETED")だけを指定
    // - select: {...}で結果画面に必要な項目だけ指定して取得
    // - id: 今回の診断ID
    // - userId: ログイン中ユーザー情報(前回診断取得に使う)
    // - status: 完了済み診断だけ対象
    // - createdAt: 診断日時(前回診断を探す基準に使う)
    // - scores: この診断に紐づく保存済みスコアを取得・各スコアに紐づく栄養素情報も一緒に取得(ランキング作成に使うため)
    const currentDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        id: diagnosisId,
        userId: user.id,
        status: "COMPLETED",
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        scores: {
          include: { nutrient: true },
        },
      },
    });

    // 今回の診断データが取得できなかった(存在しない診断ID・他人の診断ID・未完了診断)場合のエラー処理
    if (!currentDiagnosis) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "診断結果が見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }
    // ----------------------------------------------------------------------------------------------

    // 保存済みスコアが無い場合のエラー処理
    // - 本来は診断完了時に scores にスコアが保存される想定
    // - このエラーの場合、保存処理の不具合の可能性がある
    if (currentDiagnosis.scores.length === 0) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "診断スコアが見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // 今回の診断の 栄養素scoreランキング を作成
    // - 点数の低い順に不足順ランキングとして並べて表示するため
    // - 「score が低い = 不足している」と判断するため、score 昇順でソートする
    const ranking = [...currentDiagnosis.scores]
      .sort((a, b) => a.score - b.score)
      .map((item) => ({
        nutrientId: item.nutrientId,
        nutrient: item.nutrient.name,
        score: item.score,
      }));

    // 今回の 診断scores より前の 診断scores を1件取得(今回の診断と同じユーザーID(currentDiagnosis.userId)を持つ診断に限定する)
    // - 前回との差分を出すため
    // - { lt: currentDiagnosis.createdAt,} で 今回の診断より前の日付を指定
    // - orderBy: 今回より前の診断の中で1番新しい順で並べる(前回診断を1件だけ取るため)
    // - { scores: true } で前回診断のスコアも取得
    const previousDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        userId: currentDiagnosis.userId,
        status: "COMPLETED",
        createdAt: {
          lt: currentDiagnosis.createdAt,
        },
      },
      orderBy: { createdAt: "desc" },
      include: { scores: true },
    });

    // 前回スコアマップ
    // - 前回スコアを nutrientId ごとに取り出しやすくする

    // 差分計算用の箱(前回の栄養素スコアを入れておくための箱)
    // - key: nutrientId
    // - value: 前回のscore
    const previousScoreMap: Record<string, number> = {};

    // 前回診断のスコア(scores)がある場合、previousScoreMapに前回のスコア(score)を入れる
    // - 初回診断の場合、前回診断データが無いため、previousDiagnosisはnullの可能性がある
    // - previousScoreMap[item.nutrientId] = item.score は 栄養素ID(nutrientId)をキーに前回スコアを保存するための箱
    if (previousDiagnosis) {
      for (const item of previousDiagnosis.scores) {
        previousScoreMap[item.nutrientId] = item.score;
      }
    }

    // 今回スコアと前回スコアの差分を作成
    // - 今回診断のscores(各栄養素ごとのスコアランキング)に対して 前回診断のscores との差分を計算し追加
    // - 画面に「前回+2」、「前回-1」のように表示するため
    const diffRanking = ranking.map((item) => {
      // 栄養素ごとの前回スコア(score)を取得
      const previousScore = previousScoreMap[item.nutrientId];
      // 前回スコア(score) がある場合、計算し差分を出す。
      // - 初回診断の場合、今回スコア(score)のみ表示し、差分は表示しない(null)
      const diff = previousScore !== undefined ? item.score - previousScore : null;
      // 今回診断の栄養素ごとのランキングデータ(前回診断スコアとの差分付き)として `web/app/diagnosis/[diagnosisId]/result/page.tsx` に返す
      return {
        nutrientId: item.nutrientId,
        nutrient: item.nutrient,
        score: item.score,
        diff,
      };
    });

    const responseBody: DiagnosisResultResponse = {
      success: true,
      ranking,
      diffRanking,
    };

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("結果取得APIエラー:", error);

    const responseBody: DiagnosisResultResponse = {
      success: false,
      message: "結果取得に失敗しました",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}


