// web/components/ui/ErrorMessage.tsx


// 全体の概要
// - ErrorMessage の見た目を共通化し、何度も使い回すための共通コンポーネント
// 今後、ログイン画面・サインアップ画面・プロフィール画面などで再利用可能


// ポイント
// - 受け取った props(children・className・id・aria-* など) を StatusMessage へ渡す
// - variant="error" を指定し、エラー用の見た目 と role="alert" を適用する



// このファイル内の流れ

// 各ページ
//   ↓
// ErrorMessage
//   ↓ variant="error"を自動指定
// StatusMessage
//   ↓
// 赤系の文字・背景・枠線
//   ↓
// role="alert"



import StatusMessage, {
  type StatusMessageBaseProps,
} from "./StatusMessage";


// フロント側からは ...props(children・className・id・aria-* など) としてまとめて受け取る

export default function ErrorMessage(
  props: StatusMessageBaseProps
) {
  return (
    <StatusMessage
      {...props}
      variant="error"
    />
  );
}
