// web/app/diagnosis/step/[order]/page.tsx
//診断ステップページコンポーネント

//URLで状態を表す
//1問分の枠組みを表示

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

//URLパラメータの型定義
type Params = {
  order: string;
};

export default async function DiagnosisStepPage({ params, } : { params: Promise<Params>}) {
  //URLパラメータからorderを取得
  const { order} = await params;
  //取得したorder(文字列)を数値に変換
  const orderNum = Number(order); 
  //order(文字列)が数字として不正な場合はnotFoundを呼び出して404ページへ遷移
  if (!Number.isFinite(orderNum) || orderNum < 1) {
    notFound();
  }
  
  //全質問数をDBから取得
  const total = await prisma.diagnosisQuestion.count();
  
  //全質問数が0件の場合はnotFoundを呼び出して404ページへ遷移
  if (total === 0) notFound();

//URLパラメータのorderが全質問数を超えている場合はnotFoundを呼び出して404ページへ遷移
  if (orderNum > total) notFound();

  //Prisma Clientを使ってDBから現在の質問(orderNum)を1件取得
  const question = await prisma.diagnosisQuestion.findUnique({
    where: { order: orderNum },
  });

  //取得した質問が存在しない場合はnotFoundを呼び出して404ページへ遷移
  if (!question) notFound();

  //次の質問へのリンクを作成
  const isLast = orderNum === total;
  const nextHref = isLast ? "/diagnosis/result" : `/diagnosis/step/${orderNum + 1}`;

  return (
    <main style={{ padding: 24 }}>
      <h1>診断 Step{orderNum}</h1>
      {/* 現在の質問番号と質問文を表示 */}
      <p>現在の質問番号{orderNum}/{total}</p>
      <p>質問:{question.questionText}</p>
      {/* 次へor結果へ(次の質問へのリンクを表示) */}
      <div style={{ margin: 16 }}>
        <Link href={nextHref}>{isLast ? "結果へ" : "次へ"}</Link>
      </div>
    </main>
  );
}