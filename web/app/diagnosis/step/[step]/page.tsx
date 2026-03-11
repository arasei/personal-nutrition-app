// web/app/diagnosis/step/[step]/page.tsx
//診断ステップページコンポーネント
//URL→検証→DB→表示→次の導線

//URLで状態を表す
//1問分の枠組みを表示

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { saveAnswer } from "../StepAction";

//URLパラメータの型定義
//stepはURLパラメータの型定義
//searchParamsでdiagnosisIdを受け取る設計に変更
//diagnosisIdは任意、paramsは必須
type PageProps = {
  params: {step: string};
  searchParams: { diagnosisId?: string };
};

//診断ステップページコンポーネント
export default async function DiagnosisStepPage({ params, searchParams } : PageProps) {
  //Next.jsの仕様に合わせてsearchParamsをawaitで展開
  //URLパラメーターからstepとdiagnosisIdを取得
  const { step } = await params; 
  const { diagnosisId } = await searchParams;

  //diagnosisIdが無いと、回答保存ができないので初めにチェックを行う
  //diagnosisIdが存在しない場合はnotFoundを呼び出して404ページへ遷移
  if (!diagnosisId) {
    notFound();
  };

  //取得したstep(文字列)を数値に変換
  //step(文字列)が数字として不正な場合はnotFoundを呼び出して404ページへ遷移
  const stepNum = Number(step); 
  if (!Number.isFinite(stepNum) || stepNum < 1) notFound();

  //diagnosisIdから診断レコードがDBに存在するか確認
  //存在しない場合はnotFoundを呼び出して404ページへ遷移
  const diagnosis = await prisma.diagnosis.findUnique({
    where: {id: diagnosisId},
    select: {id: true },
  });
  if (!diagnosis) notFound();
  
  //全質問数をDBから取得
  //現在何問目/全何問目とstepが範囲内かを確認し、表示するため
  //全質問数が0件orURLパラメータのstepが全質問数を超えている場合はnotFoundを呼び出して404ページへ遷移
  const total = await prisma.diagnosisQuestion.count();
  if (total === 0 || stepNum > total) notFound();

  //Prisma Clientを使ってDBから現在の質問(stepNum)を1件取得
  //step=3の場合、order=3の質問を
  //質問が存在しない場合はnotFoundを呼び出して404ページへ遷移
  const question = await prisma.diagnosisQuestion.findFirst({
    where: { order: stepNum },
  });
  if (!question) notFound();

  //次の質問へのリンクを作成
  //次のリンクにも診断ID(diagnosisId)をクエリパラメータで渡す設計に変更
  //最後の質問の場合は結果ページへのリンクにする
  const isLast = stepNum === total;
  const nextHref = isLast ? `/diagnosis/result?diagnosisId=${diagnosisId}` : `/diagnosis/step/${stepNum + 1}?diagnosisId=${diagnosisId}`;

  //ページのUIを返す
  return (
    <main style={{ padding: "24px" }}>
      <h1>診断 Step {stepNum}</h1>
      <p>現在の質問番号: {stepNum}/{total}</p>
      <p>質問:{question.questionText}</p>

      {/* 回答保存の為のフォーム追加 */}
      {/* hidden:サーバーへ一緒に送る(データとして必要なため) */}
      {/* visible:ユーザーが入力・操作する部分 */}
      {/* Server ActionのsaveAnswerをformのactionに指定 */}
      {/*submit時に、saveAnswerにFormDataとして以下のform action= が送られる*/}
      <form action={saveAnswer} style={{marginTop: 16}}>
        <input type="hidden" name="diagnosisId" value={ diagnosisId }/>{/* name:診断セッション(どの診断の回答か)を識別するID */}{/*value:URLのsearchParamsからの取得値*/}
        <input type="hidden" name="questionId" value={ question.id }/>{/* name:どの質問に対する回答か(DBの質問レコードのID)*/}{/*value:DBからの取得値*/}
        <input type="hidden" name="order" value={ String(stepNum) }/>{/* name:今何問目か(次へ進むために+1する材料)*/}{/*value:URLのparamsからの取得値*/}

        {/*回答入力欄*/}
        <input
        name="answer"
        placeholder="回答を入力"
        required
        style={{ padding: 8, width: 320 }}/>

        {/*次の質問へ進むボタン*/}
        <button type="submit" style={{ marginLeft: 8, padding: "8px 12px" }}>
          { isLast ? "結果" : "次へ" }
        </button>
      </form>

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