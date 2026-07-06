// web/app/diagnosis/step/[step]/AnswerForm.tsx


// ユーザーが入力した回答を 回答保存API(/api/diagnosis/answers)に送信し、
// APIから返ってきた nextHref に画面遷移するフォームコンポーネント


// Supabase session から token を取得してAPIへ送る

// userId を送らず、diagnosisId / questionId / value / order を送る

// SaveDiagnosisAnswersRequest を使って request body に型を付ける

// APIから返った nextHref を使って画面遷移する

// /api/diagnosis/answers/route.ts を呼ぶフォーム




// 流れ

// AnswerForm.tsx
//   ↓
// ユーザーが回答を入力
//   ↓
// 回答値が 1〜3 の整数か確認
//   ↓
// Supabase から token を取得
//   ↓
// diagnosisId / questionId / value / order を作る
//   ↓
// POST /api/diagnosis/answers
//   ↓
// API側で token 確認
//   ↓
// user を取得
//   ↓
// diagnosisId + user.id で本人確認
//   ↓
// Diagnosis が COMPLETED 済みではないか確認
//   ↓
// currentStep と order を確認
//   ↓
// questionId と order を確認
//   ↓
// 最後の質問か判定
//   ↓

// 最後ではない場合
//   ├─ 回答保存
//   ├─ currentStep を次へ更新
//   └─ 次の質問URLを返す

// 最後の質問の場合
//   ├─ 回答保存
//   ├─ 全回答を取得
//   ├─ 栄養素スコア計算
//   ├─ DiagnosisNutrientScore 保存
//   ├─ Diagnosis を COMPLETED に更新
//   └─ 結果ページURLを返す

// AnswerForm.tsx
//   ↓
// APIから返ってきた nextHref に router.push で遷移






"use client";

import { supabase } from "@/lib/supabase/client";
import type {
  SaveDiagnosisAnswersRequest,
  SaveDiagnosisAnswersResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
// フォームの値、エラー、送信中状態をまとめて管理するため
import { useForm } from "react-hook-form";

// AnswerForm が親コンポーネントから受け取る値(props)の型を定義

// diagnosisId: どの診断に回答を保存するかを示すID
// questionId: どの質問に対する回答かを示すID
// order: 現在の質問番号
// isLast: 現在の質問が最後かどうか
type AnswerFormProps = {
  diagnosisId: string;
  questionId: string;
  order: number;
  isLast: boolean;
};

// フォームで扱う値の型を定義
// HTML の inputは、type="number" でも値を文字列として扱うことが多いため、answer: string とする
// 画面では "1" として受け取り、APIに送信する前に Number() で 1 に変換する
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
  const [errorMessage, setErrorMessage] = useState("");

  // フォーム管理に必要な道具を取り出す
  const {
    register, // input と react-hook-form を繋ぐ
    handleSubmit, // フォーム送信時の処理を安全に実行する
    formState: { errors, isSubmitting }, // errors: 入力エラーを表示するために使う。isSubmitting: 送信中かどうかを判断する。
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
      // フォームから受け取った "1" を 1 に変換
      // API側では value を数値として扱っているため
      const answerValue = Number(values.answer);

      // 入力値が有効な整数かチェック
      // 不正な回答値のままAPIへ送らない
      if (
        !Number.isFinite(answerValue) ||
        !Number.isInteger(answerValue) ||
        answerValue < 1 ||
        answerValue > 3
      ) {
        setErrorMessage("回答は1~3の整数で入力してください");
        return;
      }

      // Supabase から 現在のログインsession を取得
      const result = await supabase.auth.getSession();
      // session から access_token を取り出す
      const token = result.data.session?.access_token;

      // token が無い場合、未ログイン扱い
      // 未ログインのままAPIへ送らない
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
        // 回答を保存する
        method: "POST",
        // APIに送る headers情報
        // Supabase の token を送る
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

      // APIから返ってきたURLに画面遷移する
      router.push(data.nextHref);
    } catch (error) {
      console.error("failed to save answer:", error);
      setErrorMessage("回答保存に失敗しました");
    }
  };

  return (
    // react-hook-form のhandleSubmit を通して、 onSubmit を実行する
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ marginTop: 16}}>
      <input
        type="number"
        placeholder="1~3で入力"
        min={1}
        max={3}
        style={{ padding: 8, width: 320 }}
        // input の値を answer という名前の入力欄で react-hook-form に管理させる
        // 送信時に values.answer として受け取る
        // {...register("answer", {...})} : register から返ってきた input 用の設定を、input にまとめて渡している
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

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ marginLeft: 8, padding: "8px 12px" }}
      >
        {isSubmitting ? "保存中..." : isLast ? "結果" : "次へ"}
      </button>

      {errors.answer?.message && (
        <p style={{ color: "red", marginTop: 8 }}>{errors.answer.message}</p>
      )}

      {errorMessage && <p style={{ color: "red", marginTop: 8 }}>{errorMessage}</p>}
    </form>
  );
}
