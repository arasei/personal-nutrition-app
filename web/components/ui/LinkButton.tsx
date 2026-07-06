// web/components/ui/LinkButton.tsx

// 全体の概要
// - <Link>(リンク)  の見た目と役割を共通化し、何度も使い回すための共通コンポーネント



// 役割
// - 主ボタン(primary)の共通スタイル
// - 副ボタン(secondary)の共通スタイル
// - className で追加調整できる仕組み




// ポイント

// - router
// → 条件に応じた自動リダイレクトに使用する

// - LinkButton
// → ユーザーが押す通常のページ移動に使用する


// variant?: "primary" | "secondary";
// - ボタンの種類を2つに限定している

// - 今回の履歴詳細を見る
// → primary
// → 黒背景・白文字

// -マイページへ
// → secondary
// → 白背景・枠線



// Button と LinkButton の違い

// -Button
// → 押した時に処理する
// → API呼び出し
// → フォーム送信
// → disabled が必要

// -LinkButton
// → 別ページへ移動する
// → href を持つ
// → 通常は disabled を持たない



// - API処理ではなく、行き先が固定された通常のページ移動の場合、
// <LinkButton></LinkButton> を使用する







import Link, { type LinkProps } from "next/link";
import type {
  AnchorHTMLAttributes,
  PropsWithChildren,
} from "react";

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
  const baseClassName = "inline-flex items-center justify-center rounded px-4 py-2 font-medium";

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