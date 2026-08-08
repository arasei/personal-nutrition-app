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
  // disabled:cursor-not-allowed
  // - ボタンが押せない時、カーソルを「押せない」形に変えている

  // disabled:opacity-50
  // - 送信中・ログイン確認中・回答送信中 などで、ボタンを少し薄く表示している

  // text-sm
  // - Button と LinkButton の文字サイズを明示的に揃える

  // transition-colors
  // - hover時の色変換を滑らかにする

  // focus-visible:...
  // - キーボード操作時の現在位置
  // - キーボードの Tab で移動した時に、「今どのボタンが選択されていkるか」を見えるように(周囲にリングが表示)する

  // focus-visible:ring-offset-2
  // - ボタン本体とフォーカスリングの間に少し隙間を作る。
  const baseClassName =
    "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variantClassName = {
    primary: "bg-black text-white hover:bg-gray-800 disabled:hover:bg-black",
    secondary: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 disabled:hover:bg-white",
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