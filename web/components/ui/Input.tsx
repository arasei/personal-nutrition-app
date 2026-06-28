// web/components/ui/Input.tsx


// 全体の概要
// - input(入力欄そのもの) の見た目を共通化し、何度も使い回すための共通コンポーネント
// 今後、ログイン画面・サインアップ画面・プロフィール画面などで再利用可能




// 役割
// - アプリ内の input 基本デザインを `web/components/ui/Input.tsx` で統一する
// - type・value・onChange・required など、通常の input の属性・機能 をそのまま利用できる
// - forwardRef を使い、react-hook-form などから渡される ref を実際の input に渡せるようにする

// - 通常の入力情報
// → props

// - 実際の input 要素への参照・操作
// → ref





// ポイント
// - 現在、私の他のファイルで react-hook-form も使用している
// - 将来、共通の Input を react-hook-form の register() と一緒に使う可能性を考えると、
// 最初から forwardRef 対応にしておく方が安全

// - 普通の Input
// → 値入力はできる

// - forwardRef 対応の Input
// → react-hook-form から渡される ref も実際の input に渡せる
// → 入力エラー時に対象入力欄へフォーカスしやすい






// WithoutRef とする理由

// - ref は通常の props とは少し特別な扱い
// - 今回は forwardRef で別途 ref を受け取るため、props側から除外した ComponentPropsWithoutRef を使用する







// - このファイル内の流れ

// signup/page.tsx などの画面
//         ↓
// <Input /> と <Label /> を使う
//         ↓
// 共通の見た目・入力機能を利用する
//         ↓
// デザイン変更は Input.tsx / Label.tsx を直すだけで反映される



// - forwardRef : 親コンポーネント や react-hook-form から渡された ref を フロントで使用している <input> に渡すために使う
// - ComponentPropsWithoutRef : 通常の <input> が 本来使用できる機能・属性(type・value・onChange など)を、そのまま TypeScript で使えるようにするための型
import { forwardRef, type ComponentPropsWithoutRef } from "react";

// - 通常の <input> 内 で 使用するために書いている内容(機能・属性) を
// 共通Inputコンポーネント(`web/components/ui/Input.tsx`) でも受け取り、使えるようにするための props の型 を定義
// - 通常の <input> に渡せるもの・属性・機能(type・value・onChange・required など)
// - 受け取る型 としては `ref` を `props` からは受け取らないようにしている
// `ref` は `forwardRef<HTMLInputElement, InputProps>` で 別に受け取るため
type InputProps = ComponentPropsWithoutRef<"input">;



// - `web/components/ui/Input.tsx` は 親コンポーネントや react-hook-form から input 要素への ref を受け取れる(HTMLInputElement)
// かつ、input に使える属性も受け取れる(InputProps)
// そして、その `ref` を 実際のフロント側 の <input/> 要素へ渡して、ref を通じて、その input を直接操作できる機能を使用できるようにする

// <HTMLInputElement, InputProps>
//         ↓
// ref は HTMLInputElement 型
// props は InputProps 型

export const Input = forwardRef<HTMLInputElement, InputProps>(
  // props と ref を受け取る

  // - `className = ""` :
  // className を
  // フロント側で書いていた場合、書いた内容を使用する
  // フロント側で書いていない場合、空文字とする

  // - `...props` : 呼び出し側(フロント側の<input/>) で 書いた <input/> に渡す機能・属性(type、value、onChange、required など) を
  // `...props` として `web/components/ui/Input.tsx` で まとめて受け取り、<input>内で使用する

  // - `ref` : forwardRef`web/components/ui/Input.tsx` で共通化した <input> の機能・属性 を フロントで使い回すために `forwardRef` を使用する。
  // `ref={ref}` を通じて、その <input/> の内容を 直接操作することができる。この、`ref` には、HTMLInputElement という型を付与している
  // - ref のイメージ
  // Input コンポーネント
  // ↓
  // 実際の <input> 要素
  // ↓
  // ref を通じて、その input を直接操作できる


  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full rounded border px-3 py-2 ${className}`}
      />
    );
  }
);

// - forwardRef を使うと、開発ツール上で表示名が少しわかりにくくなるので、
// そのため、`ForwardRef` ではなく `Input` と表示されるようにしている
Input.displayName = "Input";