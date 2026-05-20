// web/app/diagnosis/step/[step]/AnswerForm.tsx


// ユーザーが入力した回答を 回答保存API(/api/diagnosis/answers)に送信し、APIから返ってきた nextHref に画面遷移するフォームコンポーネント


// Supabase session から token を取得してAPIへ送る

// userId を送らず、diagnosisId / questionId / value / order を送る

// SaveDiagnosisAnswersRequest を使って request body に型を付ける

// APIから返った nextHref を使って画面遷移する

// /api/diagnosis/answers/route.ts を呼ぶフォーム


// web/app/diagnosis/step/[step]/AnswerForm.tsx 内の流れ

// 回答を入力
// ↓
// 数値チェック
// ↓
// Supabase token を取得
// ↓
// SaveDiagnosisAnswersRequest 型の body を作る
// ↓
// POST /api/diagnosis/answers
// ↓
// nextHref へ遷移



// 流れ

// /diagnosis/step/1?diagnosisId=xxx
//   ↓
// page.tsx が開く
//   ↓
// useParams で step を取る
//   ↓
// useSearchParams で diagnosisId を取る
//   ↓
// Supabase から token を取る
//   ↓
// GET /api/diagnosis/step
//   ↓
// API側で本人確認
//   ↓
// 質問データを返す
//   ↓
// 画面に質問を表示
//   ↓
// AnswerForm で回答を入力
//   ↓
// POST /api/diagnosis/answers
//   ↓
// 保存成功
//   ↓
// nextHref へ移動






"use client";

import { supabase } from "@/lib/supabase/client";
import type {
  SaveDiagnosisAnswersRequest,
  SaveDiagnosisAnswersResponse,
} from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
// フォーム送信イベントの型
import type { FormEvent } from "react";

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

// props を AnswerFormProps の型で必要な値を受け取る
export default function AnswerForm({
  diagnosisId,
  questionId,
  order,
  isLast,
}: AnswerFormProps) {
  const router = useRouter();
  // 回答入力欄の値を保存する場所
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
      // session から access_token を取り出す
      const token = result.data.session?.access_token;

      // tokenが無い場合、未ログイン扱い。
      // return で未ログインのままAPIへ送らない
      if (!token) {
        alert("ログインが必要です");
        router.push("/login");
        return;
      }

      // APIに送るデータ(body)を SaveDiagnosisAnswersRequest型として送るために定義
      // 送信データのエラーを防ぐため型を揃える

      // diagnosisId: どの診断か
      // questionId: どの質問か
      // value: 回答値
      // order: 何問目か
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
        // APIに送るheaders情報
        // Supabaseのtokenを入れ、JSON形式にする
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // APIへ送るデータをJSON文字列に変換
        body: JSON.stringify(requestBody),
      });

      // APIから返ってきたデータをJSON形式で、SaveDiagnosisAnswerResponse型で受け取る
      const data: SaveDiagnosisAnswersResponse = await res.json();

      // HTTPとして失敗、またはAPI処理として失敗した場合のエラー
      if (!res.ok || !data.success) {
        alert(data.message ?? "回答保存に失敗しました");
        return;
      }

      // 次の遷移先が返ってきていない場合のエラー
      if (!data.nextHref) {
        alert("次の遷移先を取得できませんでした");
        return;
      }

      // APIから返ってきたURLに画面遷移する
      // API方式ではAPI側で redirect() しないため、フロント側で遷移する
      router.push(data.nextHref);
    } catch (error) {
      // 開発者向けエラー表示
      console.error("failed to save answer:", error);
      // ユーザー向けエラー表示
      alert("回答保存に失敗しました");
    } finally {
      // 送信中状態を解除
      setIsLoading(false);
    }
  };

  // 画面表示するHTMLを返す
  return (
    // 回答入力フォーム
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      {/* 数値入力欄 */}
      <input
        type="number"
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