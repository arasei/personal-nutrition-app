// web/types/diagnosisApi.ts
// 診断機能で使うAPIのリクエスト/レスポンスの型をまとめるファイル
// 「何を送るか」 「何が返るか」を決めている
// フロントとサーバーでデータの形を揃える為

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

export type StartDiagnosisResponse = {
  success: boolean;
  diagnosisId?: string;
  message?: string;
};

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

// なぜ必要

// 成功/失敗のレスポンスの型をフロントとサーバーで共通化するため

// nextHref?: string;
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
// そのため、「?」とする

export type SaveDiagnosisAnswersResponse = {
  success: boolean;
  nextHref?: string;
  message?: string;
};


// ------------------------------
// 診断結果取得API
// GET /api/diagnosis/[diagnosisId]/result
// ------------------------------

// 診断結果のランキング1件分の型を定義

// nutrient → 栄養素名
// total → 栄養素の合計スコア

export type ResultRankingItem = {
  nutrient: string;
  total: number;
};



// 前回との差分付きランキングの1件分の型を定義

// diff: number | null;
// 前回診断との差分
// 初回診断では前回データ(diff)が無いため null になる可能性があるため、nullも可能にする
export type ResultDiffRankingItem = {
  nutrient: string;
  total: number;
  diff: number | null; 
};



// 診断結果APIから返ってくる全体のレスポンスの型を定義



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
  ranking: ResultRankingItem[];
  diffRanking: ResultDiffRankingItem[];
};