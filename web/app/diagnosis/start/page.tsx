// web/app/diagnosis/start/page.tsx

// 全体の概要
// 診断開始ページ
// 診断開始ページ(web/app/diagnosis/start/page.tsx)を表示するだけ



// 役割
// 診断開始ページを表示
// 「診断を始める」ボタンを表示する



// このファイル内の流れ

// /diagnosis/start
//       ↓
// 説明表示
//       ↓
// StartButton
//       ↓
// 認証確認
//       ↓
// 診断作成API



import Link from "next/link";
import StartButton from "./StartButton";

export default function DiagnosisStartPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>診断を始める</h1>

      <p>ボタンを押すと質問1に進みます。</p>

      <StartButton />

      {/* トップページ(/)への遷移リンク */}
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900"
      >
        トップページへ戻る
      </Link>
    </main>
  );
}
