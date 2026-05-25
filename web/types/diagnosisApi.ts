// web/types/diagnosisApi.ts

// 診断機能で使うAPIの以下のようなリクエスト/レスポンスの型をまとめるファイル
// フロントからAPIへ送るbodyの型
// APIからフロントへ返すJSONの型
// 複数ファイルで共有するレスポンス型
// 複数ファイルで共有するデータ1件分の型
// APIエラーレスポンスの型

// 「何を送るか」 「何が返るか」を決めている

// フロントとサーバーでデータの型を共有する為

// APIの通信で送るデータ・返すデータの型を定義する




// ------------------------------
// 共通エラーレスポンス
// ------------------------------
// APIでエラーが起きたときに返すレスポンスの型を定義

// message?: 画面に表示するメッセージ

// API が失敗した時は success: false を返す
// 画面に出すメッセージは message に入る
export type ApiErrorResponse = {
  success: false;
  message?: string;
};




// ------------------------------
// 診断開始API
// POST /api/diagnosis/start
// ------------------------------

//診断開始APIに送るリクエストbodyの型を定義

// POST /api/diagnosis/startに何を送るのか明確にするため
// 現状は開始APIはbodyを使っていない
// Authorization header の tokenだけでログインユーザーを確認するため
// 診断開始APIのリクエストボディ型を 「キーを持たないオブジェクト」(空オブジェクト型)として定義

// {}はOK
// 例.{ userId: "abc"}は禁止

export type StartDiagnosisRequest = Record<string, never>;



// 診断開始APIから返るレスポンスbodyの型を定義

// success: true の時は diagnosisId が必要
// success: false の時は message が使える

// なぜ必要

// フロント側で
// data.success
// data.diagnosisId
// data.message
// を安全に使うためです。

// 成功時 → diagnosisId が入る
// 例.
// {
//   success: true,
//   diagnosisId: "xxx",
// }
// 失敗時 → message が入る
// 例.
// {
//   success: false,
//   message: "Unauthorized",
// }

// diagnosisIdとmessageが常に両方返ってくるわけではないため「?」をつけている。

export type StartDiagnosisResponse =
  | {
      success: true;
      diagnosisId: string;
    }
  | ApiErrorResponse;





// ------------------------------
// 診断ステップ取得API
// 
// ------------------------------


// 診断ステップ取得API から返ってくるJSONの型を定義

// success: API の処理が成功したかどうか
// diagnosisId: 診断ID。
// question: 現在表示する質問データ。
// id: 質問ID。AnswerForm に渡して、回答保存に使用。
// questionText: 質問分。
// order: 質問の順番。
// total: 全質問数。
// isLast: 現在の質問が最後かどうか。

// question・total・isLast が必ずあることが必須

export type DiagnosisStepResponse =
  | {
      success: true;
      diagnosisId: string;
      question: {
        id: string;
        questionText: string;
        order: number;
      };
      total: number;
      isLast: boolean;
    }
  | ApiErrorResponse;









// ------------------------------
// 回答保存API
// POST /api/diagnosis/answers
// ------------------------------

//1問分の回答データの型を定義

// 現在は未使用
// SaveDiagnosisAnswersRequest を単体回答にしているため

// なぜ必要

// 複数回答保存する際に必要
// answers配列の中身を統一するため
// 今後、質問の種類が増えても、valueをnumber型にするなど、AnswerInputの定義を変えるだけで対応できるようにするため

export type DiagnosisAnswerInput = {
  questionId: string;
  value: number;
};



//回答保存APIに送る リクエストbodyの型を定義

// なぜ必要

// フロントとサーバーで扱うデータの型を共通化するため

// answers: [] ではなく、単体にする
// 今の画面は、1ページに1問ずつ表示、回答する形式
// なので、APIもまずは単体回答にする

// 流れ
// 1問表示
// ↓
// 1回答送信
// ↓
// 次の質問へ

export type SaveDiagnosisAnswersRequest = {
  diagnosisId: string;
  questionId: string;
  value: number;
  order: number;
};



//回答保存APIから返すレスポンスbodyの型

// 回答成功時は必ず次の遷移先が必要
// 成功時は nextHref が必須

// Step1回答後 → Step2へ
// Step10回答後 → 結果ページへ


// なぜ必要

// 成功/失敗のレスポンスの型をフロントとサーバーで共通化するため

// nextHref: string;
// 何している？

// 保存後に遷移するURLを表している

// なぜ必要？

// API方式では、Server Actionのように redirect()しない
// APIが
// 例.
// {
//   success: true,
//   nextHref: "/diagnosis/step/2?diagnosisId=xxx"
// }
// を返し、フロント側の AnswerForm.tsxがrouter.push(nextHref)する

// 成功時 → nextHrefを返す
// 失敗時 → messageを返す

export type SaveDiagnosisAnswersResponse =
  | {
      success: true;
      nextHref: string;
    }
  | ApiErrorResponse;


// ------------------------------
// 診断結果取得API
// GET /api/diagnosis/[diagnosisId]/result
// ------------------------------

// 診断結果のランキング1件分の型を定義

// nutrientId: 栄養素ID。Reactのkeyや前回比較に使う
// nutrient → 画面に表示する栄養素名
// total → 保存済みの栄養素の合計スコア

export type ResultRankingItem = {
  nutrientId: string;
  nutrient: string;
  total: number;
};



// 前回との差分付きランキングの1件分の型を定義

// diff: 今回 - 前回 の差分(前回診断との差分)
// 初回診断では前回データ(diff)が無いため null になる可能性があるため、nullも可能にする
export type ResultDiffRankingItem = {
  nutrientId: string;
  nutrient: string;
  total: number;
  diff: number | null; 
};



// 診断結果APIから返ってくる全体のレスポンスの型を定義

// 成功したら必ず success: true
// 成功したら必ず ranking がある
// 成功したら必ず diffRanking がある



// ranking: ResultRankingItem[];
// 何をしている？

// 通常ランキングの配列

// なぜ必要？
// 結果ページで、栄養素ごとのスコアランキングを表示するため



// diffRanking: ResultDiffRankingItem[];
// 何をしている？

// 前回との差分付きランキングの配列

// なぜ必要？

// 履歴比較や改善・悪化の表示のため


export type DiagnosisResultResponse = {
  success: true;
  ranking: ResultRankingItem[];
  diffRanking: ResultDiffRankingItem[];
};




// ------------------------------
// 診断履歴一覧取得API
// GET /api/diagnosis/history
// ------------------------------

// 履歴一覧で表示する上位栄養素1件分の型
// nutrientId: 栄養素ID
// nutrientName: 画面に表示する栄養素名
// score: 診断で保存された栄養素スコア

export type DiagnosisHistoryTopNutrient = {
  nutrientId: string;
  nutrientName: string;
  score: number;
};

// 履歴一覧で表示する診断履歴1件分の型
// id: 診断ID。/history/[id] へのリンクに使う
// createdAt: 診断作成日。APIのJSONレスポンスでは文字列として扱う
// topNutrients: 上位3栄養素の配列

// Prisma側では createdAt はDate 型です。
// しかし、APIで NextResponse.json() に入れてブラウザへ返すと、
// JSONとして送られるため、日付は文字列として扱う必要があるため、string型にしている

export type DiagnosisHistoryItem = {
  id: string;
  createdAt: string;
  topNutrients: DiagnosisHistoryTopNutrient[];
};




// 診断履歴一覧APIから返ってくるレスポンス全体の型

// histories: 診断履歴の配列

// 履歴一覧取得に成功したら histories が必ず配列で返る
// 履歴が0件でも [] として返る

// 成功時 → histories が必ずある
// 失敗時 → message が使える

export type GetDiagnosisHistoryResponse =
  | {
      success: true;
      histories: DiagnosisHistoryItem[];
    }
  | ApiErrorResponse;


// ------------------------------
// 診断履歴詳細取得API
// GET /api/diagnosis/history/[id]
// ------------------------------


// 履歴詳細で表示する栄養素スコア1件分の型
// nutrient: 画面に表示する栄養素名
// nutrientId: 栄養素ID。前回との差分比較やkeyに使う
// score: 診断で保存された栄養素スコア

export type DiagnosisHistoryDetailScore = {
  nutrient: string;
  nutrientId: string;
  score: number;
};


// 履歴詳細で表示する前回との差分1件分の型
// current: 今回スコア
// previous: 前回のスコア。前回データがない場合は null
// diff: 今回 - 前回 の差分。前回データが無い場合は null
// hasPrevious: 前回データがあるかどうか
// diffLabel: 画面表示用の文言

// previous と diff に null を許可しているのは、初回診断では前回データが無いから

export type DiagnosisHistoryDetailDifference = {
  nutrient: string;
  nutrientId: string;
  current: number;
  previous: number | null;
  diff: number | null;
  hasPrevious: boolean;
  diffLabel: string; 
};


// 診断履歴詳細APIから返ってくるレスポンス全体の型
// createdAt は APIレスポンスでは文字列として扱う
// nutrientScores: 全栄養素スコア一覧
// topNutrients: スコアが高い上位栄養素
// lowNutrients: スコアが低い上位栄養素
// differences: 前回との差分一覧

export type GetDiagnosisHistoryDetailResponse = {
  success: true;
  id: string;
  createdAt: string;
  nutrientScores: DiagnosisHistoryDetailScore[];
  topNutrients: DiagnosisHistoryDetailScore[];
  lowNutrients: DiagnosisHistoryDetailScore[];
  differences: DiagnosisHistoryDetailDifference[];
};