import { PrismaClient } from "@prisma/client";

// Seedデータを作成
const prisma = new PrismaClient();

//メイン処理
//diagnosisQuestionテーブルにcreateManyで複数件データを作成
async function main() {
  await prisma.diagnosisQuestion.createMany({
    data:[
      {
        order: 1,
        questionText:'朝食を食べない日が多い',
      },
      {
        order: 2,
        questionText:'1日に野菜を2回以上食べることが少ない',
      },
      {
        order: 3,
        questionText:'外食やコンビニの食事が多い',
      },
      {
        order: 4,
        questionText:'魚を食べるのは週に1回以下である',
      },
      {
        order: 5,
        questionText:'肉・魚・卵・大豆製品を意識して食べていない',
      },
      {
        order: 6,
        questionText:'果物をほとんど食べない',
      },
      {
        order: 7,
        questionText:'間食が甘いお菓子や菓子パンに偏りがち',
      },
      {
        order: 8,
        questionText:'水分補給は甘い飲み物やカフェイン飲料が多い',
      },
      {
        order: 9,
        questionText:'日中ほとんど外に出ない日が多い',
      },
      {
        order: 10,
        questionText:'食事の時間が不規則になりがち',
      },
    ],
    //何回も実行して重複しないようにするため
    //すでに存在する質問の場合はスキップ
    skipDuplicates: true,
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())