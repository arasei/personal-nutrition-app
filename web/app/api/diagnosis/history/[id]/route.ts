// web/app/api/diagnosis/history/[id]/route.ts


// 指定した診断IDの履歴詳細を取得するAPI
// 履歴詳細ページ(web/app/history/[id]/page.tsx)から送られてきたAuthorizationヘッダーのtokenからログイン中ユーザーを確認し、
// その本人の診断である場合だけ、本人の診断詳細だけを取得し、
// 栄養スコア一覧・上位3件・下位3件・前回診断との差分をJSONで返すAPI

// 役割
// /api/diagnosis/history/[id]/route.ts
//   ↓
// 認証・本人確認・DB取得・データ整形




//全体の概要
// 1. 今回の診断を取得
// URLの id を使って、対象の診断を取得する

// 2. その診断の栄養スコア一覧とその栄養素の名前を取得
// 関連する DiagnosisNutrientScore を一緒に取得

// 3. 同じユーザーの前回診断を取得
// 今回より前の日付で最も新しい診断を探す

// 4. 前回の栄養スコアと比較して差分を作る
// 初回診断の場合は「前回データなし」として扱う

// 5. 履歴詳細ページに表示用にデータを整形
// 差分表示用にhasPreviousとdiffLabelを追加し、
// 「+10 改善 / -5 低下 / 0 変化なし / 前回データなし」を返せるようにする。


// Diagnosis から scores を取る(scores は Diagnosis から見た relation 名)
// scores の中の nutrient も取る(nutrient は DiagnosisNutrientScore から見た relation 名)
// 画面用に nutrientScores を作る(表示は nutrient.name,比較は nutrientId)
// topNutrients を作る
// lowNutrients を作る
// previousDiagnosis と比べて differences を作る(findFirst + orderBy desc で「前回診断」)
// diffで前回スコアがあるとき差分計算する。
// diffLabelに差分の内容ごとに表示する文言を表示


//このAPIの流れ
// URLの [id] から diagnosisId(診断ID) を取得
//    ↓
// Authorizationヘッダー から token を取得
//    ↓
// token の形式が Bearer形式 か確認
//    ↓
// Supabase で token を検証
//    ↓
// token からログイン中ユーザー user.id を取得
//    ↓
// 今回の診断を diagnosisId + user.id で本人の診断に絞り取得
//    ↓
// 前回診断も user.id で本人に絞って取得
//    ↓
// 今回の scores を見やすい配列(栄養素+栄養素ID+点数)に整形
//    ↓
// スコア上位3件を作る
//    ↓
// スコア下位3件を作る
//    ↓
// 同じnutrientIdを元に前回との差分(diffLabel)を作る
//    ↓
// 前回データがあるか判定
// ├─ ある → diff を計算
// └─ ない → 前回データなし
//    ↓
// createdAt を toISOString() で文字列にして返す
//    ↓
// JSONで返す(履歴詳細ページで使いやすい形に変換して)





// NextResponseはAPIの返り値を作るため(JSONを返す時)
// prismaはDB操作のため
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientForServer } from "@/lib/supabase/server";
import type { GetDiagnosisHistoryDetailResponse } from "@/types/diagnosisApi";

// GETリクエストが来た時に実行する関数
// /api/diagnosis/history/[id]にアクセスされたときに、そのidの履歴詳細を返すため
// params.idがURLの[id]に入っている値。[id]をもとに履歴詳細を取得する
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // URLの[id]に入っている診断IDを取り出す
    const { id: diagnosisId } = await params;

    if (!diagnosisId) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "診断IDが必要です",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // フロント(web/app/history/[id]/page.tsx)から送られてきたAuthorization ヘッダー を取得
    // Authorization ヘッダー にaccess token が入っている。
    const authHeader = request.headers.get("Authorization");

    // Authorization が無い場合は、ログインユーザーを判断できないのでエラーを返す
    if (!authHeader) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "認証情報がありません",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // tokenの形式が正しいかを確認
    // 期待する形
    // 「Bearer xxxxx」
    if (!authHeader.startsWith("Bearer ")) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "認証形式が正しくありません",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }
    
    // Bearer の部分を外して、ログインtoken本体だけにする
    // .trim() で前後の空白を消す
    const token = authHeader.replace("Bearer ", "").trim();

    // token が無い場合もエラー
    if (!token) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // サーバー側でSupabaseを使う準備
    const supabase = createClientForServer();

    // Supabase に token を渡して、このtokenが有効か確認して、 user.id(ログイン中ユーザー本人のID) を取得
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    // token が無効、またはユーザーが取得できない場合は、未ログイン扱いにする
    if (error || !user) {
      const responseBody: GetDiagnosisHistoryDetailResponse = {
        success: false,
        message: "ログインが必要です",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // DBから今回の診断(id: diagnosisId)を完了済みの本人の診断に絞り(userId: user.id)1件取得
    // URL の ID が正しくても、ログイン中ユーザー本人の診断でなければ取得できない状態
    const currentDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        id: diagnosisId,
        userId: user.id,
        status: "COMPLETED",
      },
      include: {
        scores: {
          include: {
            nutrient: true,
          },
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


    // 前回の診断をDBから 「userId: user.id」 で完了済みの本人の診断に絞り取得
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
          include: {
            nutrient: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 今回の栄養スコアを使いやすい形(配列)に整える
    // .sort((a, b) => b.score - a.score);でscoreが高い順に並び替え
    const nutrientScores = currentDiagnosis.scores
      .map((score) => ({
        nutrient: score.nutrient.name,
        nutrientId: score.nutrientId,
        score: score.score,
      }))
      .sort((a, b) => b.score - a.score);
    
    // スコアが高い順の上位3件(満たせている栄養素)
    const topNutrients = nutrientScores.slice(0, 3);

    // スコアが低い順の上位3件(不足傾向の栄養素)
    // nutrientScores で score が高い順に並べ替えた状態(配列)も表示したいので残して元の配列[...nutrientScores]を使用
    const lowNutrients = [...nutrientScores]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    // 今回の各栄養素スコアについて前回との差分データ作成
    // 差分計算する対象を同じ栄養素ID(nutrientId)として一致するかどうかで判断して探す
    // current は、今回の栄養素スコア1件
    const differences = nutrientScores.map((current) => {
      const previous = previousDiagnosis?.scores.find(
        (item) => item.nutrientId === current.nutrientId
      );

      // 前回の診断結果に対して前回スコアが存在する栄養素なのかを true / false に変換(フロントに返し表示するデータとして使うため)
      const hasPrevious = !!previous;
       // 前回スコアがあればその値を使い、ない時nullにする。
      const previousScore = previous?.score ?? null;
      // 前回スコア(previous) が存在する時は previous.score を使って今回スコア(current.score)との差分計算
      // 前回スコア(previous) が存在しない時は diff は null にする
      const diff = previous ? current.score - previous.score : null;

      // 差分表示用の文字列
      // 最初の初期値
      let diffLabel = "前回データなし";

      // 差分の内容ごとの表示文の条件分岐
      // score は高いほど満たせている扱いのため、 diff > 0 を改善として表示する
      // 今回スコア - 前回スコア がプラスの場合
      // = 点数が上がっている → 「+〇〇 改善」
      if (diff !== null) {
        if (diff > 0) {
          diffLabel = `+${diff} 改善`;
        } else if (diff < 0) {
          diffLabel = `${diff} 低下`;
        } else {
          diffLabel = "0 変化なし";
        }
      }

      //フロント側に返す用に差分表示用データを作成
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