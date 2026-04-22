// web/app/api/diagnosis/[diagnosisId]/result/route.ts


// 画面に見せるための結果データを作るAPI
// ログイン中の本人の診断結果だけをDBから取得し、栄養素ランキングと前回との差分を作ってJSONで返すAPI

// 「この診断IDの結果を見せて」と言われた時に、本当にその人の結果か確認して、本人のものなら集計して返す仕組み

// サーバー側の処理



// 3つの役割が存在
// 認証
// ログインしているか確認する

// 認可
// その診断が本人のものか確認する

// データ整形
// DBの生データを、画面で使いやすい形に変換する


// 以下のページに使用するAPI
// 診断結果ページ
// 履歴詳細ページ
// 前回比較を見せたいページ


// 401 は未ログイン
// 404 は見つからない
// 500 はサーバーエラー
// scoreMap は集計用の箱
// diffMap は前回比較用の箱
// ranking は今回の結果
// diffRanking は今回 + 前回差分
// id + userId で絞るのが認可のポイント




// 役割
// URLからdiagnosisIdを受け取る
// ログイン中ユーザー情報を取得
// その診断が本人の診断か確認
// 回答一覧を取得
// 栄養素ごとのスコア集計
// 前回診断取得
// 前回と今回の差分計算
// JSON返却



// 流れ
// GET /api/diagnosis/[diagnosisId]/result
// ↓
// URLからdiagnosisIdを受け取る
// ↓
// Supabaseでログイン中ユーザー情報を取得し、確認
// ↓
// diagnosisId + userId で本人の診断か確認
// ↓
// 回答一覧を取得
// ↓
// scoreMapで栄養素ごとに回答を集計
// ↓
// ranking作成
// ↓
// 前回診断取得
// ↓
// diffMap 作成
// ↓
// diffRanking 作成(前回との差分計算)
// ↓
// JSONで返す





// このAPIは最後にJSONで診断結果を返すため
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// このAPIが返すJSONの型を指定するため
import type { DiagnosisResultResponse } from "@/types/diagnosisApi";
// 今ログインしているユーザーが誰かを取得するため
// サーバー側で使うSupabaseクライアント作成関数を読み込む
import { createClientForServer } from "@/lib/supabase/server";


// このAPIが受け取るparamsの型を定義
type Props = {
  params: Promise<{ diagnosisId: string }>;
};
// _request: Requestでrequestを受け取るがrequest本体は使用していない
export async function GET(_request: Request, { params }: Props) {
  try {
    // URLの[diagnosisId]を取り出している
    const { diagnosisId } = await params;

    // API Route用のSupabaseクライアント作成
    const supabase = createClientForServer();
    //ログイン中ユーザー情報を取得
    const { data: { user }, error: userError, } = await supabase.auth.getUser();

    // ユーザー取得失敗 or 未ログインの場合はこのAPIを停止
    // 未ログインのままこのAPIを使わせないため
    if (userError || !user) {
      return NextResponse.json(
        { message: "未ログインです"},
        { status: 401 }
      );
    }

    //今回の診断データを本人のものに限定してDBから取得
    // where: {...}で今回の診断IDで、このユーザー本人のものだけを指定
    // select: {...}で必要な項目だけ指定
    const currentDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        id: diagnosisId,
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
    });

    // 存在しない診断IDと他人の診断IDの場合、エラーにする
    if (!currentDiagnosis) {
      return NextResponse.json(
        { message: "診断結果が見つかりません" },
        { status: 404 }
      );
    }

    //今回の回答一覧を取得
    //栄養素ごとの点数を合計するため
    const answers = await prisma.diagnosisAnswer.findMany({
      where: {
        diagnosisId: currentDiagnosis.id,
      },
      include: {
        question: true,
      },
    });

    // スコア計算

    // 栄養素ごとの合計点を入れる箱を作成
    const scoreMap: Record<string, number> = {};
    // ループで計算
    // 回答を1件ずつ見て、栄養素ごとに点数を加算
    for (const item of answers) {
      const nutrient = item.question.nutrientId;
      const point = item.value;

      scoreMap[nutrient] = (scoreMap[nutrient] ?? 0) + point;
    }

    // scoreMapを配列にして、点数の低い順に並べる
    // 不足順ランキングとして表示するため
    const ranking = Object.entries(scoreMap)
      .sort((a, b) => a[1] - b[1])
      .map(([nutrient, total]) => ({
        nutrient,
        total,
      }));

      // 今回より前に行った同じユーザーの診断を1件取得
      // 前回との差分を出すため
      // { lt: currentDiagnosis.createdAt,}で今回の診断より前の日付を指定
      const previousDiagnosis = await prisma.diagnosis.findFirst({
        where: {
          userId: currentDiagnosis.userId,
          createdAt: { lt: currentDiagnosis.createdAt,},
        },
        orderBy: { createdAt: "desc",},
        include: { scores: true },
      });

      // 前回スコアマップ

      // 差分計算用の箱(前回の栄養素スコアを入れておくための箱)
      const diffMap: Record<string, number> = {};

      // 前回スコアをdiffMapに追加
      if (previousDiagnosis) {
        for (const item of previousDiagnosis.scores) {
          diffMap[item.nutrientId] = item.score;
        }
      }

      // 今回ランキング1件ごとに、前回との差分を追加
      // 画面に「前回+2」、「前回-1」のように表示するため
      const diffRanking = ranking.map((item) => {
        const prev = diffMap[item.nutrient];
        const diff = prev !== undefined ? item.total - prev : null;

        return {
          nutrient: item.nutrient,
          total: item.total,
          diff,
        };
      });

      // このAPIが返すJSONの型を指定
      const responseBody: DiagnosisResultResponse = {
        ranking,
        diffRanking,
      };

      return NextResponse.json(responseBody, { status: 200 });
  } catch (error) {
    console.error("結果取得APIエラー:", error);

    return NextResponse.json(
      { message: "結果取得に失敗しました" },
      { status: 500 }
    );
  }
}


