//現在の診断結果ページは Server Component 側(result/page.tsx)でDB取得 → スコア集計 → 画面表示まで完結しているため、
//このAPIは(calculate/route.ts) は現時点では画面描画には使っていない。
//このAPIで行なっている処理は、診断の最後の質問送信後に呼び出されるServer Action(web/app/diagnosis/step/StepAction.ts)内で行うように変更したため
//ただし、今後の設計変更や再利用に備えてコードは保持している。
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { diagnosisId } = await req.json();

  //診断回答を取得
  //診断ログ(diagnosisAnswerの中身と紐付けしたdiagnosisQuestion内のnutrition)を取得
  const answers = await prisma.diagnosisAnswer.findMany({
    where: { diagnosisId },
    include: {
      question: true,
    },
  });

  //スコア集計箱を作成
  const scoreMap: Record<string, number> = {};

  //ループで集計
  for (const item of answers) {
    const nutrient = item.question.nutrient;
    const point = item.value;

    scoreMap[nutrient] = (scoreMap[nutrient] ?? 0) + point;
  }

  //不足順
  const ranking = Object.entries(scoreMap)
    .sort((a, b) => a[1] - b[1])
    .map(([nutrient, total]) => ({
      nutrient,
      total,
    }));
  return NextResponse.json({
    scoreMap,
    ranking,
  });
}