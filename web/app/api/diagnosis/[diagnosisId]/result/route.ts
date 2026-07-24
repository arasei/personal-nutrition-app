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
// 差分計算用の共通関数
import { buildScoreDifference } from "@/lib/diagnosis/buildScoreDifference";
// RECOMMENDATION_SCORE_THRESHOLD
// - score < 50 の栄養素だけを対象にするため
// MAX_RECOMMENDATION_NUTRIENTS
// - 最大3栄養素までにするため
import {
  MAX_RECOMMENDATION_NUTRIENTS,
  RECOMMENDATION_SCORE_THRESHOLD,
} from "@/lib/diagnosis/recommendationConfig";


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
    // - 「score が低い = 不足しやすい傾向が高い」と判断するため、score 昇順でソートする
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
    // - 診断結果ページで以下のように表示するために、diffRanking を作成。
    //「前回 +〇〇 改善」
    //「前回 -〇〇 低下」
    //「前回 0 変化なし」
    //「前回データなし」
    const diffRanking = ranking.map((item) => {
      // 同じ栄養素ID の前回スコアを取得
      // - 栄養素ごとに、今回スコア(item.score) と 同じ栄養素ID(nutrientId)を持つ、
      // 前回スコア(previous.score) を 栄養素IDをもとに前回診断から取得する
      const previousScore = previousScoreMap[item.nutrientId];

      // 今回スコア - 前回スコア を行い、差分を `web/lib/diagnosis/buildScoreDifference.ts`(差分計算の共通関数) に渡し、計算
      // - `web/lib/diagnosis/buildScoreDifference.ts`(差分計算の共通関数) に必要な値(diff,hasPrevious,diffLabel,)を渡し、計算し、
      // 返ってきた差分情報をフロントに渡す
      const {
        diff,
        hasPrevious,
        diffLabel,
      } = buildScoreDifference(item.score, previousScore);


      // 今回診断の栄養素ごとのランキングデータ(前回診断スコアとの差分付き)として `web/app/diagnosis/[diagnosisId]/result/page.tsx` に返す
      return {
        nutrientId: item.nutrientId,
        nutrient: item.nutrient,
        score: item.score,
        diff,
        hasPrevious,
        diffLabel,
      };
    });

    // score が低い順(不足しやすい傾向が高い順)に並べ替え作成した ranking を元に提案対象を取り出す
    // - 提案する対象を決める
    const recommendationTargets = [...ranking]
      // 50点未満(49~0)
      .filter((item) => item.score < RECOMMENDATION_SCORE_THRESHOLD,)
      // score が低い順
      .sort((a, b) => a.score - b.score)
      // 先頭から最大3件を指定
      .slice(0, MAX_RECOMMENDATION_NUTRIENTS);

    // 提案の対象栄養素のIDだけを取り出す
    // recommendationTargetIds
    // - 提案を DB から 取得するためのID(recommendationTargetIds) を作る
    // - recommendationTargets から nutrientId だけを取り出した配列。
    // - Prisma の in検索で使用するため
    const recommendationTargetIds = recommendationTargets.map(
      (item) => item.nutrientId,
    );

    // DB から提案の対象になる栄養素ID を元に提案マスターから提案を取得する
    // - findMany で複数の提案データを取得可能(1栄養素につき3件登録しているため、最大 3栄養素×3提案 = 9件)

    // recommendationTargetIds.length > 0
    // - 対象の栄養素が1件以上あるか確認している
    // - 対象が無い場合、DB 検索を行わず、[] を返す
    // - 不要な DB問い合わせ を避けるため
    const recommendationItems = recommendationTargetIds.length > 0 ? await prisma.nutrientRecommendation.findMany({
      // recommendationTargetIds(提案の対象栄養素のID) の栄養素ID を指定して提案を取得する
      where: {
        nutrientId: {
          in: recommendationTargetIds,
        },
      },
      orderBy:[
        {
          nutrientId: "asc",
        },
        {
          type: "asc",
        },
        {
          sortOrder: "asc",
        },
      ],
    }) : [];

    // 結果画面で使いやすいように栄養素ごとに提案をまとめる
    // 提案の対象栄養素(50点未満・scoreが低い順・最大先頭3件)を、1件ずつAPIレスポンス用データに変換する
    // - 診断結果に基づく情報(nutrientId:...・nutrient:...・score:...)を、そのまま提案データにも持たせる
    // 画面側で、
    // 鉄 
    // 今回のスコア: 0点 
    // などを表示しやすくするため

    // .filter(...)
    // - 全提案の中から、現在処理中の栄養素に属するものだけを残す

    // .map(...)
    // - DB のレコードから、画面へ必要な項目だけを取り出す
    const recommendations = recommendationTargets.map((target) => ({
      nutrientId: target.nutrientId,
      nutrient: target.nutrient,
      score: target.score,
      items: recommendationItems
        .filter((recommendation) => recommendation.nutrientId === target.nutrientId,)
        .map((recommendation) => ({
          id: recommendation.id,
          type: recommendation.type,
          title: recommendation.title,
          description: recommendation.description,
          sortOrder: recommendation.sortOrder,
        })),
    }));

    const responseBody: DiagnosisResultResponse = {
      success: true,
      ranking,
      diffRanking,
      recommendations,
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


