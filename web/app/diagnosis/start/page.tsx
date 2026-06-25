// web/app/diagnosis/start/page.tsx

// 全体の概要
// 診断開始ページ
// 診断開始ページ(web/app/diagnosis/start/page.tsx)を表示するだけ



// 役割
// 診断開始ページを表示
// 「診断を始める」ボタンを表示する



import StartButton from "./StartButton";

export default function DiagnosisStartPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>診断を始める</h1>
      <p>ボタンを押すと質問1に進みます。</p>
      <StartButton />
    </main>
  );
}
