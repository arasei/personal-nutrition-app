// web/app/diagnosis/step/[order]/page.tsx
//診断ステップページコンポーネント

//URLで状態を表す
//1問分の枠組みを表示

import Link from "next/link";
import { notFound } from "next/navigation";

type Params = {
  order: string;
};

export default async function DiagnosisStepPage({ params } : { params: Promise<Params> }) {
  const { order } = await params;
  //1)URLパラメータからorderを取得(文字列として)
  const orderStr = order;
  //2)取得したorder(文字列)を数値に変換
  const orderNum = Number(orderStr); 
  //3)order(文字列)が数字として不正な場合はnotFoundを呼び出して404ページへ遷移
  if (!Number.isFinite(orderNum) || orderNum < 1) {
    notFound();
  }
  const nextOrder = orderNum + 1;

  return (
    <main style={{ padding: 24 }}>
      <h1>診断 Step{order}</h1>
      {/* 4)画面に現在のステップ(order)を表示 */}
      <p>現在の質問番号{order}/8</p>
      {/* 5)次へ(次の質問へのリンクを表示) */}
      <Link href={`/diagnosis/step/${nextOrder}`}>次へ</Link>
    </main>
  );
}