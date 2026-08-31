// web/components/ui/SuccessMessage.tsx

// 全体の概要
// - SuccessMessage の見た目を共通化し、何度も使い回すための共通コンポーネント
// 今後、ログイン画面・サインアップ画面・プロフィール画面などで再利用可能



// ポイント
// - 受け取った props(children・className・id・aria-* など) を StatusMessage へ渡す
// - variant="success" を指定し、成功用の見た目 と role="status" を適用する



// このファイル内の流れ

// 各ページ
//   ↓
// SuccessMessage
//   ↓ variant="status"を自動指定
// StatusMessage
//   ↓
// 緑系の背景・枠線
//   ↓
// role="status"


import StatusMessage, {
  type StatusMessageBaseProps,
} from "./StatusMessage";


// フロント側からは ...props(children・className・id・aria-* など) としてまとめて受け取る

export default function SuccessMessage(
  props: StatusMessageBaseProps
) {
  return (
    <StatusMessage
      {...props}
      variant="success"
    />
  );
}
