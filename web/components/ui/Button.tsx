// web/components/ui/Button.tsx

// 全体の概要
// - <Button>(ボタン)  の見た目と役割を共通化し、何度も使い回すための共通コンポーネント


// 役割
// - 主ボタン(primary)の共通スタイル
// - 副ボタン(secondary)の共通スタイル
// - disabled 時の見た目
// - className で追加調整できる仕組み


// このファイル内の流れ
// 各ページ
// │
// ├─ StartButton
// │    ↓
// │   Button
// │
// ├─ LoginPage
// │    ↓
// │   Button
// │
// ├─ SignupPage
// │    ↓
// │   Button
// │
// └─ HistoryDetail
//      ↓
//     LinkButton




// ポイント
// - StartButton.tsx
// → 診断を開始する「機能」を持つ

// - Button.tsx
// → ボタンの「見た目」を持つ

// - Button
// 処理
// 送信中・API通信中・ログイン確認中
// ↓
// 押せなくする(disabledが必要)

// - LinkButton
// ページ移動
// 履歴一覧へ戻る・マイページへ
// ↓
// 固定ページへ移動(disabledは必要ではない)

// - primary(主ボタン)
// → 最も重要な操作(診断を始める・次へ・結果見る など)
// → 黒背景・白文字

// - secondary(副ボタン)
// → 補助的な操作
// → 白背景・枠線

// - Button と LinkButton が 持つ見た目を一部共通している状態
// 高さ・余白・文字サイズ・hover・transition・focus-visible


import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from "react";

// variant?: "primary" | "secondary";
// - ボタンの種類を2つに限定している


// PropsWithChildren<...>
// - children はボタンの中身。
// 例.
// <Button>
//   診断を始める
// </Button>

// の、`診断を始める` 部分を children として受け取れるようにしています。


// ...props
// - 呼び出し元(フロント側)で<Button></Button> に書いた `type=...`,`onClick=...`,`disabled=...` などが入る


// ButtonHTMLAttributes<HTMLButtonElement>
// - 通常の <button> に書ける機能・属性(type・onClick・disabled・aria-label・className など) を、
// `web/components/ui/Button.tsx`でも使えるようにするための型を定義
// - つまり、今の StartButton.tsx で使っている onClick と disabled も `web/components/ui/Button.tsx` に渡すことができ、使用可能
type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>& {variant?: "primary" | "secondary";}>;

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {

// baseClassName(ボタンの基本の見た目を定義)


  // inline-flex
  // - ボタン内の文字を整列しやすくする

  // min-h-10
  // - ボタンの最低限の高さを揃える

  // items-center / justify-center
  // - 文字を縦横中央へ配置

  // rounded-md
  // - 控えめな角丸

  // px-4 / py-2
  // ボタン内側の余白

  // text-sm / font-semibold
  // - Button と LinkButton の文字サイズを小さすぎず、少し強調された文字にする

  // transition-colors
  // - ホバー時の色変更を滑らかにする

  // focus-visible:ring-primary/30
  // - キーボード操作・選択状態時に薄いエメラルドのリングを表示

  // disabled:opacity-50
  // - 処理中(送信中・ログイン確認中・回答送信中 など)、押せないボタンを薄く表示

  // disabled:cursor-not-allowed
  // - ボタンが押せない時、カーソルを「押せない」形に変えている

  // focus-visible:ring-offset-2
  // - ボタン本体とフォーカスリングの間に少し隙間を作る。
  const baseClassName =
    "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";


  // primary(主ボタン)

  // bg-primary
  // - 通常時、エメラルド背景

  // text-white
  // - 文字白色

  // hover:bg-primary-hover
  // - ホバー時(マウスを乗せると)、濃いエメラルド色

  // disabled:hover:bg-primary
  // - 操作できない時は、ホバー(マウスを乗せる)しても色を変えない。(通常時のエメラルド色のまま)


  // secondary(副ボタン)

  // bg-surface
  // - 通常時、白背景

  // border-primary / text-primary
  // - 枠線 と 文字 の色 がエメラルド色

  // hover:bg-primary-light
  // - ホバー時、薄いエメラルド背景

  const variantClassName = {
    primary: "bg-primary text-white hover:bg-primary-hover disabled:hover:bg-primary",
    secondary: "border border-primary bg-surface text-primary hover:bg-primary-light disabled:hover:bg-surface",
  };

  return (
    <button
      className={`${baseClassName} ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}