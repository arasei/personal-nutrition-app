// web/components/ui/StatusMessage.tsx


// 全体の概要
// - エラーと成功のお知らせについて、見た目(共通の余白・角丸・文字・状態色) と アクセシビリティ上の役割を統一する共通コンポーネント
// - エラーと成功のお知らせについて の見た目を一括管理する場所

import type { HTMLAttributes, PropsWithChildren } from "react";


// このファイル内の流れ

// エラー表示
// <ErrorMessage>
// ↓
// variant="error"
// ↓
// 赤い文字・薄い赤背景・赤い枠線
// ↓
// role="alert"

// 成功表示
// <SuccessMessage>
// ↓
// variant="success"
// ↓
// 薄い緑背景・緑の枠線
// ↓
// role="status"


// ErrorMessage と SuccessMessage が共通して受け取れる型を定義
// - 通常の div 属性を使えるようにする
// 以下を渡せるようにする

// - <StatusMessage id="answer-error">
// - <StatusMessage aria-label="エラーメッセージ">
// - <StatusMessage className="mt-4">


// PropsWithChildren
// - フロント側で以下の例.のように書いた ErrorMessage や SuccessMessage の開始タグ と 終了タグの間に書いたメッセージ本文を
// children としてこのファイルで受け取れるようにする。

// 例.
// <ErrorMessage>
//   ログインに失敗しました。
// </ErrorMessage>

// <SuccessMessage>
//   ログインに成功しました
// </SuccessMessage>

// HTMLAttributes<HTMLDivElement>
// - 通常の <div> に指定できる属性(id・className・aria-* など) を
// ErrorMessage と SuccessMessage にも渡せるようにし、使用できるようにする。


export type StatusMessageBaseProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement>
>;

// 表示形式を2種類に限定して定義
type StatusMessageVariant = "error" | "success";

type StatusMessageProps = StatusMessageBaseProps & {
  variant: StatusMessageVariant;
};

// 表示内容によって切り替える色を定義
const variantClassName = {
  error: "border-error/30 bg-error/10 text-error",
  success: "border-success/30 bg-success/10 text-foreground",
};

// role={variantRole[variant]}
// - "この内容はユーザーへ知らせる必要がある重要なメッセージです" という意味を持たせる

// 表示内容によって切り替えるHTML上の役割(role)を エラー と 成功 の2種類定義

// error = "alert"
// - エラーの場合の役割

// success: "status"
// - 成功の場合の役割

const variantRole = {
  error: "alert",
  success: "status",
} as const;


// フロント側からは children ・ className ・ ...props の3種類受け取る

// children
// - 表示するエラー または 成功メッセージ の本文

// className = ""
// - 呼び出し側(フロント)から追加するクラス名("")
// - 指定されなかった場合は、空文字を使用する

// ...props
// - その他のdiv属性


// props を先に渡す
// - props に間違って別のrole が含まれてても、すでに定義している正しいrole として優先して扱うため
export default function StatusMessage({
  children,
  variant,
  className = "",
  ...props
}: StatusMessageProps) {
  return (
    <div
      {...props}
      role={variantRole[variant]}
      className={`rounded-lg border px-3 py-2 text-sm font-medium leading-6 ${variantClassName[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
