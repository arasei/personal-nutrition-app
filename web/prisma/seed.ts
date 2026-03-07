import { PrismaClient } from "@prisma/client";

//seedは、このDBはこういう状態であるべきという完成図の役割
// Seedデータを作成
const prisma = new PrismaClient();

//メイン処理

//ユーザー(仮)
const users = [
  {
    id: "user_1",
  },
];

//親・1回の診断のデータ(仮)
//userId追加
const diagnoses = [
  {
    id: "diagnosis_1",
    userId: "user_1",
    status: "IN_PROGRESS",
  },
];

// 栄養素マスタ
const nutrients = [
  {id:"protein", name: "タンパク質", unit: "g", dailyStandard:60 },
  {id:"fiber", name: "食物繊維", unit: "g", dailyStandard:20 },
  {id:"iron", name: "鉄", unit: "g", dailyStandard:7 },
  {id:"vitaminC", name: "ビタミンC", unit: "mg", dailyStandard:100 },
  {id:"vitaminD", name: "ビタミンD", unit: "μg", dailyStandard:8 },
  {id:"vitaminB", name: "ビタミンB群", unit: "mg", dailyStandard:1 },
  {id:"omega3", name: "オメガ3脂肪酸", unit: "g", dailyStandard:2 },
  {id:"water", name: "水分", unit: "ml", dailyStandard:2000 },
]

//診断質問の初期データ
//DBロジックとデータを分離、後から質問を足すだけの仕様
//order: 質問の順番であり識別するための値ではない、表示順
//外部キーは不変である必要がある。
// diagnosisQuestionsに外部キーとしてidを作成。
const diagnosisQuestions = [
  { id: "question_1", order: 1, nutrient: "protein", questionText: "朝食を食べない日が多い" },
  { id: "question_2", order: 2, nutrient: "fiber", questionText: "1日に野菜を2回以上食べることが少ない" },
  { id: "question_3", order: 3, nutrient: "vitaminB", questionText: "外食やコンビニの食事が多い" },
  { id: "question_4", order: 4, nutrient: "omega3", questionText: "魚を食べるのは週1回以下である" },
  { id: "question_5", order: 5, nutrient: "protein", questionText: "肉・魚・卵・大豆製品を意識して食べていない" },
  { id: "question_6", order: 6, nutrient: "vitaminC", questionText: "果物をほとんど食べない" },
  { id: "question_7", order: 7, nutrient: "fiber", questionText: "間食はお菓子や菓子パンに偏りがち" },
  { id: "question_8", order: 8, nutrient: "water", questionText: "水分補給は甘い飲み物やカフェイン飲料が多い" },
  { id: "question_9", order: 9, nutrient: "vitaminD", questionText: "日中ほとんど外に出ない日が多い" },
  { id: "question_10", order: 10, nutrient: "iron", questionText: "食事の時間が不規則になりがち" }
];

//回答データ(仮)
const diagnosisAnswers = [
  {
    diagnosisId: "diagnosis_1",
    questionId: "question_1",
    answerValue: 1,
    answeredAt: new Date(),
  },
  {
    diagnosisId: "diagnosis_1",
    questionId: "question_2",
    answerValue: 0,
    answeredAt:new Date(),
  },
]

//prisma.$transaction(...)で
//途中で1件でも失敗した場合、全部無かったことにする
//$transactionとは
// 約束のリストは受け取るがそれ以外は受け取らない
//$transaction(...)内で複数mapを使う時は「...」で初めて展開し出す。

//upsertで「あれば update / なければ create」
//何回実行しても壊れない
async function main() {
  await prisma.$transaction([
    //Nutrient
    ...nutrients.map ((nutrient) =>
      prisma.nutrient.upsert({
        where: { id: nutrient.id },
        update: {},
        create: nutrient
      })
    ),


    //User
    ...users.map((user) => 
      prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
        },
      })
    ),

    //診断本体
    //Diagnosis（userId を持つ）
    //Diagnosisのseed(Userと分離)
    ...diagnoses.map((diagnosis) =>
      prisma.diagnosis.upsert({
        where: { id: diagnosis.id },
        update: {},
        create: {
          id: diagnosis.id,
          userId: diagnosis.userId,
          status: diagnosis.status,
        },
      })
    ),

    //質問マスタ
    //DiagnosisQuestion
    ...diagnosisQuestions.map((question) =>
      prisma.diagnosisQuestion.upsert({
        where: { id: question.id },
        update: {},
        create: {
          id: question.id,
          order: question.order,
          questionText: question.questionText,
          nutrient: {
            connect: {
              id: question.nutrient
            }
          }
        },
      })
    ),

    //回答
    //DiagnosisAnswer
    ...diagnosisAnswers.map((answer) =>
      prisma.diagnosisAnswer.upsert({
        where: {
          diagnosisId_questionId: {
            diagnosisId: answer.diagnosisId,
            questionId: answer.questionId,
          },
        },
        update: {
          value: answer.answerValue,
          answeredAt: answer.answeredAt,
        },
        create: {
          diagnosisId: answer.diagnosisId,
          questionId: answer.questionId,
          value: answer.answerValue,
          answeredAt: answer.answeredAt,
        },
      })
    ),

    
  ])
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

