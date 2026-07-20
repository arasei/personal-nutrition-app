// web/prisma/seed.ts

// 全体の概要
// - 指定した DB の設計図・完成図 を書いているファイル

// 現在、seed で扱う DB の設計・完成図 の内容
// - Nutrient
// - DiagnosisQuestion
// - NutrientRecommendation


// ポイント
// - seedは、このDBはこういう状態であるべきという完成図の役割
// - アプリを動かすために必要な固定マスターを登録する
// - seed は何度実行しても壊れない構成にする
// - update: {...} では seed内容の変更が DB に反映されない
// upsert が内部で行なっていること

// where条件で検索
// ↓
// 既存レコードがある？
// ├─ Yes → update
// └─ No  → create

// - 空配列でも型は明示する必要がある
// - Prismaのリレーションフィールド名はcamelCaseが適している

// このファイル内の流れ
// seed.ts
//   │
//   ├─ nutrients[]
//   │      ↓
//   │   Nutrient
//   │
//   ├─ diagnosisQuestions[]
//   │      ↓
//   │   DiagnosisQuestion
//   │
//   └─ nutrientRecommendations[]
//          ↓
//       NutrientRecommendation

// すべてtransaction内で実行
//          ↓
// 全部成功 → 保存
// 1件失敗 → 全体を取り消す



// 栄養素マスター(Nutrient)を登録
// ↓
// 栄養素に紐づく質問(DiagnosisQuestion)を登録
// ↓
// 栄養素に紐づく食品・行動提案(NutrientRecommendation)を登録
// ↓
// seed 実行
// ↓
// DBに栄養素がある？
// ├─ ある → 最新内容へ更新
// └─ ない → 新しく作成
// ↓
// DBに質問がある？
// ├─ ある → 最新内容へ更新
// └─ ない → 新しく作成
// ↓
// DBに提案がある？
// ├─ ある → 説明・順番を更新
// └─ ない → 新しく作成
// ↓
// seed完了






// PrismaでDBを操作するためのクラスを読み込む
import {
  PrismaClient,
  RecommendationType,
} from "@prisma/client";


// 栄養素マスター
// - seed を実行すると、この配列の内容を DB に登録する
// - unit は 単位
// - dailyStandard は目安値

const nutrients = [
  {
    id:"protein",
    name: "タンパク質",
    unit: "g",
    dailyStandard:60
  },
  {
    id:"fiber",
    name: "食物繊維",
    unit: "mg",
    dailyStandard:20
  },
  {
    id:"iron",
    name: "鉄",
    unit: "mg",
    dailyStandard:7
  },
  {
    id:"vitaminC",
    name: "ビタミンC",
    unit: "mg",
    dailyStandard:100
  },
  {
    id:"vitaminD",
    name: "ビタミンD",
    unit: "μg",
    dailyStandard:8
  },
  {
    id:"vitaminB",
    name: "ビタミンB群",
    unit: "mg",
    dailyStandard:1
  },
  {
    id:"omega3",
    name: "オメガ3脂肪酸",
    unit: "g",
    dailyStandard:2
  },
  {
    id:"water",
    name: "水分",
    unit: "ml",
    dailyStandard:2000
  },
]

// 診断質問マスター(質問ごとに栄養素(nutrientId)を紐付け)
// - 診断画面に表示する固定質問を定義
// - DBロジックとデータを分離、後から質問を足すだけの仕様
// - order: 質問の順番であり識別するための値ではない、表示順
// - 外部キーは不変である必要がある。
// - diagnosisQuestionsに外部キーとしてidを作成。
const diagnosisQuestions = [
  {
    id: "question_1",
    order: 1,
    nutrientId: "protein",
    questionText: "朝食を食べない日が多い",
  },
  {
    id: "question_2",
    order: 2,
    nutrientId: "fiber",
    questionText: "1日に野菜を2回以上食べることが少ない",
  },
  {
    id: "question_3",
    order: 3,
    nutrientId: "vitaminB",
    questionText: "外食やコンビニの食事が多い",
  },
  {
    id: "question_4",
    order: 4,
    nutrientId: "omega3",
    questionText: "魚を食べるのは週1回以下である",
  },
  {
    id: "question_5",
    order: 5, 
    nutrientId: "protein",
    questionText: "肉・魚・卵・大豆製品を意識して食べていない"
  },
  {
    id: "question_6",
    order: 6,
    nutrientId: "vitaminC",
    questionText: "果物をほとんど食べない"
  },
  {
    id: "question_7",
    order: 7,
    nutrientId: "fiber",
    questionText: "間食はお菓子や菓子パンに偏りがち",
  },
  {
    id: "question_8",
    order: 8,
    nutrientId: "water",
    questionText: "水分補給は甘い飲み物やカフェイン飲料が多い",
  },
  {
    id: "question_9",
    order: 9,
    nutrientId: "vitaminD",
    questionText: "日中ほとんど外に出ない日が多い",
  },
  {
    id: "question_10",
    order: 10,
    nutrientId: "iron",
    questionText: "食事の時間が不規則になりがち",
  }
];



// DB操作するための入り口のオブジェクト作成
const prisma = new PrismaClient();

type NutrientRecommendationSeed = {
  nutrientId: string;
  type: RecommendationType;
  title: string;
  description: string;
  sortOrder: number;
};

// 食品・行動提案マスター(食品・行動提案ごとに栄養素を紐づけ)
const nutrientRecommendations: NutrientRecommendationSeed[] = [];




// prisma.$transaction(...)で、途中で1件でも失敗した場合、全部無かったことにする
// $transactionとは
// - Prisma の DB処理(Promise)だけ を配列にして受け取る
// - $transaction(...)内で複数mapを使う時は「...」で初めて展開し出す。

// upsertで「あれば update / なければ create」
// 何回実行しても壊れない


async function main() {
  await prisma.$transaction([
    // Nutrient
    // - 栄養素マスタ
    // - 栄養素1件ずつを DB操作へ変換
    // - 今回と同じIDの栄養素が存在すれば更新、存在しなければ新規作成する
    ...nutrients.map ((nutrient) =>
      prisma.nutrient.upsert({
        where: {
          id: nutrient.id
        },
        update: {
          name: nutrient.name,
          unit: nutrient.unit,
          dailyStandard: nutrient.dailyStandard,
        },
        create: nutrient
      })
    ),


    // DiagnosisQuestion
    // - 質問マスタ
    // - 同じ質問IDが既存レコードにあれば更新(update)、なければ新規作成(create)
    // - order: 表示順
    ...diagnosisQuestions.map((question) =>
      prisma.diagnosisQuestion.upsert({
        where: {
          id: question.id
        },
        update: {
          order: question.order,
          questionText: question.questionText,
          nutrient: {
            connect: {
              id: question.nutrientId,
            },
          },
        },
        create: {
          id: question.id,
          order: question.order,
          questionText: question.questionText,
          nutrient: {
            connect: {
              id: question.nutrientId,
            },
          },
        },
      })
    ),


    // NutrientRecommendation
    // - 提案マスタ
    // - 提案データを1件ずつDB操作へ変換する
    // - 同じ提案が存在すれば更新し(update)、なければ新規作成(create)する
    // - nutrientId_type_title: {...} :
    // Schema で定義した複合ユニークキーを使う
    ...nutrientRecommendations.map((recommendation) =>
      prisma.nutrientRecommendation.upsert({
        where: {
          nutrientId_type_title: {
            nutrientId: recommendation.nutrientId,
            type: recommendation.type,
            title: recommendation.title,
          },
        },
        update: {
          description: recommendation.description,
          sortOrder: recommendation.sortOrder,
        },
        create: recommendation,
      })
    ),
  ]);
  console.log(
    `seed完了: 栄養素${nutrients.length}件、質問${diagnosisQuestions.length}件、提案${nutrientRecommendations.length}件`
  );
}

// .finally(async () => { await prisma.$disconnect();}); で、DB接続リーク防止
main()
  .catch((error) => {
    console.error("seed 失敗:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

