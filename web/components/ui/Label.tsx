
// web/components/ui/Label.tsx


// 全体の概要
// - <label>(入力欄の名前)  の見た目と役割を共通化し、何度も使い回すための共通コンポーネント



// 役割
// - 入力欄の名前を表示する
// - 呼び出し元で、htmlFor と Input の id を 同じ値にすると 入力欄の説明(<label>) と 入力欄(<input>)を紐付けることができる。
// <label/> をクリックした時に対応する入力欄へ フォーカスできるようにするため
// - <label/> に対して 共通のCSS を定義し、フォームごとの見た目を統一する



// ポイント
// - フロントで 表示する文字を <label>...<label/> で 入力欄の名前を囲むことで
// 文字を表示する際の見た目(CSS) を `web/components/ui/Label.tsx` 内で 定義した内容に統一し、共通コンポーネントとして管理することができる
// - 何度も使う UI を components として作成しておくことで、毎回書く手間を省くことができる
// - 入力欄の名前 の デザイン(<label/>) を変えたい場合、Label.tsx を変更すればよい


// 使用例.
{/* 
<Label htmlFor="email">
  メールアドレス
</Label> 
*/}



// - このファイル内の流れ
// signup/page.tsx などの画面
//         ↓
// <Input /> と <Label /> を使う
//         ↓
// 共通の見た目・入力機能を利用する(`web/components/ui/Label.tsx`・`web/components/ui/Input.tsx`)
//         ↓
// デザイン変更は Input.tsx / Label.tsx を直すだけで反映される


import type { ComponentPropsWithoutRef } from "react";
// - 通常の <label> 内で 書いている渡せる機能・属性 を 共通Labelコンポーネント(`web/components/ui/Label.tsx`) でも受け取り、使えるようにするための props の型 を定義
// - 通常の <label> に渡せるもの・属性・機能(htmlFor・children・className など)
type LabelProps = ComponentPropsWithoutRef<"label">;

// - `{...props}` : 呼び出し側(フロント側の<label/>)で書いた <label> に渡す機能・属性(htmlFor・children・aria属性など) を
// `...props` として `web/components/ui/Label.tsx` でまとめて受け取り、<label/>内で使用する。
export function Label({ className = "", ...props }: LabelProps) {
  return (
    <label
      {...props}
      className={`mb-1 block text-sm font-medium ${className}`}
    />
  )
}