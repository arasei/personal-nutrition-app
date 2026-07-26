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

// score が 49点以下の栄養素のみ提案する
// 最大3栄養素表示
// 医療診断のような断定はしない
// 「食生活を見直すヒント」を表示する

// 栄養素1件に対して 食品提案2つ(FOOD)・行動提案1つ(ACTION) の設計

// 現在の件数
// - 栄養素8件
// - 質問10件
// - 提案24件

// nutrientId
// - どの栄養素に対する提案なのかを指定する
// - 各8栄養素
// - Nutrient.id と一致する値であることが必須
// type
// - 食品提案 or 行動提案 なのかを指定する
// - FOOD / ACTION (食品提案 と 行動提案) の2つ存在する
// - 生成済みの enum を使用することで入力ミスを防ぐ
// title
// - 結果画面で一目で意味がわかる短い見出し
// - 何をすると良いかを伝える
// description
// - title だけでは説明できない補足情報
// - どのように取り入れると良いかを伝える
// - 医療的に断定しない文章
// sortOrder
// - 同じ栄養素・同じ種類の提案をする場合の表示する順番を指定
// - FOOD は 1・2 ACTION は 1
const nutrientRecommendations: NutrientRecommendationSeed[] = [
  // タンパク質
  {
    nutrientId: "protein",
    type: RecommendationType.FOOD,
    title: "肉・魚・卵を取り入れる",
    description: "肉・魚・卵などは、たんぱく質を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "protein",
    type: RecommendationType.FOOD,
    title: "大豆製品を活用する",
    description: "豆腐・納豆・豆乳などの大豆製品も、たんぱく質を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "protein",
    type: RecommendationType.ACTION,
    title: "毎食たんぱく質を意識する",
    description: "主食だけで済ませず、毎食たんぱく質を含む食品を取り入れられるか振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
  // 食物繊維
  {
    nutrientId: "fiber",
    type: RecommendationType.FOOD,
    title: "野菜を一品追加する",
    description: "野菜は食物繊維を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "fiber",
    type: RecommendationType.FOOD,
    title: "きのこ・海藻を取り入れる",
    description: "きのこ類や海藻類は食物繊維を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "fiber",
    type: RecommendationType.ACTION,
    title: "野菜から食べ始める",
    description: "食事では野菜から食べ始められるか振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
  // ビタミンB
  {
    nutrientId: "vitaminB",
    type: RecommendationType.FOOD,
    title: "豚肉を取り入れる",
    description: "豚肉はビタミンB群を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "vitaminB",
    type: RecommendationType.FOOD,
    title: "納豆や卵を取り入れる",
    description: "納豆や卵はビタミンB群を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "vitaminB",
    type: RecommendationType.ACTION,
    title: "主食だけの食事を減らす",
    description: "主食だけで済ませる日がないか振り返ってみましょう。無理のない範囲でおかずを組み合わせる方法を探してみましょう。",
    sortOrder: 1,
  },
  // omega3(オメガ3脂肪酸)
  {
    nutrientId: "omega3",
    type: RecommendationType.FOOD,
    title: "青魚を取り入れる",
    description: "青魚はオメガ3脂肪酸を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "omega3",
    type: RecommendationType.FOOD,
    title: "くるみを取り入れる",
    description: "くるみなどのナッツ類も、オメガ3脂肪酸を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "omega3",
    type: RecommendationType.ACTION,
    title: "魚料理を選ぶ日を作る",
    description: "魚料理を選ぶ日を作れるか振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
  // vitaminC(ビタミンC)
  {
    nutrientId: "vitaminC",
    type: RecommendationType.FOOD,
    title: "果物を取り入れる",
    description: "みかん・キウイ・いちごなどは、ビタミンCを含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "vitaminC",
    type: RecommendationType.FOOD,
    title: "野菜を取り入れる",
    description: "ブロッコリーやパプリカは、ビタミンCを含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "vitaminC",
    type: RecommendationType.ACTION,
    title: "毎日果物や野菜を取り入れる",
    description: "毎日の食事で果物や野菜を取り入れられるか振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
  // water(水分)
  {
    nutrientId: "water",
    type: RecommendationType.FOOD,
    title: "汁物を取り入れる",
    description: "味噌汁やスープなどは、水分を摂る方法の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "water",
    type: RecommendationType.FOOD,
    title: "水分を含む果物を取り入れる",
    description: "スイカやオレンジなどは、水分を多く含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "water",
    type: RecommendationType.ACTION,
    title: "こまめな水分補給を意識する",
    description: "こまめな水分補給ができているか振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
  // vitaminD(ビタミンD)
  {
    nutrientId: "vitaminD",
    type: RecommendationType.FOOD,
    title: "鮭やサバを取り入れる",
    description: "鮭やサバは、ビタミンDを含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "vitaminD",
    type: RecommendationType.FOOD,
    title: "きのこ類を取り入れる",
    description: "きのこ類は、ビタミンDを含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "vitaminD",
    type: RecommendationType.ACTION,
    title: "日光を浴びる時間を作る",
    description: "日光を浴びる時間を作れるか生活習慣を振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
  // iron(鉄)
  {
    nutrientId: "iron",
    type: RecommendationType.FOOD,
    title: "赤身肉やレバーを取り入れる",
    description: "赤身肉やレバーは、鉄を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 1,
  },
  {
    nutrientId: "iron",
    type: RecommendationType.FOOD,
    title: "ほうれん草や大豆製品を取り入れる",
    description: "ほうれん草や大豆製品は、鉄を含む食品の一つです。食生活を振り返る際の選択肢として、無理のない範囲で取り入れてみましょう。",
    sortOrder: 2,
  },
  {
    nutrientId: "iron",
    type: RecommendationType.ACTION,
    title: "鉄を含む食品を意識して選ぶ",
    description: "鉄を含む食品を選ぶ機会があるか振り返ってみましょう。無理のない範囲で続けられる方法を探してみましょう。",
    sortOrder: 1,
  },
];




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
    // 同じ nutrientId・type・title のデータがある？
    // ├─ ある(update)
    // │   → description と sortOrder を更新
    // │
    // └─ ない(create)
    //      → 新しく作成
    // - nutrientId_type_title: {...} :
    // Schema で定義した複合ユニークキー(nutrientId・type・title)を使う
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

