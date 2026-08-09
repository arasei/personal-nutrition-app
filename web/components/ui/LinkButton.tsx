// web/components/ui/LinkButton.tsx

// 全体の概要
// - <Link>(リンク)  の見た目と役割を共通化し、何度も使い回すための共通コンポーネント



// 役割
// - 主ボタン(primary)の共通スタイル
// - 副ボタン(secondary)の共通スタイル
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

// - router
// → 条件に応じた自動リダイレクトに使用する

// - LinkButton
// → ユーザーが押す通常のページ移動に使用する


// variant?: "primary" | "secondary";
// - ボタンの種類を2つに限定している

// - 今回の履歴詳細を見る
// → primary(その画面で最も重要な操作)
// → 黒背景・白文字

// - マイページへ
// → secondary(補助的な操作)
// → 白背景・枠線



// Button と LinkButton の違い

// - Button
// → 押した時に処理する
// → API呼び出し
// → フォーム送信
// → disabled が必要

// - LinkButton
// → 別ページへ移動する
// → href を持つ
// → 通常は disabled を持たない


// - Button
// 送信中・API通信中・ログイン確認中
// ↓
// 押せなくする(disabledが必要)

// - LinkButton
// 履歴一覧へ戻る・マイページへ
// ↓
// 固定ページへ移動(disabledは必要ではない)



// - API処理ではなく、行き先が固定された通常のページ移動の場合、
// <LinkButton></LinkButton> を使用する







import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  PropsWithChildren,
} from "react";


// PropsWithChildren<...>
// - children はボタンの中身。
// 例.
// <Button>
//   診断を始める
// </Button>

// の、`診断を始める` 部分を children として受け取れるようにしています。


// ...props
// - 呼び出し元(フロント側)で<Button></Button> に書いた `type=...`,`onClick=...`,`disabled=...` などが入る



// <LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>
// - 通常の <Link> に書ける機能・属性(type・disabled・className など) を、
// `web/components/ui/LinkButton.tsx` でも使えるようにするための型を定義
type LinkButtonProps = PropsWithChildren<LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: "primary" | "secondary"; }>;

export default function LinkButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: LinkButtonProps) {

  // text-sm
  // - Button と LinkButton の文字サイズを明示的に揃える

  // transition-colors
  // - hover時の色変換を滑らかにする

  // focus-visible:...
  // - キーボードの Tab で移動した時に、「今どのボタンが選択されていkるか」を見えるように(周囲にリングが表示)する

  // focus-visible:ring-offset-2
  // - ボタン本体とフォーカスリングの間に少し隙間を作る。
  const baseClassName =
    "inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2";

  const variantClassName = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  };

  return (
    <Link
      className={`${baseClassName} ${variantClassName[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}