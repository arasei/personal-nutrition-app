// web/app/diagnosis/step/[step]/page.tsx

// 診断ステップページコンポーネント
// 診断の各ステップを表示するページ
// [step]は動的ルートで、URLの/diagnosis/step/1 や /diagnosis/step/2 の数字部分を受け取るページ



// URLで状態を表す
// 現在のステップ番号や診断IDをURLで管理する。

// 例.
// /diagnosis/step/2?diagnosisId=abc
// なら、

// step = 2
// diagnosisId = abc
// という状態がURLから分かる。




// 1問分の枠組みを表示
// 1問ずつ質問を表示する役割





// 流れ
// URLから step / diagnosisId を取得
// ↓
// 不正な値なら notFound()
// ↓
// DBから診断と質問を取得
// ↓
// 質問を表示
// ↓
// AnswerForm で回答保存へ進む



// 回答保存の流れ
// page.tsxで回答入力処理
// ↓
// AnswerForm.tsxで回答保存処理
// ↓
// /api/diagnosis/answers







import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AnswerForm from "./AnswerForm";

// URLパラメータの型定義
// step と diagnosisId は最初に必要だからPromiseにしてawait(後で取り出せる箱)にする
// stepはURLパラメータの型
// searchParamsでdiagnosisIdを受け取ることでawaitを可能にする
// diagnosisIdは任意、paramsは必須
type PageProps = {
  params: Promise<{step: string}>;
  searchParams: Promise<{ diagnosisId?: string }>;
};

// 診断ステップページコンポーネント
export default async function DiagnosisStepPage({ params, searchParams } : PageProps) {
  //URLパラメーターからstepとdiagnosisIdを取得
  const { step } = await params; 
  const { diagnosisId } = await searchParams;

  // diagnosisIdが存在するかチェック
  // 回答保存には必ず、どの診断に対する回答かを示すdiagnosisId が必要
  // diagnosisIdが存在しない場合はnotFoundを呼び出して404ページへ遷移
  if (!diagnosisId) {
    notFound();
  };

  // 取得したstep(文字列)を数値に変換
  // step(文字列)が数字として不正な場合はnotFoundを呼び出して404ページへ遷移
  const stepNum = Number(step); 
  if (!Number.isFinite(stepNum) || stepNum < 1) notFound();

  // diagnosisIdから診断レコードがDBに存在するか確認
  // 存在しない場合はnotFoundを呼び出して404ページへ遷移
  const diagnosis = await prisma.diagnosis.findUnique({
    where: {id: diagnosisId},
    select: {id: true },
  });
  if (!diagnosis) notFound();
  
  // 全質問数をDBから取得
  // 全質問数が0件orURLパラメータのstepが全質問数を超えている場合はnotFoundを呼び出して404ページへ遷移
  const total = await prisma.diagnosisQuestion.count();
  if (total === 0 || stepNum > total) notFound();

  // DBから現在の質問(stepNum)を1件取得
  // 質問が存在しない場合はnotFoundを呼び出して404ページへ遷移
  const question = await prisma.diagnosisQuestion.findFirst({
    where: { order: stepNum },
  });
  if (!question) notFound();

  // 現在の質問が最後の質問かどうかを判定
  const isLast = stepNum === total;

  //ページのUIを返す
  return (
    <main style={{ padding: "24px" }}>
      <h1>診断 Step {stepNum}</h1>
      <p>現在の質問番号: {stepNum}/{total}</p>
      <p>質問:{question.questionText}</p>

      {/* 回答保存の為のフォーム追加 */}
      {/* 回答保存は AnswerForm.tsx 側で行う */}
      <AnswerForm
        diagnosisId={diagnosisId}
        questionId={question.id}
        order={stepNum}
        isLast={isLast}
      />

      {/* 戻るリンク */}
      {/* stepが2以上の場合表示 */}
      {/*現状は、動く導線を作成したいのでLinkで表示後ほどボタン化*/}
      {stepNum > 1 && (
        <div style={{ marginTop: 16 }}>
          <Link href={`/diagnosis/step/${ stepNum - 1 }?diagnosisId=${ diagnosisId }`}>戻る</Link>
        </div>
      )}
    </main>
  );
}