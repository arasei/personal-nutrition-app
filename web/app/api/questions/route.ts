//Route HandlerをNode実行に固定(PrismaはEdge不可)
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


// GET /api/questions
//findManyで全件取得し、orderで昇順(asc)にソートして返す
export async function GET() {
  const questions = await prisma.diagnosisQuestion.findMany(
    { orderBy: { order: "asc" } },
  );
  return NextResponse.json(questions);
}