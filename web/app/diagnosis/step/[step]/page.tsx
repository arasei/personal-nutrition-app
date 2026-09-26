// web/app/diagnosis/step/[step]/page.tsx

// 全体の概要
// - 診断の各ステップごとに表示するページ
// [step]は動的ルートで、URLの/diagnosis/step/1 や /diagnosis/step/2 の数字部分を受け取るページ
// - URL から step(質問番号) と diagnosisId(診断ID) を取得する。
// - ログイン中ユーザーの token を使って診断ステップ取得APIを呼び、現在の質問を取得する。
// - 質問文 と 進捗 を表示し、回答保存を AnswerForm で行う




// 役割
// - 1問分の枠組みを表示
// - 1問ずつ質問を表示する役割




// ポイント

// URLで状態を表す
// - 現在のステップ番号や診断IDをURLで管理する。

// 例.
// /diagnosis/step/2?diagnosisId=abc
// なら、
// step = 2
// diagnosisId = abc
// という状態がURLから分かる。





// 古くなった取得結果への対策
// - 診断ID・質問番号・token をrequestKey に含める
// - 現在の requestKey と一致する取得結果だけを表示する
// - 依存値([diagnosisId, requestedStep, token, isSessionLoading, requestKey,]) の変更(データ取得条件の変更) や 画面離脱 が行われた場合、
// 古い取得処理・通信を無効にする
// - 未ログイン時は 質問・回答フォームを表示しない





// 注意点
// - このページは SWR ではなく、useEffect と useState で取得を管理する
// - 質問番号 や 所有者 の最終確認は、引き続きAPI側で行う。
// - token や requestKey を画面・ログへ出力しない。
// - 回答保存後 の古い画面遷移への対策は、AnswerForm側で別途行う。






// - このファイル内の流れ

// `web/app/diagnosis/start/StartButton.tsx`
// ↓
// diagnosisId を使い、`/diagnosis/step/1?diagnosisId=...` に遷移する
// ↓
// `web/app/diagnosis/step/[step]/page.tsx` を開く
// ↓
// useParams で URLから step
// ↓
// useSearchParams で diagnosisId を取得
// ↓
// 認証
// useSupabaseSession で token を取得し、ログイン確認
// ↓
// GET /api/diagnosis/step
// `web/app/diagnosis/step/[step]/page.tsx` が token を `web/app/api/diagnosis/step/route.ts` へ リクエストを送る
// ↓
// `web/app/api/diagnosis/step/route.ts`
// ↓
// API側 で 本人確認・step確認・質問数(total)取得・order = step の番号に合う質問取得し、整形し、
// フロントに質問データを返す
// ↓
// `web/app/diagnosis/step/[step]/page.tsx`
// ↓
// 返ってきた質問データを使い、画面に質問を表示する
// ↓
// AnswerForm に必要な値を渡す




// - 全体の流れ

// `web/app/diagnosis/step/[step]/page.tsx` を開く
//   ↓
// /diagnosis/step/1?diagnosisId=xxx
//   ↓
// useParams で URL から step を取る
//   ↓
// useSearchParams で diagnosisId を取る
//   ↓
// 認証
// useSupabaseSession で token を取得し、ログイン確認
//   ↓
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
// `web/app/diagnosis/step/[step]/page.tsx` が token を `web/app/api/diagnosis/step/route.ts` へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/step/route.ts`
//   ↓
// getAuthenticatedUser(request) で token を検証し、ログイン中ユーザーかどうかを確認し、取得
//   ↓
// ログイン中ユーザー情報を取得後、user.id を取得し、使用可能
//   ↓
// Prismaで diagnosisId + user.id で本人の診断かどうかを確認
//   ↓
// currentStep と URL の step が一致するか比較し、確認
//   ↓
// 質問数 total を取得
//   ↓
// DiagnosisQuestion から order = step の番号に合う質問を取得
//   ↓
// page.tsx に以下を返す(質問データ)
// {
//   success: true,
//   question,
//   total,
//   isLast
// }
//   ↓
// page.tsx が画面に質問を表示
//   ↓
// AnswerForm.tsx で回答を入力
//   ↓
// POST /api/diagnosis/answers
//   ↓
// /api/diagnosis/answers に回答保存成功
//   ↓
// nextHref へ移動
// 次の質問ページ(web/app/diagnosis/step/[step]/page.tsx) 
// or
// 結果ページ(web/app/diagnosis/[diagnosisId]/result/page.tsx)






"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import AnswerForm from "./AnswerForm";
import type {
  DiagnosisStepResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { PageLoading } from "@/components/ui/PageLoading";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";



// APIから取得する 質問データの型 を定義
// - 成功時に取得し、使用するデータの型
type StepSuccessResponse = Extract<DiagnosisStepResponse,{ success: true }>;



// 指定した条件に対応する質問データだけを表示するための 型を定義
// - API から取得した質問データ と 取得条件を表すキー の組み合わせ
type StepState = {
  key: string;
  data: StepSuccessResponse | null;
  errorMessage: string;
};







// 診断ステップページコンポーネント
export default function DiagnosisStepPage() {
  // 画面遷移用の router
  const router = useRouter();
  // useParams() で [step] の step を取得(URL の動的ルート取得)
  const params = useParams<{ step: string }>();
  // useSearchParams() で ?diagnosisId=xxx の diagnosisId を取得
  const searchParams = useSearchParams();
  // URL の [step] から取得した値を step に入れる
  const step = params.step; 
  // URL から diagnosisId を取得
  const diagnosisId = searchParams.get("diagnosisId");

  const { token, isLoading: isSessionLoading } = useSupabaseSession();


  // URL の質問番号を数値に変換する
  const requestedStep = Number(step);

  // 不正なURL の場合は、API取得を開始せずエラーを表示する
  let validationError = "";

  if (!diagnosisId) {
    validationError = "診断IDが見つかりません";
  } else if (
    !Number.isFinite(requestedStep) || !Number.isInteger(requestedStep) || requestedStep < 1
  ) {
    validationError = "不正なステップ番号です";
  }

  // 質問データ の取得条件を定義
  // - 同じ診断IDでも token が変われば別の取得として扱う
  // - token や 診断ID や 質問番号(requestedStep) が変わった時点で、それ以前の結果は表示対象から外れる
  // 成功データだけでなく以前のエラーメッセージも引き継がないし、表示対象から外れる
  // - 質問番号(requestedStep) が変わった場合も、別の取得条件として扱う
  const requestKey = token && diagnosisId && !validationError ? JSON.stringify([diagnosisId, requestedStep, token]) : null;


  const [resultState, setResultState] = useState<StepState | null>(null);

  // 指定した現在の取得条件(requestKey)と一致する結果だけ表示対象とする
  // - 過去の条件で取得したデータ・エラーは使用しない

  // resultState.key
  // - 現在、保存されている取得結果に対して指定した取得条件 のキー
  // - 現在の requestKey と一致する場合だけ取得した質問データを表示対象にする
  const currentResult = requestKey && resultState?.key === requestKey ? resultState : null;

  const data = currentResult?.data ?? null;

  // URL の不正を優先し、次に現在の取得条件のエラー表示する
  const errorMessage = validationError || currentResult?.errorMessage || "";

  // 読み込み中表示
  // - 取得条件は揃っているが、現在の条件に対応する成功・失敗の結果がまだない場合の表示。
  const isLoading = requestKey !== null && currentResult === null;




  // 現在の質問を表示する
  // - diagnosisId・requestedStep・token・isSessionLoading・requestKey が変わった時、
  // API取得を実行し、現在の質問データを取得し、表示する
  useEffect(() => {
    // 以下の場合、API を呼ばず処理中止。質問を表示しない。
    // - Supabase がログイン状態を確認中(isSessionLoading)
    // - token がないため未ログイン(!token)
    // - 診断ID が存在しない、確認できない(!diagnosisId)
    // - 指定した取得条件にあてはまらず、requestKey が作られていない(!requestKey)
    if (isSessionLoading || !token || !diagnosisId || !requestKey) {
      return;
    }

    // 不要な通信の中止を管理するオブジェクトを作る処理
    const controller = new AbortController();

    // この useEffect 内で開始した取得処理が、現在も有効かの状態 を管理する
    // - 古い処理による state更新を止めるため
    // - 最初は 有効状態(true)
    let isActive = true;

    const fetchStep = async () => {
      try {
        // token付きで 質問取得API(web/app/api/diagnosis/step/route.ts) を呼ぶ
        // - フロント側(web/app/diagnosis/step/[step]/page.tsx) が
        // GET /api/diagnosis/step?diagnosisId=${encodeURIComponent(diagnosisId)}&step=${requestedStep} で Authorization ヘッダー に Bearer token 付きで、
        // API側(web/app/api/diagnosis/step/route.ts) に送り、呼び出す。
        // - API側で Authorizationヘッダーからtokenを検証し取得した diagnosisId + userId で本人の診断だけ確認し、取得する為の構成
        // そして、フロントに 現在の質問データだけを返す
        const response = await fetch(`/api/diagnosis/step?diagnosisId=${encodeURIComponent(diagnosisId)}&step=${requestedStep}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        // APIから返ってきたJSONを読み取る
        const responseData: DiagnosisStepResponse = await response.json();

        // 質問データ取得が不要の状態の場合(認証変更・診断ID変更・画面離脱)は、結果を採用しない。
        // - 古い認証状態・診断・質問に対する結果は採用しない。
        if (!isActive) {
          return;
        }


        // API処理がエラーの場合の処理
        // - success: false を確認すると、エラーレスポンス型に絞り込まれる。
        // - JSON全体の形式を検証する仕組みではない。
        // response.json() に型を付けるだけで、すべての項目が実行時に保証されるわけではない
        if (!responseData.success) {
          const errorData: ApiErrorResponse = responseData;

          throw new Error(
            errorData.message ?? "質問の取得に失敗しました",
          );
        }

        // HTTP処理がエラーの場合の処理
        if (!response.ok) {
          throw new Error("質問の取得に失敗しました")
        }



        // API処理(responseData.success) と HTTP処理 の成功を確認済みなので setResultState の data: には成功データ(responseData)だけ入る
        // - 取得成功した 質問データ を 指定した取得条件(requestKey) と一緒に保存する
        setResultState({
          key: requestKey,
          data: responseData,
          errorMessage: "",
        });
      } catch (error) {
        // 認証変更・診断ID変更・画面離脱 により 質問データ取得 が不要になった場合の、
        // 通信中止についてのエラーは 画面に表示しない。
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setResultState({
          key: requestKey,
          data: null,
          errorMessage: error instanceof Error ? error.message : "質問取得に失敗しました",
        });
      }
    };

    void fetchStep();


    // 条件変更による再実行前 または 画面離脱時 に古い取得を無効にする
    // - 以下の return () => {...} は、依存値の変更による再実行前、または画面離脱時に実行する
    // - 質問データ取得 の通信が不要になるため中止する
    // 通信の成功・失敗だけを理由に実行する処理ではない
    // - 依存値(データ取得が完了 or 取得失敗 or 取得中にページ遷移 or 取得中にページを閉じた)変更による質問データ取得再実行前、アンマウント時に古いデータ取得・通信処理 無効処理
    // - 古い処理による state 更新を防ぎ、通信中なら中止する
    // - 通信の成功・失敗だけを理由に実行される処理ではない
    return () => {

      // 古い処理が、画面の state を更新しないようにする
      isActive = false;

      // まだ通信中なら不要になるため通信を中止する
      controller.abort();

    };
  }, [diagnosisId, requestedStep, token, isSessionLoading, requestKey,]);


  // 認証確認完了後、未ログインの場合の処理
  // - 未ログインの場合の遷移は、質問データ取得とは分けて行う
  useEffect(() => {
    // 認証確認後、未ログインならログインページへ遷移する
    if (!isSessionLoading && !token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);


  // ログイン状態確認中 or 未ログイン or 質問データ取得中 の場合の表示

  // isSessionLoading
  // - Supabase認証確認中
  if (isSessionLoading) {
    return <PageLoading />;
  }

  // !token
  // - 未ログイン
  // - ページ遷移完了するまでの間、質問 と 回答フォーム を表示しない
  if (!token) {
    return <PageLoading message="ログインページへ移動しています..." />
  }

  // isLoading
  // - 質問取得API による質問データ取得中
  if (isLoading) {
    return <PageLoading />;
  }

  // API取得エラー・診断ID不足・データなし の場合のエラーメッセージ表示
  if (errorMessage || !data || !diagnosisId) {
    return (
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <ErrorMessage>
          {errorMessage || "質問を表示できませんでした"}
        </ErrorMessage>

        <nav aria-label="診断エラー時の移動">
          <LinkButton href="/mypage" variant="text">
            マイページへ戻る
          </LinkButton>
        </nav>
      </main>
    );
  }



  // 表示と回答保存には、APIから取得した質問の順番(data.question.order) を 現在のステップ番号 として使用する
  // - 画面表示・回答フォームへ渡す質問番号
  // - DB側 の正しい順番で表示するため
  const stepNum = data.question.order;


  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-muted">
          栄養診断
        </p>

        {/* ページタイトル */}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          あなたの生活習慣について
        </h1>

        {/* 現在の質問番号と全質問数 */}
        <p className="mt-2 text-sm font-medium text-primary">
          質問 {stepNum} / {data.total}
        </p>
      </header>

      <section
        className="mt-8"
        aria-labelledby="question-heading"
      >
        <Card>
          {/* 質問文 */}
          <h2
            id="question-heading"
            className="text-lg font-semibold leading-7 text-foreground"
          >
            {data.question.questionText}
          </h2>
          {/* 回答フォーム */}
          {/*
            - 回答の入力・保存は AnswerForm.tsx 側で行う。
            - 診断 や 質問が変わった場合は、フォームの状態も作り直す。
          */}


          <AnswerForm
            // どの診断IDの質問データ かを指定
            key={`${diagnosisId}:${data.question.id}`}
            // どの診断ID かを指定
            diagnosisId={diagnosisId}
            // どの質問への回答 かを指定
            questionId={data.question.id}
            // どの質問番号(ステップ) かを指定
            order={stepNum}
            // 最後の質問かどうか を指定
            isLast={data.isLast ?? false}
          />
        </Card>
      </section>
    </main>
  );
}
