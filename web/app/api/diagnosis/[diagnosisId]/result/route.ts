// web/app/api/diagnosis/[diagnosisId]/result/route.ts



// 画面に見せるための結果データを作るAPI
// ログイン中ユーザー本人の完了済み診断情報だけをDBから取得し、保存済みscores から栄養素ランキングと前回との差分を作ってJSONで返すAPI

// 「この診断IDの結果を見せて」と言われた時に、本当にその人の結果か確認して、本人のものなら集計して返す仕組み

// サーバー側の処理



// 3つの役割が存在
// 認証
// token を確認して、ログインしているか確認し、取得する

// 認可
// URL の diagnosisId が、そのログイン中ユーザー本人の診断か確認する。

// 結果データ整形
// DBの生データを、画面で使いやすい形に変換する
// 回答を栄養素ごとに集計し、前回との差分も作成する


// tokenで本人確認
// ↓
// user.idで本人のデータだけ操作


// 以下のページに使用するAPI
// 診断結果ページ
// 履歴詳細ページ
// 前回比較を見せたいページ


// 401 は未ログイン
// 404 は診断が存在しない、または本人の診断ではない
// 500 はサーバーエラー
// previousScoreMap は前回診断のスコアを入れておく箱
// ranking は今回の結果
// diffRanking は今回 + 前回差分
// id + userId で絞るのが認可のポイント




// 役割
// URLからdiagnosisIdを受け取る
// tokenを確認する
// ログイン中ユーザー情報を取得
// その診断のdiagnosisIdが本人の診断か確認
// 保存済み scores を取得
// scores からrankingを作成
// 前回診断取得
// 前回と今回の差分計算
// JSON返却(本人の診断結果だけ返す)



// 流れ
// result/page.tsx
// ↓ token付きfetch
// GET /api/diagnosis/[diagnosisId]/result
// ↓
// URLからdiagnosisIdを受け取る
// ↓
// Authorization header から token 取得
// ↓
// Supabaseで token 検証
// ↓
// ログインユーザー取得
// ↓
// diagnosisId 取得
// ↓
// diagnosisId + user.id + COMPLETED で本人の診断だけ取得
// ↓
// ranking 作成
// ↓
// previousDiagnosis 取得
// ↓
// diffRanking 作成
// ↓
// 型付きレスポンス返却





// このAPIは最後にJSONで診断結果を返すため
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// このAPIが返すJSONの型を指定するため
import type { DiagnosisResultResponse } from "@/types/diagnosisApi";
// 今ログインしているユーザーが誰かを取得するため
// サーバー側で使うSupabaseクライアント作成関数を読み込む
import { createClientForServer } from "@/lib/supabase/server";


// このAPIが受け取るparamsの型を定義
// Props は Next.jsがroute.tsに渡してくる内部的な引数の形
type Props = {
  params: Promise<{ diagnosisId: string }>;
};
// ログイン中ユーザーの完了済み診断だけを取得し、
// 保存済みスコアからランキングと前回差分を作成して返す
// request から Authorization header を取得
// params から diagnosisId を取得
export async function GET(request: Request, { params }: Props) {
  try {
    // API に 送られてきた request の Authorization header から token を取得
    // Authorization: Bearer <access_token> の形を想定する
    // 「?? ""」 は Authorization header がない場合、token を空文字にする(未ログイン扱いにするため)
    const authHeader = request.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    // サーバー側で API Route用のSupabaseクライアント作成
    // Supabaseで token を検証し、ログイン中ユーザーを取得するため
    const supabase = createClientForServer();

    // token を supabaseに渡して token から ログイン中ユーザー情報を取得
    // token が正しければ user が返る
    // token が空・不正・期限切れの場合、error が返る
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    // token が無い・不正・期限切れの場合は未ログイン扱い
    // ユーザー取得失敗(userErrorがある) or 未ログイン(userが無い)の場合はこのAPIを停止
    // 未ログインのままこのAPIを使わせないため
    if (userError || !user) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "未ログインです",
      };

      return NextResponse.json(responseBody, { status: 401 });
    }

    // token検証後に URL の diagnosisId を取得・確認
    const { diagnosisId } = await params;

    // URL に診断IDがない場合
    if (!diagnosisId) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "診断IDが必要です",
      };

      return NextResponse.json(responseBody, { status: 400 });
    }

    // 今回の診断データを取得
    // 「ログイン中ユーザー本人の完了済み診断」に限定してDBから取得
    // URL の diagnosisId が存在するが、でもログイン中ユーザー本人の診断ではないという場合、取得できない状態


    // where: {...}で今回の診断IDで、このユーザー本人のものだけを指定
    // id がURL の diagnosisId と一致する
    // userId がログイン中ユーザーの user.id と一致する
    // status が "COMPLETED" のものだけを対象

    // select: {...}で必要な項目だけ指定
    // id: 今回の診断ID
    // userId: 前回診断取得に使う
    // createdAt: 前回診断を探す基準に使う
    // scores: この診断に紐づく保存済みスコアを取得・各スコアに紐づく栄養素情報も一緒に取得(ランキング作成に使うため)
    const currentDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        id: diagnosisId,
        userId: user.id,
        status: "COMPLETED", // 完了した診断だけ対象
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        scores: {
          include: {
            nutrient: true,
          },
        },
      },
    });

    // 存在しない・他人の診断・未完了診断の場合
    // 今回の診断データが取得できなかった場合(存在しない診断IDと他人の診断IDと診断が未完了の場合)、エラーにする
    if (!currentDiagnosis) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "診断結果が見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // 保存済みスコアが無い場合
    // 本来は診断完了時にscoresにスコアが保存される想定
    // このエラーの場合、保存処理の不具合の可能性がある
    if (currentDiagnosis.scores.length === 0) {
      const responseBody: DiagnosisResultResponse = {
        success: false,
        message: "診断スコアが見つかりません",
      };

      return NextResponse.json(responseBody, { status: 404 });
    }

    // 今回のランキングを作成
    // 点数の低い順に不足順ランキングとして並べて表示する
    // 「score が低い = 不足している」と判断するため、昇順でソートする
    const ranking = [...currentDiagnosis.scores]
      .sort((a, b) => a.score - b.score)
      .map((item) => ({
        nutrientId: item.nutrientId,
        nutrient: item.nutrient.name,
        total: item.score,
      }));

    // 今回より前の診断を同じユーザーに限定して1件取得
    // 前回との差分を出すため
    // { lt: currentDiagnosis.createdAt,}で今回の診断より前の日付を指定
    // orderBy: 今回より前の診断の中で1番新しい順で並べる(前回診断を1件だけ取るため)
    // { scores: true } で前回診断のスコアも取得
    const previousDiagnosis = await prisma.diagnosis.findFirst({
      where: {
        userId: currentDiagnosis.userId,
        status: "COMPLETED",
        createdAt: {
          lt: currentDiagnosis.createdAt,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        scores: true,
      },
    });

    // 前回スコアマップ
    // 前回スコアを nutrientId ごとに取り出しやすくする

    // 差分計算用の箱(前回の栄養素スコアを入れておくための箱)
    // key: nutrientId
    // value: 前回のscore
    const previousScoreMap: Record<string, number> = {};

    // 前回診断のスコアがある場合、previousScoreMapに前回のスコアを入れる
    // 初回診断の場合、前回診断データが無いため、previousDiagnosisはnullの可能性がある
    // previousScoreMap[item.nutrientId] = item.score は 栄養素IDをキーに前回スコアを保存するための箱
    if (previousDiagnosis) {
      for (const item of previousDiagnosis.scores) {
        previousScoreMap[item.nutrientId] = item.score;
      }
    }

    // 今回スコアと前回スコアの差分を作成
    // 今回ランキング各栄養素ごとに、前回との差分を計算し追加
    // 画面に「前回+2」、「前回-1」のように表示するため
    const diffRanking = ranking.map((item) => {

      // 同じ栄養素の前回スコアを取得
      const previousScore = previousScoreMap[item.nutrientId];

      const diff = previousScore !== undefined ? item.total - previousScore : null;

      // 差分付きランキングデータを作成し、フロントに返す
      return {
        nutrientId: item.nutrientId,
        nutrient: item.nutrient,
        total: item.total,
        diff,
      };
    });

    // 型付きレスポンスを返す
    // このAPIが返すJSONの型を指定
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


