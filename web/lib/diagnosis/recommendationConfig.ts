// web/lib/diagnosis/recommendationConfig.ts



// ポイント
// - ranking がすでにscore昇順でも、提案対象を作る処理側でも明示的に並べ、
// 処理単体の意味が分かりやすくする
// - 閾値をAPI側で管理・判定する設計
// フロント側は提案が来たら表示だけを行う


// このファイル内の流れ
// 全栄養素
// ↓
// 50点未満だけに絞る
// ↓
// scoreが低い順に並べる
// ↓
// 最大3件に絞る



// - 使用例.
// const recommendationTargets = [...ranking]
//   .filter(
//     (item) => item.score < RECOMMENDATION_SCORE_THRESHOLD
//   )
//   .sort((a, b) => a.score - b.score)
//   .slice(0, MAX_RECOMMENDATION_NUTRIENTS);



// 食品・行動提案の対象にするスコアの上限
// - 50点は含めず、50点未満を対象にする(49~0)
export const RECOMMENDATION_SCORE_THRESHOLD = 50;

// 1回の診断結果で提案する栄養素の最大件数
export const MAX_RECOMMENDATION_NUTRIENTS = 3;