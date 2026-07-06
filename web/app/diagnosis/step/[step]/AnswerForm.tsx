// web/app/diagnosis/step/[step]/AnswerForm.tsx

// ユーザーが入力した回答を /api/diagnosis/answersに送信し、APIから返ってきた nextHref に画面遷移するフォームコンポーネント


// Supabase session から token を取得してAPIへ送る

// userId を送らず、diagnosisId / questionId / value / order を送る

// APIから返った nextHref を使って画面遷移する

// /api/diagnosis/answers/route.ts を呼ぶフォーム




// 流れ
// page.tsx
// ↓
// <AnswerForm />
// ↓
// fetch("/api/diagnosis/answers")
// ↓
// API側で保存
// ↓
// nextHref を受け取る
// ↓
// router.push(nextHref)






"use client";

import { supabase } from "@/lib/supabase/client";
import type { SaveDiagnosisAnswersResponse } from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

// AnswerForm が親コンポーネントから受け取る値の型を定義
type AnswerFormProps = {
  diagnosisId: string;
  questionId: string;
  order: number;
  isLast: boolean;
};

export default function AnswerForm({
  diagnosisId,
  questionId,
  order,
  isLast,
}: AnswerFormProps) {
  const router = useRouter();
  // 回答入力欄の値を管理
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // フォーム送信時に実行する関数
  // FormEvent<HTMLFormElement> でフォーム送信イベントであることをTypeScriptに伝える
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // フォーム送信時のブラウザ標準動作(リロード)を止める
    event.preventDefault();

    try {
      // 送信中状態にする
      setIsLoading(true);

      // 入力された文字列を数値に変換
      const answerValue = Number(answer);

      // 入力値が有効な整数かチェック
      // 不正だった場合、returnでユーザーに知らせる。
      // 不正な回答値のままAPIへ送らない
      if (!Number.isFinite(answerValue) || !Number.isInteger(answerValue)) {
        alert("回答は整数で入力してください");
        return;
      }

      // Supabaseから現在のログインsession を取得
      const result = await supabase.auth.getSession();
      const session = result.data.session;

      // session から access_token を取り出す
      const token = session?.access_token;

      // tokenが無い場合、未ログイン扱い。
      // return で未ログインのままAPIへ送らない
      if (!token) {
        alert("ログインが必要です");
        router.push("/login");
        return;
      }

      // 回答保存APIへリクエストを送る
      const res = await fetch("/api/diagnosis/answers", {
        method: "POST",
        // APIに送るheaders情報
        // Supabaseのtokenを入れ、JSON形式にする
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // APIへ送るデータをJSON文字列に変換
        body: JSON.stringify({
          diagnosisId,
          questionId,
          value: answerValue,
          order,
        }),
      });

      // APIから返ってきたJSONを読み取り、型を付ける
      const data: SaveDiagnosisAnswersResponse = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message ?? "回答保存に失敗しました");
        return;
      }

      if (!data.nextHref) {
        alert("次の遷移先を取得できませんでした");
        return;
      }

      // APIから返ってきたURLに画面遷移する
      // API方式ではAPI側で redirect() しないため、フロント側で遷移する
      router.push(data.nextHref);
    } catch (error) {
      console.error("failed to save answer:", error);
      alert("回答保存に失敗しました");
    } finally {
      // 送信中状態を解除
      setIsLoading(false);
    }
  };

  // 画面表示するHTMlを返す
  return (
    // 回答入力フォーム
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <input
        name="answer"
        value={answer}
        // ユーザーが入力するたびに、answer stateを更新。入力値を answer に保存するため
        onChange={(event) => setAnswer(event.target.value)}
        // 入力欄が空のときに表示される案内文
        placeholder="回答を入力"
        // 空欄では送信できないようにする
        required
        style={{ padding: 8, width: 320 }}
      />

      <button
        type="submit"
        // 保存中はボタンを押せないようにする。二重送信を防ぐ。
        disabled={isLoading}
        style={{ marginLeft: 8, padding: "8px 12px" }}
      >
        {/* ボタンの表示内容 */}
        {isLoading ? "保存中..." : isLast ? "結果" : "次へ"}
      </button>
    </form>
  );
}