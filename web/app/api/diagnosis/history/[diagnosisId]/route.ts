// web/app/api/diagnosis/history/[diagnosisId]/route.ts

// 全体の概要
// - 指定した診断IDの履歴詳細を取得するAPI
// - 履歴詳細ページ(web/app/history/[diagnosisId]/page.tsx)から送られてきた Authorizationヘッダー の token からログイン中ユーザーを確認し、
// その本人の診断である場合だけ、本人の診断詳細だけを取得し、栄養スコア一覧・上位3件・下位3件・前回診断との差分をJSONで返すAPI





// 役割
// - 認証・本人確認・DB取得・データ整形






// ポイント

// - 今回の診断を取得
// URLの [diagnosisId] を使って、対象の診断を取得する

// - その診断の栄養スコア一覧とその栄養素の名前を取得
// 関連する DiagnosisNutrientScore を一緒に取得

// - 同じユーザーの前回診断を取得
// 今回より前の日付で最も新しい診断を探す

// - 前回の栄養スコアと比較して差分を作る
// 初回診断の場合は「前回データなし」として扱う

// - 履歴詳細ページに表示用にデータを整形
// 差分表示用に hasPrevious と diffLabel を追加し、
// 「+10 改善 / -5 低下 / 0 変化なし / 前回データなし」を返せるようにする。

// - Diagnosis から scores を取る(scores は Diagnosis から見た relation 名)
// - scores の中の nutrient も取る(nutrient は DiagnosisNutrientScore から見た relation 名)
// - 画面用に nutrientScores を作る(表示は nutrient.name,比較は nutrientId)
// - topNutrients を作る
// - lowNutrients を作る
// - previousDiagnosis と比べて differences を作る(findFirst + orderBy desc で「前回診断」)
// - diffで前回スコアがあるとき差分計算する。
// - diffLabel に差分の内容ごとに表示する文言を表示







// - このファイル内の流れ

// 履歴一覧ページを開く
// ↓
// `web/app/history/page.tsx`
// ↓
// `web/app/history/page.tsx` で 履歴一覧(histories)表示
// ↓
// <Link href={`/history/${history.id}`} key={history.id}>
// 診断履歴詳細のリンクを1つクリックで `web/app//history/[diagnosisId]/page.tsx`(診断履歴詳細ページ) へ遷移可能
// ↓
// `web/app/history/[diagnosisId]/page.tsx`
// ↓
// GET /api/diagnosis/history/${diagnosisId}
// `web/app/history/[diagnosisId]/page.tsx` が token を `web/app/api/diagnosis/history/[diagnosisId]/route.ts` へ リクエストを送る
// ↓
// `web/app/api/diagnosis/history/[diagnosisId]/route.ts`
// ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
// ↓
// user.id を取得し、使用可能
// ↓
// URLの [diagnosisId] から diagnosisId(診断ID) を取得
// ↓
// 認可
// 今回の診断を diagnosisId + user.id + COMPLETED で本人の完了済み診断に絞り取得
// ↓
// 前回診断も user.id で本人に絞って取得
// ↓
// 今回の scores を見やすい配列(栄養素+栄養素ID+点数)に整形(nutrientScores)
// ↓
// スコア上位3件を作る(topNutrients)
// ↓
// スコア下位3件を作る(lowNutrients)
// ↓
// 同じnutrientIdを元に前回との差分を作る(differences)
// ↓
// 前回データがあるか判定
// ├─ ある → diff を計算
// └─ ない → 前回データなし
// ↓
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
// `web/app/history/[diagnosisId]/page.tsx` で返ってきた値・データを元に画面に診断履歴詳細を表示










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
// `/history/page.tsx` が token を `/api/diagnosis/history` へ リクエストを送る
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







// NextResponseはAPIの返り値を作るため(JSONを返す時)
import { NextResponse } from "next/server";
// prismaはDB操作のため
import { prisma } from "@/lib/prisma";
import type { GetDiagnosisHistoryDetailResponse } from "@/types/diagnosisApi";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

// GETリクエストが来た時に実行する関数
// - `/api/diagnosis/history/[diagnosisId]` にアクセスされたときに、
// params.diagnosisId が URL の [diagnosisId] に入っている diagnosisId(診断ID) の値を元に履歴詳細を取得し返す
export async function GET(
  request: Request,
  { params }: { params: Promise<{ diagnosisId: string }> }
) {
  try {
    // --------------------------------------認証チェック---------------------------------------------

    // 共通の認証処理を呼び出し、実行
    const authResult = await getAuthenticatedUser(request);

    // ログインしていない・token が不正・token が期限切れ の場合の処理
    if (authResult.error) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // ここまで来た場合、ログイン中ユーザーであることが確定する
    // 以降、 user.id を使用可能
    const user = authResult.user;
    // -------------------------------------------------------------------------------------------

    // URL の [diagnosisId] にある diagnosisId(診断ID) を取得・確認
    const { diagnosisId } = await params;

    // [diagnosisId] に diagnosisId(診断ID) 無い場合
    if (!diagnosisId) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "診断IDが必要です",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // ----------------------------------認可チェック-------------------------------------------
    // 本人の診断だけ1件取得
    // - DBから今回の診断ID(diagnosisId: diagnosisId)を ログイン中ユーザー本人の診断(userId: user.id)に絞り、
    // 完了済み(status: "COMPLETED")の診断の中から1件取得
    // - URL の ID が正しくても、ログイン中ユーザー本人の診断でなければ取得できない状態
    const currentDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        id: diagnosisId,
        userId: user.id,
        status: "COMPLETED",
      },
      include: {
        scores: {
          include: { nutrient: true },
        },
      },
    });

    if (!currentDiagnosis) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "診断結果が見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }
    // -------------------------------------------------------------------------------------------


    // 保存済みスコアが無い場合のエラー処理
    // - 本来は診断完了時にscoresにスコアが保存される想定
    // - このエラーの場合、保存処理の不具合の可能性がある(完了済み診断なのにスコアが存在しない場合)
    if (currentDiagnosis.scores.length === 0) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "診断スコアが見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // 前回診断の取得
    // - 前回の診断(今回より前の診断だけ)をDBから 「userId: user.id」 で完了済みの本人の診断の中で1番新しい診断に絞り取得
    const previousDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        userId: user.id,
        status: "COMPLETED",
        createdAt: {
          lt: currentDiagnosis.createdAt,
        },
      },
      include: {
        scores: {
          include: { nutrient: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 栄養素スコアデータを画面表示用に整形
    // - 今回の栄養スコアを使いやすい形(配列)に整えて、栄養スコア一覧を作成
    // - .sort((a, b) => b.score - a.score);でscoreが高い順に並び替え
    const nutrientScores = currentDiagnosis.scores
      .map((score) => ({
        nutrient: score.nutrient.name,
        nutrientId: score.nutrientId,
        score: score.score,
      }))
      .sort((a, b) => b.score - a.score);

    // スコアが高い順の上位3件(満たせている栄養素トップ3)
    const topNutrients = nutrientScores.slice(0, 3);

    // スコアが低い順の上位3件(不足傾向の栄養素トップ3)
    // - nutrientScores で score が高い順に並べ替えた状態(配列)も表示したいので残して元の配列 [...nutrientScores] をコピーして使用
    const lowNutrients = [...nutrientScores]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    // 今回の各栄養素スコアについて前回との差分データ作成
    // - 差分計算する対象を今回診断と同じ栄養素ID(nutrientId)として一致するかどうかで判断して探す
    // - current: 今回の各栄養素スコア1件
    const differences = nutrientScores.map((current) => {
      const previous = previousDiagnosis?.scores.find(
        (item) => item.nutrientId === current.nutrientId
      );

      // 前回の診断結果に対して前回スコアが存在する栄養素なのかを true / false に変換(フロントに返し表示するデータとして使うため)
      const hasPrevious = !!previous;
      // 前回スコアがあればその値を使い、ない時は、nullにする。
      const previousScore = previous?.score ?? null;
      // - 前回スコア(previous) が存在する時は previous.score を使って今回スコア(current.score)との差分計算
      // - 前回スコア(previous) が存在しない時は diff は null にする
      const diff = previous ? current.score - previous.score : null;

      // 差分表示用の文字列
      // - 最初の初期値: "前回データなし"
      let diffLabel = "前回データなし";

      // 差分の内容ごとの表示文の条件分岐
      // - score は高いほど満たせている扱いのため、 diff > 0 を改善として表示する
      // - 今回スコア - 前回スコア がプラスの場合 = 点数が上がっている → 「+〇〇 改善」
      if (diff !== null) {
        if (diff > 0) {
          diffLabel = `+${diff} 改善`;
        } else if (diff < 0) {
          diffLabel = `${diff} 低下`;
        } else {
          diffLabel = "0 変化なし";
        }
      }

      // フロント側(`web/app/history/[diagnosisId]/page.tsx`)に返す用に差分表示用データを作成
      return {
        nutrient: current.nutrient,
        nutrientId: current.nutrientId,
        current: current.score,
        previous: previousScore,
        diff,
        hasPrevious,
        diffLabel,
      };
    });

    const responseBody: GetDiagnosisHistoryDetailResponse = {
      success: true,
      id: currentDiagnosis.id,
      createdAt: currentDiagnosis.createdAt.toISOString(),
      nutrientScores,
      topNutrients,
      lowNutrients,
      differences,
    };

    // JSONで返す
    return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("履歴詳細取得エラー", error);

    const responseBody: GetDiagnosisHistoryDetailResponse = {
      success: false,
      message: "履歴詳細の取得に失敗しました",
    };

    return NextResponse.json(responseBody, { status: 500 });
  }
}