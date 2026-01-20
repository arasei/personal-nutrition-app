//web/app/diagnosis/start/StartButton.tsx
//診断開始ボタンコンポーネント
"use client";
import { useRouter } from 'next/navigation';

export default function StartButton() {
  
  const router = useRouter();
  //クリックで診断ステップ1へ遷移(useRouterのpushを使用)
  return (
    <button
    type="button"
    onClick={() => router.push("diagnosis/step/1")}
    style={{
      padding: "12px 16px",
      borderRadius: 8,
      border: "1px solid #ccc",
      cursor: "pointer",
    }}>
      診断を始める
    </button>
  );
}