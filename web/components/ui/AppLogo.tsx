// web/components/ui/AppLogo.tsx

// 全体の概要
// - Nutriflecta の共通ロゴをSVGで表示する



// ポイント
// - "use client" を付けない理由
// この部品自体には、状態管理・イベント処理・ブラウザー専用APIがありません。
// 描画だけを担当するため、このファイルに "use client" を追加する必要はないため。



// AppLogo が 受け取る props の型 を定義

// className?: string
// - 呼び出し側から、ロゴの大きさや色を指定できるようにしている
type AppLogoProps = {
  className?: string;
};


// アプリ名などの文字と一緒に表示する、装飾用の共通ロゴ


// viewBox="0 0 32 32"
// - SVG内部の描画範囲を設定。
// パスはこの座標を基準に描かれ、実際の表示サイズに合わせて拡大・縮小される。

// stroke="currentColor"
// - 色を固定せず、配置先の文字色に合わせます。

// strokeLinecap・strokeLinejoin
// - 線の端と角を丸くする設定

// aria-hidden="true"
// - 今回はアプリ名などの文字と一緒に表示するため、ロゴを重複して読み上げない設計
export default function AppLogo({
  className = "size-5",
}: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {/* ノートの外枠: 左上を空けてフォークを配置する */}
      <path d="M10 6h2m10 0h3a3 3 0 0 1 3 3v17a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3v-6" />

      {/* ノートの上部のクリップ */}
      <rect x="12" y="3" width="10" height="6" rx="2" />

      {/* フォークの外側の歯と先端 */}
      <path d="M3 5v7a4 4 0 0 0 8 0V5" />

      {/* フォークの中央の歯 */}
      <path d="M7 5v8" />

      {/* フォークの持ち手 */}
      <path d="M7 16v11" />

      {/* 記録を表す横線 */}
      <path d="M15 14h8" />

      {/* 確認・振り返りを表すチェック */}
      <path d="m14 22 3 3 6-7" />

    </svg>
  );
}
