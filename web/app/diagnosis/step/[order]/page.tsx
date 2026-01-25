// web/app/diagnosis/step/[order]/page.tsx
//診断ステップページコンポーネント
//URL→検証→DB→表示→次の導線

//URLで状態を表す
//1問分の枠組みを表示

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

//URLパラメータの型定義
//searchParamsでdiagnosisIdを受け取る設計に変更
//diagnosisIdは任意、paramsは必須
type PageProps = {
  params: Promise<{order: string}>;
  searchParams: Promise<{ diagnosisId?: string }>;
};

//診断ステップページコンポーネント
export default async function DiagnosisStepPage({ params, searchParams } : PageProps) {
  //Next.jsの仕様に合わせてsearchParamsをawaitで展開
  //URLパラメーターからorderとdiagnosisIdを取得
  const { order } = await params; 
  const { diagnosisId } = await searchParams;

  //diagnosisIdが無いと、回答保存ができないので初めにチェックを行う
  //diagnosisIdが存在しない場合はnotFoundを呼び出して404ページへ遷移
  if (!diagnosisId) {
    notFound();
  };

  //取得したorder(文字列)を数値に変換
  //order(文字列)が数字として不正な場合はnotFoundを呼び出して404ページへ遷移
  const orderNum = Number(order); 
  if (!Number.isFinite(orderNum) || orderNum < 1) notFound();

  //diagnosisIdから診断レコードがDBに存在するか確認
  //存在しない場合はnotFoundを呼び出して404ページへ遷移
  const diagnosis = await prisma.diagnosis.findUnique({
    where: {id: diagnosisId},
    select: {id: true },
  });
  if (!diagnosis) notFound();
  
  //全質問数をDBから取得
  //全質問数が0件orURLパラメータのorderが全質問数を超えている場合はnotFoundを呼び出して404ページへ遷移
  const total = await prisma.diagnosisQuestion.count();
  if (total === 0 || orderNum > total) notFound();

  //Prisma Clientを使ってDBから現在の質問(orderNum)を1件取得
  //質問が存在しない場合はnotFoundを呼び出して404ページへ遷移
  const question = await prisma.diagnosisQuestion.findUnique({
    where: { order: orderNum },
  });
  if (!question) notFound();

  //次の質問へのリンクを作成
  //次のリンクにも診断ID(diagnosisId)をクエリパラメータで渡す設計に変更
  //最後の質問の場合は結果ページへのリンクにする
  const isLast = orderNum === total;
  const nextHref = isLast ? `/diagnosis/result?diagnosisId=${diagnosisId}` : `/diagnosis/step/${orderNum + 1}?diagnosisId=${diagnosisId}`;

  //ページのUIを返す
  return (
    <main style={{ padding: "24px" }}>
      <h1>診断 Step {orderNum}</h1>
      <p>現在の質問番号: {orderNum}/{total}</p>
      <p>質問:{question.questionText}</p>

      <div style={{ marginTop: "16px" }}>
        <Link href={nextHref}>{isLast ? "結果へ" : "次へ"}</Link>
      </div>
    </main>
  )
}