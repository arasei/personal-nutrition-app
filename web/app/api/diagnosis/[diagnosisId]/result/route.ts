// web/app/api/diagnosis/[diagnosisId]/result/route.ts



// 全体の概要
// - 診断結果画面に表示するための結果データを計算し作成した結果を返すAPI
// - 認証済みユーザー本人の完了済み診断情報だけをDBから取得し、今回診断スコア を元に 各栄養素ランキング(ranking)を作成し、
// 前回診断スコアが存在すれば取得し、今回と前回との差分を作ってJSONで呼び出し元に返すAPI
// - 「この診断IDの結果を見る」とユーザーが選択した時に、本当にその人の結果か確認して、本人のものなら集計して返す仕組み



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
// - 今回の各栄養素ランキング・ヒントはゲストと通常ユーザーに提供する
// - 前回診断の取得・差分作成は通常ユーザーの場合だけ行う
// - ゲストには canCompare: false、diffRanking: null を返す
// - ユーザー種別が確認できない場合は403を返す

// - 保存済みの栄養素スコアを取得し、ランキングと前回との差分を作成する
// - previousScoreMap は 前回診断のスコアを入れておく箱
// - ranking は 今回診断の栄養素スコアランキング
// - diffRanking は 今回スコア と 前回スコア の差分





// - このファイル内の流れ

// `web/app/diagnosis/step/[step]/page.tsx`(質問ページ)
// 質問ページ に 返ってきた nextHref に router.push で結果ページへ遷移
// ↓
// GET /api/diagnosis/[diagnosisId]/result
// ↓
// `web/app/api/diagnosis/[diagnosisId]/result/route.ts`(診断結果API)
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
// ranking / diffRanking / recommendations を返す





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
// `web/app/diagnosis/[diagnosisId]/result/page.tsx` に ranking / diffRanking / recommendations を返す(本人の診断結果をJSON形式で返す)
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx`
// ↓
// `web/app/diagnosis/[diagnosisId]/result/page.tsx` で画面に診断結果(チャート・ランキング・食品・料理・行動提案) を表示





// このAPIは最後にJSONで診断結果を返すため
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// このAPIが返すJSONの型を指定するため
import type {
  DiagnosisResultResponse,
  ResultRecommendation,
  ResultComparison,
} from "@/types/diagnosisApi";
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


    // ----------------------------------ユーザー種別を判定-------------------------------------------

    // 検証済みユーザー情報から種別を判定する
    const isMember = user.is_anonymous === false;
    const isGuest = user.is_anonymous === true;

    // ユーザー種別を確認できない場合は、結果を返さない
    // - ユーザー種別が不明な状態を 通常ユーザー や ゲスト として扱わない

    // - 認証できない：既存の 401。
    // - 通常ユーザー：結果取得を続け、比較も許可。
    // - ゲスト：結果取得を続けるが、比較は禁止。
    // - 種別不明：403。
    if (!isMember && !isGuest) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "ユーザー種別を確認できません。",
      };

      return NextResponse.json(responseBody, { status: 403 });
    }


    // ----------------------------------------URL の diagnosisId([diagnosisId]) を確認・取得 ------------------------------------------------------

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
    // scores は DB取得時に score昇順、同点の場合はnutrientId昇順で並べかえて取得
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
          select: {
            nutrientId: true,
            score: true,
            nutrient: {
              select: {
                name: true,
              },
            },
          },
          orderBy: [
            {
              score: "asc",
            },
            {
              nutrientId: "asc",
            },
          ],
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

    // 今回診断の 各栄養素scoreランキング を作成
    // - 点数の低い順に不足順ランキングとして並べて表示する
    // - 「score が低い = 不足しやすい傾向が高い」と判断するため
    // scores はDB取得時にscore 昇順、同点の場合は nutrientId 昇順で並べかえて取得しているので .map で表示するだけ
    const ranking = currentDiagnosis.scores
      .map((item) => ({
        nutrientId: item.nutrientId,
        nutrient: item.nutrient.name,
        score: item.score,
      }));



    // 初期状態では比較データを提供しない
    // - ゲストの場合は、この状態のまま返す
    let comparison: ResultComparison = {
      canCompare: false,
      diffRanking: null,
    };

    // 通常ユーザー(isMember)の場合だけ、前回診断の取得と差分作成を行う
    // - ゲストでは比較データを返さないだけでなく、比較用の取得・計算自体を実行しない構造にする
    if (isMember) {
      // 前回診断の取得
      // - 本人(同じuserId を持つ)の、今回より前回の作成日時の完了済み診断を1件取得する
      // - 今回と前回との差分を計算するため
      // - 今回の診断スコア(scores) より 前回の診断スコア(scores) を 1件取得
      const previousDiagnosis = await prisma.diagnosis.findFirst({
        where: {
          // - 今回の診断と同じuserId を持つ診断に限定
          userId: currentDiagnosis.userId,
          status: "COMPLETED",
          // 今回の診断作成日時より前回作成日時の診断に限定
          createdAt: {
            lt: currentDiagnosis.createdAt,
          },
        },

        // - where内で取得条件を指定し、取得した診断を `orderBy:...` で作成日時の新しい順に並べる
        orderBy: { createdAt: "desc" },
        // 今回スコアと 前回スコア の差分計算に必要な 前回スコア(scores) のみを `include: ...` で限定して取得
        include: {scores: true },
      });

      // 前回スコアマップ作成
      // - 取得した前回スコア(scores)から 栄養素IDごとのscore ごとに入れておくための箱を用意
      // - 差分計算するために必要
      // - 各栄養素ID(nutrientId)をキーに前回の各栄養素スコアを保存する
      // - key(string): nutrientId
      // - value(number): 前回のscore
      const previousScoreMap: Record<string, number> = {};

      // - 前回診断のスコア(previousDiagnosis.scores) がある場合、
      // 前回診断のスコア から 栄養素IDごとのスコア(score) を取り出し、
      // 各栄養素ID ごとに対応した スコアマップ(previousScoreMap) を作成する

      // - 初回診断の場合、前回診断データが無いため、previousDiagnosis は nullの可能性がある
      if (previousDiagnosis) {
        for (const item of previousDiagnosis.scores) {
          previousScoreMap[item.nutrientId] = item.score;
        }
      }

      // 今回診断スコア と 前回診断スコア の差分付きランキング を作成
      // - ユーザー種別が通常ユーザー(isMember)のみ表示する
      // - 共通関数 buildScoreDifference を呼び出し、作成した

      // - 診断結果ページで以下のように表示するために、diffRanking を作成。
      //「+〇〇 改善」
      //「-〇〇 低下」
      //「0 変化なし」
      //「前回データなし」

      // ranking
      // - 今回診断スコア の 各栄養素のスコアが低い順に並べ替え作成したランキング
      const diffRanking = ranking.map((item) => {
        // 同じ栄養素ID の前回スコアを取得
        // - 今回診断のランキング(ranking) で扱う各栄養素 と 同じ栄養素ID を持つ前回診断スコア に対応する表 を作成
        // - 栄養素ごとに、今回スコア(item.score) と 同じ栄養素ID(nutrientId)を持つ、
        // 前回スコア(previous.score) を 栄養素IDをもとに前回診断から取得する
        const previousScore = previousScoreMap[item.nutrientId];

        // 今回スコア(item.score) と 前回スコア(previousScore) を `web/lib/diagnosis/buildScoreDifference.ts`(差分計算専用の共通関数) に渡し、
        // 今回スコア - 前回スコア の差分計算を行った結果を受け取る
        // - `web/lib/diagnosis/buildScoreDifference.ts`(差分計算の共通関数) に必要な値(diff,hasPrevious,diffLabel,)を渡し、計算し、
        // 返ってきた差分情報をフロントに渡す
        const {
          diff,
          hasPrevious,
          diffLabel,
        } = buildScoreDifference(item.score, previousScore)

        // 今回診断の栄養素ごとのランキングデータ(前回診断スコアとの差分付き)として 呼び出し元(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)に返す
        return {
          nutrientId: item.nutrientId,
          nutrient: item.nutrient,
          score: item.score,
          diff,
          hasPrevious,
          diffLabel,
        };
      });

      comparison = {
        canCompare: true,
        diffRanking,
      };
    }




    // 各栄養素スコア(score) が低い順(不足しやすい傾向が高い順)に並べ替え作成した ranking を元に提案対象を取り出す
    // - 提案する対象を決める
    const recommendationTargets = ranking
      // 50点未満(49~0)
      .filter((item) => item.score < RECOMMENDATION_SCORE_THRESHOLD)
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



    // DB から提案の対象になる栄養素ID を元に提案マスターから関連する提案(文章・食品・料理)を取得する
    // - 3つの提案検索は独立しているので、Promise.all で並列実行する
    // - findMany で複数の提案データを取得可能(1栄養素につき3件登録しているため、最大 3栄養素×3提案 = 9件)

    // 提案対象がない場合は空配列のまま返す
    let recommendations: ResultRecommendation[] = [];

    // recommendationTargetIds.length > 0
    // - 対象の栄養素が1件以上あるか確認している
    // - 対象が無い場合、DB 検索を行わず、[] を返す
    // - 不要な DB問い合わせ を避けるため
    if (recommendationTargetIds.length > 0) {
      // 3つのDB検索は互いに依存していないため、`Promise.all` により同時に実行する。
      const [recommendationItems, ingredientLinks, recipeLinks] =
        await Promise.all([
          // 文章による食品・行動提案を取得
          // - recommendationTargetIds(提案の対象栄養素のID) の栄養素ID を指定して提案を取得する
          prisma.nutrientRecommendation.findMany({
            where: {
              nutrientId: {
                in: recommendationTargetIds,
              },
            },
            orderBy: [
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
          }),

          // 栄養素に関連する具体的な食品を取得
          // - recommendationTargetIds(提案の対象栄養素のID) の栄養素ID を指定して食品を取得する

          // 提案対象の栄養素に関連する具体的な食品を DBから取得する
          // - IngredientNutrient は 栄養素と食品の関連を 結んでいる中間テーブル
          // 例. protein(タンパク質) × 鶏むね肉、卵、納豆、豆腐 など
          prisma.ingredientNutrient.findMany({
            where: {
              nutrientId: {
                in: recommendationTargetIds,
              },
            },
            // select で、ingredientNutrient の中の
            // 必要な情報(nutrientId(どの栄養素に関係するか)・ingredient(食品)の id と name )だけを取得する
            select: {
              nutrientId: true,
              ingredient: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              nutrientId: "asc",
            },
          }),

          // 栄養素に関連する具体的な料理を取得
          // - recommendationTargetIds(提案の対象栄養素のID) の栄養素ID を指定して料理を取得する

          // 提案対象の栄養素に関連する料理を DBから取得する
          // - RecipeNutrient は 栄養素と料理の関連を 結んでいる中間テーブル
          // 例. protein(タンパク質) × 親子丼・焼き鮭・冷ややっこ・納豆ご飯 など
          prisma.recipeNutrient.findMany({
            where: {
              nutrientId: {
                in: recommendationTargetIds,
              },
            },
            // select で、recipeNutrient の中の
            // 必要な情報(nutrientId(どの栄養素に関係するか)・recipe(料理)の id と name )だけを取得する
            select: {
              nutrientId: true,
              recipe: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              nutrientId: "asc",
            },
          }),
        ]);


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
      recommendations = recommendationTargets.map((target) => {
        // 現在の栄養素に対応する提案文章を取り出す
        const items = recommendationItems
          .filter((recommendation) => recommendation.nutrientId === target.nutrientId)
          .map((recommendation) => ({
            id: recommendation.id,
            type: recommendation.type,
            title: recommendation.title,
            description: recommendation.description,
            sortOrder: recommendation.sortOrder,
          }));
        return {
          nutrientId: target.nutrientId,
          nutrient: target.nutrient,
          score: target.score,

          // 提案文章の内容(items)を、食品(foodItems)と行動(actionItems)に分けて返す

          // - 食品についての提案文章(foodItems)を、items の中から type が "FOOD" のものだけを指定し、取り出して返す
          foodItems: items.filter(
            (item) => item.type === "FOOD"
          ),

          // - 行動についての提案文章(actionItems)を、items の中から type が "ACTION" のものだけを指定し、取り出して返す
          actionItems: items.filter(
            (item) => item.type === "ACTION"
          ),

          // 具体的な食品の提案(ingredientLinks)を、ingredientLinks の中から nutrientId が現在処理中の栄養素ID(target.nutrientId)と同じものだけを指定し、取り出して返す

          // 全対象栄養素の食品
          // ↓ filter
          // 現在処理中の栄養素に関係する食品だけ残す
          // ↓ map
          // 画面に必要な id・name だけへ変換
          ingredients: ingredientLinks
            .filter((link) => link.nutrientId === target.nutrientId)
            .map((link) => ({
              id: link.ingredient.id,
              name: link.ingredient.name,
            })),

          // 具体的な料理の提案(recipeLinks)を、recipeLinks の中から nutrientId が現在処理中の栄養素ID(target.nutrientId)と同じものだけを指定し、取り出して返す

          // 全対象栄養素の料理
          // ↓ filter
          // 現在処理中の栄養素に関係する料理だけ残す
          // ↓ map
          // 画面に必要な id・name だけへ変換
          recipes: recipeLinks
            .filter((link) => link.nutrientId === target.nutrientId)
            .map((link) => ({
              id: link.recipe.id,
              name: link.recipe.name,
            })),
        };
      });
    }
    // ...comparison によって、判定結果に応じた canCompare と diffRanking が入る。
    const responseBody: DiagnosisResultResponse = {
      success: true,
      ranking,
      recommendations,
      ...comparison,
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


