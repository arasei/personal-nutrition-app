// web/components/ui/Button.tsx

// 全体の概要
// - <Button>(ボタン)  の見た目と役割を共通化し、何度も使い回すための共通コンポーネント


// 役割
// - 主ボタン(primary)の共通スタイル
// - 副ボタン(secondary)の共通スタイル
// - disabled 時の見た目
// - className で追加調整できる仕組み




// ポイント
// - StartButton.tsx
// → 診断を開始する「機能」を持つ

// - Button.tsx
// → ボタンの「見た目」を持つ



import type {
  ButtonHTMLAttributes,
  PropsWithChildren,
} from "react";

// variant?: "primary" | "secondary";
// - ボタンの種類を2つに限定している

// - primary(主ボタン)
// → 最も重要な操作(診断を始める・次へ・結果見る など)
// → 黒背景・白文字

// - secondary(副ボタン)
// → 補助的な操作
// → 白背景・枠線

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
  const baseClassName = "inline-flex items-center justify-center rounded px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50";

  const variantClassName = {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
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