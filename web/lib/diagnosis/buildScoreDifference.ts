// web/lib/diagnosis/buildScoreDifference.ts

// 全体の概要
// - 今回スコア と 前回スコアを受け取り、
// 前回との差分・前回データの有無・画面表示用ラベルをまとめて返す共通関数

// ポイント
// - 各API で ` web/lib/diagnosis/buildScoreDifference.ts` を呼び出し、判定を行い、
// diffLabel を返してフロント側では表示するだけの流れ


// 全体の流れ

// 今回score / 前回score
//         ↓
// web/lib/diagnosis/buildScoreDifference.ts
// buildScoreDifference()
//         ↓
// {
//   diff,
//   hasPrevious,
//   diffLabel
// }

// 以下を判定
// - diff = +50 / -50 / 0
// - hasPrevious = true / false
// - diffLabel = 改善・低下 など
//         ↓
//. ────────
// ↓               ↓
// 結果API         履歴詳細API
// ↓               ↓
// 結果ページ      履歴詳細ページ




// この関数が返すデータの型
export type ScoreDifference = {
  diff: number | null;
  hasPrevious: boolean;
  diffLabel: string; 
};


// 今回スコア と 前回スコアから差分情報を作る共通関数

// - currentScore:今回スコア
// - previousScore: 前回スコア
// 前回スコア の取得方法がAPIごとに違いがあるため、null と undefined を可能にしている。

// 診断結果API(web/app/api/diagnosis/[diagnosisId]/result/route.ts) では、
// `const previousScore = previousScoreMap[item.nutrientId];`
// 前回スコアが存在しない場合は、結果が `undefined` になる

// 履歴詳細API(web/app/api/diagnosis/history/[diagnosisId]/route.ts) では、
// `const previousScore = previous?.score;`
// 前回スコアが存在しない場合は、`undefined` になる
export function buildScoreDifference(
  currentScore: number,
  previousScore: number | null | undefined
): ScoreDifference {
  // - 前回スコアが null または undefined の場合、
  // 比較できるデータがないものとして扱う
  // - previousScore = 0 は 「0 === null → false」・「0 === undefined → false」という結果になるため、
  // 前回データあり として扱う
  if (previousScore === null || previousScore === undefined) {
    return {
      diff: null,
      hasPrevious: false,
      diffLabel: "前回データなし",
    };
  }

  // 今回スコア - 前回スコア を行い、差分を計算
  // - 前回スコア(score) がある場合だけ、計算し差分を出す。
  // - 初回診断の場合、「今回スコア(score) と 前回データなし」 と表示し、差分は表示しない(nullを返す)
  // - 前回スコアが null または undefined の場合は、`if (previousScore === null || previousScore === undefined) {...}` で return している。
  // そのため、ここまで来た時点で previousScore は number として扱える状態である。
  // 前回スコアが 0 の場合(previousScore = 0) でも差分計算を行う対象として扱えるので、
  // 前回0点の栄養素を「前回データなし」ではなく「前回 0 変化なし」と表示できるようにする。
  const diff = currentScore - previousScore;



  // 差分の内容ごとの表示文の条件分岐
  // diff !== null の場合の表示文の条件分岐
  // - 今回スコア - 前回スコア = 差分(diff)
  // 例.
  // - diff > 0 の場合 = 点数が上がっている → 「+〇〇 改善」と表示する
  // score は高いほど満たせている扱いのため、 diff > 0 を改善として表示する
  // - diff < 0 の場合  = 点数が下がっている → 「-〇〇 低下」と表示する
  // score が低いほど不足しやすい傾向という扱いのため、 diff < 0 を低下として表示する
  // - diff === 0 の場合 = 前回と今回のスコアが同じ値 → 「0 変化なし」と表示する
  // score が同じ場合は変化なしとして表示する
  // diff = 0 は、null 扱いではないので、「0 変化なし」と表示できる。
  // - diff === null の場合 = 前回データが存在しない or 初回診断 → 「前回データなし」と表示する
  // score が存在しない(前回データが存在しない・初回診断) の場合、前回データなし と表示する




  // スコアが上がった場合
  if (diff > 0) {
    return {
      diff,
      hasPrevious: true,
      diffLabel: `+${diff} 改善`,
    };
  }

  // スコアが下がった場合
  if (diff < 0) {
    return {
      diff,
      hasPrevious: true,
      diffLabel: `${diff} 低下`,
    };
  }

  // スコアに変化がなかった場合
  // - 前回の score が存在しており、今回の score との差分計算を行なった結果(diff)、が
  // 0の場合は「0 変化なし」と表示する。
  return {
    diff: 0,
    hasPrevious: true,
    diffLabel: `0 変化なし`,
  };
}
