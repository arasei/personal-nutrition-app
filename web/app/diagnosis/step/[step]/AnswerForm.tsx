// web/app/diagnosis/step/[step]/AnswerForm.tsx


// 全体の概要
// - ユーザーが選択した回答を 回答保存API(/api/diagnosis/answers)に送信し、
// APIから返ってきた nextHref(次の質問ページ or 結果ページ) へ画面遷移するフォームコンポーネント


// 役割
// - useSupabaseSession で token を 取得してAPIへ送り、token の検証と本人確認をAPI側で行う
// - userId を送らず、diagnosisId / questionId / value / order を送る
// - SaveDiagnosisAnswersRequest を使って request body に型を付ける
// - APIから返った nextHref を使って画面遷移する
// - `/api/diagnosis/answers/route.ts` を呼ぶためのフォーム




// - このファイル内の流れ

// /diagnosis/step/1?diagnosisId=xxx
//   ↓
// `web/app/diagnosis/step/[step]/page.tsx`
//   ↓
// AnswerForm.tsx
//   ↓
// 認証
// useSupabaseSession で token を取得し、ログイン確認
//   ↓
// ユーザーがフォームに回答を入力
//   ↓
// 回答値が answerOptions に含まれるか確認
//   ↓
// diagnosisId / questionId / value / order を作る。(API側で中身を作成するための箱)
//   ↓
// POST /api/diagnosis/answers
// `web/app/diagnosis/step/[step]/AnswerForm.tsx` が token を `web/app/api/diagnosis/answers/route.ts` へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/answers/route.ts`
//   ↓
// API側で 以下を検証
// - 本人確認
// - この診断は完了済みかどうか判定
// - 現在の答えるべき質問ステップ(currentStep) と URL の ステップ(order)が正しいか判定
// - 表示するべき質問内容(questionId) と URL の ステップ(order)が正しいか判定
// - 最後の質問(isLast)か判定
//   ↓
// 最後ではない場合
//   ├─ 回答保存
//   ├─ currentStep を次へ更新
//   └─ 次の質問URL(nextHref)を返す

// 最後の質問の場合
//   ├─ 回答保存
//   ├─ 全回答を取得
//   ├─ 栄養素スコア計算
//   ├─ DiagnosisNutrientScore 保存
//   ├─ Diagnosis を COMPLETED に更新
//   └─ 結果ページURLを返す
//   ↓
// AnswerForm.tsx に結果ページURL を返す
//   ↓
// `web/app/api/diagnosis/answers/route.ts` から返ってきた 次の質問URL(nextHref) に router.push で遷移





// - 全体の流れ

// `web/app/diagnosis/step/[step]/page.tsx` を開く
//   ↓
// /diagnosis/step/1?diagnosisId=xxx
//   ↓
// useParams で URL から step を取る
//   ↓
// useSearchParams で diagnosisId を取る
//   ↓
// Supabase session から token を取る
//   ↓
// `web/app/api/diagnosis/step/route.ts`
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
//   ↓
// 認証
// getAuthenticatedUser(request) で token を検証し、ログイン中ユーザーかどうかを確認し、取得
//   ↓
// ログイン中ユーザー情報を取得後、user.id を取得し、使用可能
//   ↓
// 認可
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
// `web/app/diagnosis/step/[step]/AnswerForm.tsx`
//   ↓
// AnswerForm.tsx で回答を入力(フォームに回答入力)
//   ↓
// POST /api/diagnosis/answers
//   ↓
// `web/app/api/diagnosis/answers/route.ts`
//   ↓
// /api/diagnosis/answers 内で回答保存成功
//   ↓
// AnswerForm.tsx に結果ページURL を返す
//   ↓
// `web/app/api/diagnosis/answers/route.ts` から返ってきた nextHref に router.push で遷移
// 次の質問ページ(`web/app/diagnosis/step/[step]/page.tsx`) 
// or
// 結果ページ(`web/app/diagnosis/[diagnosisId]/result/page.tsx`)




"use client";

import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import type {
  SaveDiagnosisAnswersRequest,
  SaveDiagnosisAnswersResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
// フォームの値、エラー、送信中状態をまとめて管理するため
import { useForm } from "react-hook-form";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { Label } from "@/components/ui/Label";

// AnswerForm が親コンポーネントから受け取る値(props)の型を定義
// - diagnosisId: どの診断に回答を保存するかを示すID
// - questionId: どの質問に対する回答かを示すID
// - order: 現在の質問番号
// - isLast: 現在の質問が最後かどうか
type AnswerFormProps = {
  diagnosisId: string;
  questionId: string;
  order: number;
  isLast: boolean;
};

// フォームで扱う値の型を定義
// - select から受け取った値を setValueAs で文字列から数値に変換する
// - 画面では "1" として受け取り、APIに送信する前に Number() で 1 に変換する
// - 未選択の場合、undefined になるため、answer は optional にする
type AnswerFormValues = {
  answer?: number;
};

// 選択肢の配列を定義
// - value
// → APIへ送る数値
// - label
// → 画面に見せる文章
const answerOptions = [
  { value: 1, label: "1：あまり当てはまらない" },
  { value: 2, label: "2：どちらとも言えない" },
  { value: 3, label: "3：当てはまる" },
] as const;

const ANSWER_REQUIRED_MESSAGE = "回答は必須です";


type AnswerFormContentProps = AnswerFormProps & {
  token: string | null;
  isSessionLoading: boolean;
};


// 認証状態 と 回答対象を受け取る外側のコンポーネント
export default function AnswerForm(props: AnswerFormProps) {

  // token: API へ送る access_token
  // isLoading: isSessionLoading: Supabase で 認証状態を確認中かどうか
  const {token, isLoading: isSessionLoading,} = useSupabaseSession();

  // 認証状態・回答対象が変わったら、フォームを作り直す。
  // - token を含むため、画面やログには出力しない
  const formKey = JSON.stringify([
    isSessionLoading,
    token,
    props.diagnosisId,
    props.questionId,
    props.order,
  ]);

  return (
    <AnswerFormContent
      key={formKey}
      {...props}
      token={token}
      isSessionLoading={isSessionLoading}
    />
  );
}



// 入力・送信・エラー表示を管理する内側のコンポーネント
// - props を AnswerFormContentProps の型で必要な値を受け取る
function AnswerFormContent({
  diagnosisId,
  questionId,
  order,
  isLast,
  token,
  isSessionLoading,
}: AnswerFormContentProps) {
  const router = useRouter();

  const [errorMessage, setErrorMessage] = useState("");

  // API通信開始から遷移までの間、再送信を防ぐための状態管理
  // - API通信 と 通信成功後の遷移完了するまで操作を無効にするため
  const [isSaving, setIsSaving] = useState(false);

  const isMountedRef = useRef(false);
  // 現在の通信を管理する AbortController を保持する
  // - 値の変更による再描画は不要なので、useRef を使う
  const activeControllerRef = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      const controller = activeControllerRef.current;
      activeControllerRef.current = null;
      controller?.abort();
    };
  }, []);



  // フォーム管理に必要な道具を取り出す
  // - register: select と react-hook-form を繋ぐ
  // - handleSubmit: フォーム送信時の処理を安全に実行するため
  // - errors: 入力エラーを表示するために使う
  // - isSubmitting: 入力検証・送信処理 を含む フォーム側の状態を判断するため
  const {
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
  } = useForm<AnswerFormValues>({
    defaultValues: {
      answer: undefined,
    },
  });

  // フォーム送信時に実行する処理
  const onSubmit = async (values: AnswerFormValues) => {



    // 画面離脱後・既に通信中なら送信しない。
    if (!isMountedRef.current || activeControllerRef.current !== null) {
      return;
    }

    // 送信開始前に前回エラーメッセージを消す
    setErrorMessage("");

    // 入力値を react-hook-form の setValueAs で数値(number) に変換した入力値を取り出す
    // - API側では value を数値として扱っているため answerValue も number型 で扱う
    const answerValue = values.answer;

    if (
      typeof answerValue !== "number" || !answerOptions.some((option) => option.value === answerValue)
    ) {
      setErrorMessage(ANSWER_REQUIRED_MESSAGE);
      return;
    }

    // Supabase がログイン状態を確認中なら、回答を送らない
    if (isSessionLoading) {
      setErrorMessage("読み込み中です。少し待ってから再度お試しください",);
      return;
    }

    // ログイン確認後も、token が無い場合、未ログイン扱い
    // - 未ログインのままAPIへ送らない
    if (!token) {
      setErrorMessage("ログインが必要です");
      router.push("/login");
      return;
    }

    // API に送るデータ
    const requestBody: SaveDiagnosisAnswersRequest = {
      diagnosisId,
      questionId,
      value: answerValue,
      order,
    };

    const controller = new AbortController();
    activeControllerRef.current = controller;

    const isCurrentRequest = () => isMountedRef.current && activeControllerRef.current === controller && !controller.signal.aborted;

    setIsSaving(true);

    let navigationStarted = false;



    try {
      // 回答保存APIを呼び出し、リクエストを送る
      const res = await fetch("/api/diagnosis/answers", {
        // 回答を保存するメソッド
        method: "POST",
        // APIに送る headers情報
        // - Supabase の token を送る
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // APIへ送るデータをJSON形式にする
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // APIから返ってきたデータを成功・失敗のレスポンス を共通の型で扱う
      // - 成功時の型(SaveDiagnosisAnswersResponse) と 失敗時の型(ApiErrorResponse) に分けて受け取る
      const data: SaveDiagnosisAnswersResponse | ApiErrorResponse = await res.json();


      // 認証・回答対象の変更や画面離脱後の結果は採用しない
      if (!isCurrentRequest()) {
        return;
      }

      // API処理がエラーの場合の処理
      if (!data.success) {
        const errorData:ApiErrorResponse = data;
        setErrorMessage(
          errorData.message ?? "回答保存に失敗しました",
        );
        return;
      }

      // HTTP処理がエラーの場合の処理
      if (!res.ok) {
        setErrorMessage("回答保存に失敗しました");
        return;
      }

      // APIから返ってきた data に nextHref が入ってない・遷移先(data.nextHref)が無い場合の処理
      if (!("nextHref" in data) || !data.nextHref) {
        setErrorMessage("次の遷移先を取得できませんでした");
        return;
      }

      // APIから返ってきたURL(nextHref)に画面遷移する
      router.push(data.nextHref);
      navigationStarted = true;
    } catch {
      // 古い通信の失敗や、意図した通信中止は表示しない
      if (!isCurrentRequest()) {
        return;
      }

      console.error("回答保存の通信処理に失敗しました");
      setErrorMessage("回答保存に失敗しました");
    } finally {
      // 有効な処理で、まだ遷移を開始していない場合だけ解除する
      if (isCurrentRequest() && !navigationStarted) {
        activeControllerRef.current = null;
        setIsSaving(false);
      }
    }
  };

  // ボタンの無効化する条件
  const isBusy = isSessionLoading || isSubmitting || isSaving;

  return (
    // react-hook-form のhandleSubmit を通して、 onSubmit を実行する
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-5 space-y-4"
    >
      {/*
        Label と select を関連付け
        - htmlFor と id を 同じ値にすることで、「回答」という名前と選択欄を関連付ける
      */}
      <div>
        <Label htmlFor="answer">
          回答
        </Label>

        <select
          id="answer"
          disabled={isBusy}
          defaultValue=""
          aria-invalid={Boolean(errors.answer)}
          aria-describedby={errors.answer ? "answer-error" : undefined}
          className={`
            min-h-10
            w-full
            rounded-md
            border border-border
            bg-surface
            px-3 py-2
            text-sm text-foreground
            transition-colors
            focus-visible:border-primary
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-primary/20
            focus-visible:ring-offset-1
            aria-invalid:border-error
          `}
          // select の値を answer という名前の入力欄で react-hook-form に管理させる
          // - 送信時に values.answer として受け取る
          // - {...register("answer", {...})} : register から返ってきた select 用の設定を、select にまとめて渡している
          {...register("answer", {
            // register(react-hook-form)側の required 使う
            // - 何も選択されていない場合に「回答は必須です」を表示する
            required: ANSWER_REQUIRED_MESSAGE,
            // 未選択の空文字を undefined へ変換し、選択された値は数値へ変換する。
            setValueAs: (value) => {
              return value === "" ? undefined : Number(value);
            },
            // 選択された値が、正しい選択肢に含まれているか確認する
            validate: (value) => {
              return answerOptions.some((option) => option.value === value) ? true : ANSWER_REQUIRED_MESSAGE;
            },
          })}
        >
          {/*
            初期状態の操作案内
            - 回答選択欄の初期表示
          */}
          <option value="" disabled>
            回答を選択してください
          </option>

          {answerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* 回答が選択されていない場合のエラー表示 */}
        {/*
          id="answer-error"
          - 入力欄の aria-describedby="answer-error" とメッセージを関連付けるため必要
          - 入力エラーがどの選択肢に対するものか伝えられるようにするため
        */}
        {errors.answer?.message && (
          <ErrorMessage
            id="answer-error"
            className="mt-2"
          >
            {errors.answer.message}
          </ErrorMessage>
        )}
      </div>

      {/*
        disabled={isBusy}
        - ボタンは、ログイン(認証状態)確認中・入力検証・送信処理中・保存成功後の画面切り替え待ち は押せないようにしている。二重送信を防げるため
        - 送信ボタン(<Button>...</Button>) を 親要素いっぱいの幅 に制限する
        - w-full: 親の箱(このページでは<form>...</form>) 内で 横幅100% に設定する
        - フォーム送信ボタン なので type="submit" としている
      */}
      <Button
        type="submit"
        disabled={isBusy}
        className="w-full"
      >
        {isSessionLoading ? "ログイン確認中..." : isSubmitting || isSaving ? "保存中..." : isLast ? "結果を見る" : "次へ"}
      </Button>


      {/* API通信 や 回答保存処理 で発生したエラー表示 */}
      {errorMessage && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}
    </form>
  );
}
