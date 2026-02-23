//現在Server ComponentとしてDBから直接データ取得 → 集計 → 画面表示するページ(web/diagnosis/[diagnosisId]/result/page.tsx)に変更しているため、
// API route.tsは現在使用していない状態ですが、今後必要に応じてAPI route.tsを呼び出す形に変更する可能性もあるため、コードは残しています。
// 現在は使用していないAPI route.tsのコード --- IGNORE ---
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { diagnosisId } = await req.json();

  //診断回答を取得
  //診断回答(diagnosisAnswer)と質問(diagnosisQuestion)を紐付けして、diagnosisQuestion内の栄養素ID(nutrientId)とポイント(value)を取得
  const answers = await prisma.diagnosisAnswer.findMany({
    where: { diagnosisId },
    include: {
      question: {
        select: {
          nutrientId: true,
          nutrient: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  //スコア集計箱を作成
  //// nutrientId(string) → score
  const scoreMap: Record<string, number> = {};

  //ループで集計
  for (const item of answers) {
    const nutrientId = item.question.nutrientId;
    const point = item.value;

    scoreMap[nutrientId] = (scoreMap[nutrientId] ?? 0) + point;
  }

  //不足順
  const ranking = Object.entries(scoreMap)
    .sort((a, b) => a[1] - b[1])
    .map(([nutrientId, total]) => ({
      nutrientId,
      total,
    }));
  return NextResponse.json({
    scoreMap,
    ranking,
  });
}