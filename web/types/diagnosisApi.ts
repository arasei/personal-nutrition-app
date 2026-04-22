// web/types/DiagnosisApi.ts
// 診断機能で使うAPIのリクエスト/レスポンスの型をまとめるファイル

// ------------------------------
// 診断開始API
// POST /api/diagnosis/start
// ------------------------------

//診断開始APIに送るbodyの型
// 今の開始APIはbodyを使っていないので、現状は空オブジェクト型として定義
export type StartDiagnosisRequest = Record<string, never>;


// 診断開始APIのレスポンスの型を定義

// なぜ必要
// フロント側で
// data.success
// data.diagnosisId
// data.message
// を安全に使うためです。

// 成功時 → diagnosisId が入る
// 失敗時 → message が入る
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

// なぜ必要
// answers配列の中身を統一するため
// 今後、質問の種類が増えても、valueをnumber型にするなど、AnswerInputの定義を変えるだけで対応できるようにするため
export type DiagnosisAnswerInput = {
  questionId: string;
  value: number;
};

//回答保存APIに送る bodyの型
// なぜ必要
// フロントが送るデータの形をサーバーと共通化するため
export type SaveDiagnosisAnswersRequest = {
  diagnosisId: string;
  answers: DiagnosisAnswerInput[];
};

//回答保存APIから返すレスポンスの型
// なぜ必要
// 成功/失敗のレスポンスの形のルールをサーバーと共通化するため
export type SaveDiagnosisAnswersResponse = {
  success: boolean;
  message?: string;
};


// ------------------------------
// 診断結果取得API
// 
// ------------------------------

export type ResultRankingItem = {
  nutrient: string;
  total: number;
};

export type ResultDiffRankingItem = {
  nutrient: string;
  total: number;
  diff: number | null; // 差分は前回の診断がない場合はnullになる可能性があるため、nullも可能にする
};

export type DiagnosisResultResponse = {
  ranking: ResultRankingItem[];
  diffRanking: ResultDiffRankingItem[];
}