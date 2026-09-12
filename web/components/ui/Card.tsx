// web/components/ui/Card.tsx

// 全体の概要
// - ログインフォームや診断案内などの「白い箱」(カード)の背景・枠線・角丸・影・内側余白を見た目を統一する共通コンポーネント
// - カードの共通の見た目を管理する場所


// ポイント


// Card.tsx
// - どのカードでも共通の見た目 を定義
// - Card は見た目だけを担当


// 各Page.tsx
// - そのページだけの幅・外側余白・配置 を定義
// - form は送信処理を担当





// 今回 カード の共通の見た目には以下は指定しない。カードを使用する場所によって変わるため

// - mt-8 などの外側余白
// - max-w-xl など、中にある要素同士の間隔
// - space-y-5 など、中にある要素同士の間隔
// - hover時の色
// - クリック処理
// - API通信やDB処理






// rounded-xl
// - カードの角を丸くする

// border border-border
// - 薄いグレーの枠線を表示

// bg-surface
// - カードの背景を白にする

// p-4
// - スマートフォンでの内側余白

// shadow-sm
// - 控えめな影を付ける

// sm:p-6
// - 画面が広い場合(PCなど)は内側余白を広げる



// 通常の <div> に渡せる属性を、共通の Card でも使えるようにする型を読み込んでいる。
// - Card に以下のような属性を渡せるようにするため
// - import type なので、画面上で動く処理として読み込むのではなく、typeScriptの確認だけに使用する。
// 使用例
// <Card id="login-card" aria-label="ログインフォーム">
import type { ComponentPropsWithoutRef } from "react";

// Card が受け取れる情報を定義
// Card が 以下のような通常の<div> と同じ属性を受け取れるようにする

// - <Card className="mt-8">
// - <Card id="diagnosis-card">
// - <Card aria-label="診断の案内">
type CardProps = ComponentPropsWithoutRef<"div">;


// Children,
// - Card の中身を受け取る
// - フロント側で Card の開始タグと終了タグの間に書いた内容(<h>...</h>・<p>...</p>など)を受け取る

// className = "",
// - 追加のclass を受け取る
// - 各フロントページで書いた専用の余白などを追加できるようにするため

// ...props
// - 残りの属性をまとめて受け取る
// - 例えば、aria-label など


export default function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
