import { PrismaClient } from "@prisma/client";

// Seedデータを作成
const prisma = new PrismaClient();

//メイン処理
//診断質問の初期データ
//DBロジックとデータを分離、後から質問を足すだけの仕様
//order: 質問の順番であり識別するための値でもある
const diagnosisQuestions = [
  { order: 1, questionText: "朝食を食べない日が多い"},
  { order: 2, questionText: "1日に野菜を2回以上食べることが少ない"},
  { order: 3, questionText: "外食やコンビニの食事が多い"},
  { order: 4, questionText: "魚を食べるのは週に1回以下である"},
  { order: 5, questionText: "肉・魚・卵・大豆製品を意識して食べていない"},
  { order: 6, questionText: "果物をほとんど食べない"},
  { order: 7, questionText: "間食が甘いお菓子や菓子パンに偏りがち"},
  { order: 8, questionText: "水分補給は甘い飲み物やカフェイン飲料が多い"},
  { order: 9, questionText: "日中ほとんど外に出ない日が多い"},
  { order: 10, questionText: "食事の時間が不規則になりがち"},
];

//prisma.$transaction(...)で
//途中で1件でも失敗した場合、全部無かったことにする

//upsertで「あれば update / なければ create」
//何回実行しても壊れない
async function main() {
  await prisma.$transaction(
    diagnosisQuestions.map((question) =>
      prisma.diagnosisQuestion.upsert({
        where: { order: question.order },
        update: {
          questionText: question.questionText,
        },
        create: {
          order: question.order,
          questionText: question.questionText,
        },
      })
    )
  );
  console.log("DiagnosisQuestion seed 完了")
}

//finally { prisma.$disconnect() }で
//DB接続リーク防止
main()
  .catch((error) => {
    console.error("seed 失敗:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

