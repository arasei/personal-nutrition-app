// web/app/diagnosis/start/page.tsx
//診断開始(/start)ページ
import StartButton from './StartButton';

export default function DiagnosisStartPage() {
  return (
    <main>
      <h1>診断を始める</h1>
      <p>ボタンを押すと質問1に進みます。</p>
      <StartButton/>
    </main>
  );
}
