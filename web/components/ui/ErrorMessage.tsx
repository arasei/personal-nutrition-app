// web/components/ui/ErrorMessage.tsx


// 全体の概要
// - ErrorMessage の見た目を共通化し、何度も使い回すための共通コンポーネント
// 今後、ログイン画面・サインアップ画面・プロフィール画面などで再利用可能


// PropsWithChildren
// - フロント側で以下の例.のように書いた「ログインに失敗しました。」(ErrorMessage の中に書いた内容)を
// children としてこのファイルで受け取れるようにする。
{/*
  例.
  <ErrorMessage>
    ログインに失敗しました。
  </ErrorMessage>
*/}

// HTMLAttributes<HTMLDivElement>
// - 通常の <div> に指定できる属性を ErrorMessage にも渡せるようにする。



import type { HTMLAttributes, PropsWithChildren } from "react";

// ErrorMessage が指定できる・受け取れる型を定義
// - children・className・aria-*・data-*・divで使える属性 を受け取ることが可能
type ErrorMessageProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement>
>;

// フロント側からは children ・ className ・ ...props の3種類受け取る

// children
// - エラー本文

// className = ""
// - フロント側から追加するCSS("")

// ...props
// - その他のdiv属性



// role = "alert"
// - "この内容はユーザーへ知らせる必要がある重要なメッセージです" という意味を持たせる

export default function ErrorMessage({
  children,
  className = "",
  ...props
}: ErrorMessageProps) {
  return (
    <div
      {...props}
      role="alert"
      className={`rounded-lg bg-red-50 px-3 py-2 text-sm leading-6 text-red-700 ${className}`}
    >
      {children}
    </div>
  );
}