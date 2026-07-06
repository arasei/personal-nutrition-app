// 履歴詳細ページは Server Component + Prisma直読みで完結する構成に変更し、
// 履歴詳細データ取得ロジックをAPI Routeから app/history/[id]/page.tsx に移したので
// app/api/diagnosis/history/[id]/route.ts は現在未使用。


// 指定した診断IDの履歴詳細を取得し、栄養スコア一覧・上位3件・下位3件・前回診断との差分を作成し、
// 初回診断時の表示や差分文言を決めて返すAPI

// 履歴詳細ページに必要な表示用データセットをこのAPIで完成させている

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
// URLから diagnosisId(診断ID) を取得
//    ↓
// その diagnosisId の診断(今回の診断)を取得
//    ↓
// scores と nutrient も一緒に取得
//    ↓
// 見つからなければ 404 を返す
//    ↓
// 今回の診断の userId を取得
//    ↓
// 同じ userId の前回診断を取得
//    ↓
// 今回の scores を見やすい配列(栄養素+栄養素ID+点数)に整形
//    ↓
// 上位3件を作る
//    ↓
// 下位3件を作る
//    ↓
// 同じnutrientIdを元に前回との差分を作る
//    ↓
// 前回データがあるか判定
// ├─ ある → diff を計算
// └─ ない → 前回データなし
//    ↓
// diffLabel(表示用)を作る
//    ↓
// JSONで返す(履歴詳細ページで使いやすい形に変換して)


//NextResponseはAPIの返り値を作るため(JSONを返す時)
//prismaはDB操作のため
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//GETリクエストが来た時に実行する関数
// /api/diagnosis/history/[id]にアクセスされたときに、そのidの履歴詳細を返すため
// params.idがURLの[id]に入っている値。[id]をもとに履歴詳細を取得する
export async function GET(
  request: Request,
  { params }: { params: { id:string } }
) {
  try {
    //URLから診断IDを取り出す
    const diagnosisId = params.id;

    //今回の診断を取得
    const currentDiagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      include: {
        scores: {
          include: {
            nutrient: true,
          }
        }
      },
    });

    if (!currentDiagnosis) {
      return NextResponse.json(
        { error: "診断結果が見つかりません" },
        { status: 404 }
      );
    }

    //今回の診断を行なったユーザーID(userId)を取得
    const userId = currentDiagnosis.userId;

    //前回の診断を取得
    const previousDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        userId: userId,
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

    //栄養スコアを見やすい形に整える
    // .sort((a, b) => b.score - a.score);でscoreが高い順に並び替え
    const nutrientScores = currentDiagnosis.scores
      .map((score) => ({
        nutrient: score.nutrient.name,
        nutrientId: score.nutrientId,
        score: score.score,
      }))
      .sort((a, b) => b.score - a.score);
    
    //上位3件
    const topNutrients = nutrientScores.slice(0, 3);

    //下位3件
    const lowNutrients = [...nutrientScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

    //前回との差分

    //差分計算する対象を同じ栄養素IDとして一致するかどうかで判断
    const differences = nutrientScores.map((current) => {
      const previous = previousDiagnosis?.scores.find(
        (item) => item.nutrientId === current.nutrientId
      );

      //前回スコアがない時nullにする。
      const hasPrevious = !!previous;
      const previousScore = previous?.score ?? null;
      //前回スコアがある時、差分計算する。
      const diff = hasPrevious ? current.score - previous.score : null;

      // 最初の初期値
      let diffLabel = "前回データなし"

      // 差分の内容ごとの表示文の条件分岐
      if (diff !== null) {
        if (diff > 0) {
          diffLabel = `+${diff} 改善`;
        } else if (diff < 0) {
          diffLabel = `${diff} 定価`;
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

    //JSONで返す
    return NextResponse.json({
      id: currentDiagnosis.id,
      createdAt: currentDiagnosis.createdAt,
      nutrientScores,
      topNutrients,
      lowNutrients,
      differences,
    });
  } catch (error) {
    console.error("履歴詳細取得エラー", error);

    return NextResponse.json(
      { error: "履歴詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
}