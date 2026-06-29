// web/app/diagnosis/step/[step]/AnswerForm.tsx


// 全体の概要
// - ユーザーが入力した回答を 回答保存API(/api/diagnosis/answers)に送信し、
// APIから返ってきた nextHref に画面遷移するフォームコンポーネント


// 役割
// - useSupabaseSession で token を検証し、取得してAPIへ送る
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
// 回答値が 1〜3 の整数か確認
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
import { useState } from "react";
// フォームの値、エラー、送信中状態をまとめて管理するため
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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
// - HTML の inputは、type="number" でも値を文字列として扱うことが多いため、answer: string とする
// - 画面では "1" として受け取り、APIに送信する前に Number() で 1 に変換する
type AnswerFormValues = {
  answer: string;
};

// props を AnswerFormProps の型で必要な値を受け取る
export default function AnswerForm({
  diagnosisId,
  questionId,
  order,
  isLast,
}: AnswerFormProps) {
  const router = useRouter();

// token: API へ送る access_token
// isSessionLoading: Supabase での ログイン状態
  const { token, isLoading: isSessionLoading } = useSupabaseSession();

  const [errorMessage, setErrorMessage] = useState("");



  // フォーム管理に必要な道具を取り出す
  // - register: input と react-hook-form を繋ぐ
  // - handleSubmit: フォーム送信時の処理を安全に実行するため
  // - errors: 入力エラーを表示するために使う
  // - isSubmitting: 送信中かどうかを判断する
  const {
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting }, 
  } = useForm<AnswerFormValues>({
    defaultValues: {
      answer: "",
    },
  });

  // フォーム送信時に実行する処理
  const onSubmit = async (values: AnswerFormValues) => {
    try {
      // 送信開始時に前回エラーを消す
      setErrorMessage("");

      // 入力値を 数値(number) に変換する
      // - フォームから受け取った "1" を 1 に変換
      // - API側では value を数値として扱っているため
      const answerValue = Number(values.answer);

      // 入力値が有効な整数かチェック
      // - 不正な回答値のままAPIへ送らない
      if (
        !Number.isFinite(answerValue) ||
        !Number.isInteger(answerValue) ||
        answerValue < 1 ||
        answerValue > 3
      ) {
        setErrorMessage("回答は1~3の整数で入力してください");
        return;
      }

      // Supabase がログイン状態を確認中なら、回答を送らない
      if (isSessionLoading) {
        setErrorMessage(
          "ログイン情報を確認中です。少し待ってから再度お試しください"
        );
        return;
      }

      // ログイン確認後も、token が無い場合、未ログイン扱い
      // - 未ログインのままAPIへ送らない
      if (!token) {
        setErrorMessage("ログインが必要です");
        router.push("/login");
        return;
      }

      // APIに送るデータ
      const requestBody: SaveDiagnosisAnswersRequest = {
        diagnosisId,
        questionId,
        value: answerValue,
        order,
      };

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
      });

      // APIから返ってきたデータを成功時の型(SaveDiagnosisResponse)と失敗時の型(ApiErrorResponse)に分けて受け取る
      const data: SaveDiagnosisAnswersResponse | ApiErrorResponse = await res.json();

      // HTTP処理がエラーの場合の処理
      if (!res.ok) {
        const message = "message" in data && data.message ? data.message : "回答保存に失敗しました";

        setErrorMessage(message);
        return;
      }

      // API処理がエラーの場合の処理
      if (!data.success) {
        const message = "message" in data && data.message ? data.message : "回答保存に失敗しました";

        setErrorMessage(message);
        return;
      }

      // APIから返ってきた data に nextHref が入ってない・遷移先(data.nextHref)が無い場合の処理
      if (!("nextHref" in data) || !data.nextHref) {
        setErrorMessage("次の遷移先を取得できませんでした");
        return;
      }

      // APIから返ってきたURL(nextHref)に画面遷移する
      router.push(data.nextHref);
    } catch (error) {
      console.error("failed to save answer:", error);
      setErrorMessage("回答保存に失敗しました");
    }
  };

  return (
    // react-hook-form のhandleSubmit を通して、 onSubmit を実行する

    // 入力欄(<form>...</form>) の 表示する幅 を 制限する
    // - max-w-md: 最大幅 を 約448px に制限する
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-4 max-w-md space-y-3"
    >
      <Input
        id="answer"
        type="number"
        placeholder="1~3で入力"
        min={1}
        max={3}
        // input の値を answer という名前の入力欄で react-hook-form に管理させる
        // - 送信時に values.answer として受け取る
        // - {...register("answer", {...})} : register から返ってきた input 用の設定を、input にまとめて渡している
        {...register("answer", {
          // register(react-hook-form)側の required 使う
          required: "回答を入力してください",
          // 入力値が 1 未満の場合のエラー
          min: {
            value: 1,
            message: "回答は1以上で入力してください",
          },
          // 入力値が 3 より大きい場合のエラー
          max: {
            value: 3,
            message: "回答は3以下で入力してください",
          },
        })}
      />

      {/*
        - disabled={isSubmitting || isSessionLoading}
        → ボタンは、ログイン確認中・回答を保存中 は押せないようにしている。二重送信を防げる
        - 送信ボタン(<Button>...</Button>) を 新規登録・ログイン と 同じ幅 に制限する
        - w-full: 親の箱(このページでは<form>...</form>) 内で 横幅100% に設定する
        - フォーム送信ボタン なので type="submit" としている
      */}
      <Button
        type="submit"
        disabled={isSubmitting || isSessionLoading}
        className="w-full"
      >
        {isSessionLoading ? "ログイン確認中..." : isSubmitting ? "保存中..." : isLast ? "結果を見る" : "次へ"}
      </Button>

      {errors.answer?.message && (
        <p className="text-sm text-red-600">
          {errors.answer.message}
        </p>
      )}

      {errorMessage && (
        <p className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
