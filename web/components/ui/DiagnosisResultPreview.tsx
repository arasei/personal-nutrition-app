// web/components/ui/DiagnosisResultPreview.tsx



// 全体の概要
// - トップページで「診断するとどのような結果を確認できるのか」をサンプルデータでコンパクトに診断結果の見本を見せるコンポーネント





// ポイント
// - 「このアプリを使うと、このような結果が見られます」という見本を表示

// - このコンポーネントは トップページを初めて訪れた利用者に、以下3つの内容 をサンプルデータを元に表示し、伝える。
// 栄養素バランスのレーダーチャート
// 不足傾向が高い栄養素TOP3
// 診断後に改善のヒントを確認できること

// - 実際の診断結果は取得せず、固定したサンプルデータを使用している。

// - このコンポーネントでは 以下の処理 は行なっていない。
// APIへのアクセス
// Prismaからのデータ取得
// Supabaseの認証確認
// 診断結果の計算
// ユーザーごとの結果表示




// このファイル内の流れ

// トップページ
// app/page.tsx
//     ↓
// DiagnosisResultPreviewを表示
// <DiagnosisResultPreview />
//     ↓
// 固定したサンプルデータを渡す
// SAMPLE_RANKING を SafeRadarChartへ渡す
//     ↓
// SafeRadarChartがブラウザ上で RadarChart を読み込み、RadarChartがサンプルデータを Chart.js用データへ変換する
// トップページで サンプル用チャートを表示
// <SafeRadarChart compact />
//     ↓
// 同じデータの先頭3件を不足傾向TOP3として表示
// SAMPLE_RANKING.slice(0, 3)
//     ↓
// 改善のヒント表示





import { Sparkles } from "lucide-react";

import SafeRadarChart from "@/components/SafeRadarChart";
// 表示するサンプルデータの型を読み込む(実際の診断結果と同じ型を使用する)
import type { ResultRankingItem } from "@/types/diagnosisApi";


// トップページの表示専用のサンプルデータ
// - 実際の診断結果やDBデータではない
// - トップページにサンプル表示するため
const SAMPLE_RANKING: ResultRankingItem[] = [
  {
    nutrientId: "sample-iron",
    nutrient: "鉄",
    score: 25,
  },
  {
    nutrientId: "sample-vitamin-c",
    nutrient: "ビタミンC",
    score: 50,
  },
  {
    nutrientId: "sample-vitamin-d",
    nutrient: "ビタミンD",
    score: 50,
  },
  {
    nutrientId: "sample-fiber",
    nutrient: "食物繊維",
    score: 60,
  },
  {
    nutrientId: "sample-omega-3",
    nutrient: "オメガ3脂肪酸",
    score: 70,
  },
  {
    nutrientId: "sample-protein",
    nutrient: "タンパク質",
    score: 80,
  },
  {
    nutrientId: "sample-vitamin-b",
    nutrient: "ビタミンB群",
    score: 65,
  },
  {
    nutrientId: "sample-water",
    nutrient: "水分",
    score: 75,
  },
];


// トップページの表示専用のサンプルデータ(SAMPLE_RANKING)の先頭3件を取り出す。
// 不足傾向として表示するため
const SAMPLE_SHORTAGE = SAMPLE_RANKING.slice(0, 3);



// relative
// - 内側の絶対配置要素の基準とする
// mx-auto
// - 左右中央に配置する
// w-full
// - 使える横幅いっぱいに広げる
// min-w-0
// - Grid や Flex 内で横にはみ出しにくくする
// - 320px での横スクロール防止
// max-w-md
// - 大きくなりすぎないように最大限を制限する

// absolute
// - 通常のレイアウトから外して配置
// inset-x-6
// 左右に余白を置く
// bottom-1
// - 下側に配置
// h-16
// - 影の高さ
// bg-primary/15
// - 基本色を15%の薄さで使用
// blur-xl
// - 大きくぼかす


// rounded-[2rem]
// - 大きめの角丸
// border-primary/20
// - 薄いエメラルド色の枠線
// bg-gradient-to-br
// - 左上から右下へのグラデーション
// from-primary-light
// - 開始色
// via-surface
// - 途中の色
// to-surface
// - 終了色
// p-4
// - モバイルの内側の余白
// sm:p-6
// 640px以上で余白を広げる
// shadow-lg
// - カード影


// items-start
// - 上端を揃える
// justify-between
// - 左右に振り分ける
// gap-3
// - タイトルとバッジの間隔を確保する



// space-y-2
// - 各項目の間に縦方向の余白を作る





export default function DiagnosisResultPreview() {
  return (
    // aria-labelledby="..."
    // - aria-labelledby として指定した "result-preview-heading" を使用することで領域の名前として読み上げソフトに伝えることを定義
    <aside
      aria-labelledby="result-preview-heading"
      className="relative mx-auto w-full min-w-0 max-w-md"
    >
      {/* カード下部のぼかした影 */}
      {/*
        aria-hidden="true"
        - 意味のない装飾要素を読み上げソフトが無視する
      */}
      <div
        aria-hidden="true"
        className="absolute inset-x-8 bottom-2 h-10 rounded-full bg-primary/15 blur-xl"
      />

      {/* 診断結果プレビュー全体 */}
      <div className="relative rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary-light to-surface p-4 shadow-lg sm:p-6">
        {/* プレビュー上部 */}
        {/*
          aria-labelledby="diagnosis-preview-title"
                    ↓対応させる
          id="diagnosis-preview-title"
        */}
        <div className="flex items-center justify-between gap-4">
          <p
            id="result-preview-heading"
            className="text-sm font-semibold text-primary-hover"
          >
            診断結果の表示イメージ
          </p>

          <span className="shrink-0 rounded-full border border-primary/15 bg-surface px-3 py-1 text-xs font-semibold text-primary-hover">
            サンプルデータ
          </span>
        </div>

        {/* 栄養バランス カード */}
        <div className="mt-5 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div>
            <p className="text-xs text-muted">
              栄養素ごとの傾向
            </p>

            <h2 className="mt-1 text-lg font-bold text-foreground">
              栄養素バランス
            </h2>
          </div>

          {/* サンプルデータをレーダーチャートへ渡す */}
          {/*
            role="img"
            - この領域の役割が"img"(画像)と読み上げソフトへ伝える
            aria-label="栄養素ごとの傾向を表すサンプルのレーダーチャート"
            - この領域の名前が "栄養素ごとの傾向を表すサンプルのレーダーチャート" だと読み上げソフトへ伝える
          */}
          <div
            role="img"
            aria-label="栄養素ごとの傾向を表すサンプルのレーダーチャート"
            className="mt-2"
          >
            <SafeRadarChart
              ranking={SAMPLE_RANKING}
              compact
            />
          </div>
        </div>

        {/* 不足傾向TOP3 カード */}
        <div className="mt-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-bold text-foreground">
            不足傾向 TOP3
          </p>

          {/* トップページの表示専用に取り出したサンプルデータ(SAMPLE_RANKING)の先頭3件を1件ずつ画面表示へ変換する */}
          {/*
            順序付きリスト ol を使用
            - 順位を持つ一覧のため
          */}
          <ol className="mt-3 space-y-2">
            {SAMPLE_SHORTAGE.map((item, index) => (
              <li
                key={item.nutrientId}
                className="flex items-center gap-3 rounded-xl bg-background px-3 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/20 bg-surface text-xs font-bold text-primary">
                  {index + 1}
                </span>

                <span className="min-w-0 text-sm font-semibold text-foreground">
                  {item.nutrient}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* 改善のヒント カード */}
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary-light p-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface text-primary">
            {/*
              aria-hidden="true"
              - この領域はアイコンなので読み上げソフトに余計に読み上げられるのを防ぐ
            */}
            <Sparkles
              aria-hidden="true"
              className="size-4"
            />
          </span>

          <div>
            <p className="text-sm font-bold text-foreground">
              改善のヒント
            </p>

            {/* leading-5 で行間を確保し、320px でも読みやすくする */}
            <p className="mt-1 text-xs leading-5 text-muted">
              診断後は、食品・料理・生活習慣のヒントを確認できます。
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
