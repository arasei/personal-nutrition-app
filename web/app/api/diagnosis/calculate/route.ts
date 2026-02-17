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