// web/app/diagnosis/step/[step]/page.tsx

// URL から step と diagnosisId を取得し、ログイン中ユーザーの token を使って診断ステップ取得APIを呼び、現在の質問を取得して表示するページ
// 診断の各ステップごとに表示するページ
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




// web/app/diagnosis/step/[step]/page.tsx 内の流れ

// URLから step / diagnosisId を取得
// ↓
// Supabase session から token を取得
// ↓
// GET /api/diagnosis/step を呼ぶ
// ↓
// 質問データを受け取る
// ↓
// 画面に表示する
// ↓
// AnswerForm に必要な値を渡す




// 流れ

// /diagnosis/step/1?diagnosisId=xxx
//   ↓
// page.tsx が開く
//   ↓
// useParams で URL から step を取る
//   ↓
// useSearchParams で diagnosisId を取る
//   ↓
// Supabase session から token を取る
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

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AnswerForm from "./AnswerForm";
import type { DiagnosisStepResponse } from "@/types/diagnosisApi";




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

  // API から取得した質問データを保存する場所
  const [data, setData] = useState<DiagnosisStepResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // useEffect() で diagnosisId・step・router が変わった時、API取得を行う
  useEffect(() => {
    const fetchStep = async () => {
      // API取得処理
      // エラーが起きる可能性のある処理を try/catch で行う
      try {
        setIsLoading(true);
        setErrorMessage("");

        // diagnosisIdが存在するかチェック
        // 回答保存には必ず、どの診断に対する回答かを示すdiagnosisId が必要
        if (!diagnosisId) {
          setErrorMessage("診断IDが見つかりません");
          return;
        }

        // URL から取得したstep(文字列)を数値に変換
        const stepNum = Number(step);

        // stepNum が正しいステップ番号か確認

        // !Number.isFinite(stepNum)
        // → 数字として有効でない場合を弾く
        // !Number.isInteger(stepNum)
        // → 小数を弾く
        // stepNum < 1
        // → 0以下を弾く
        if (
          !Number.isFinite(stepNum) ||
          !Number.isInteger(stepNum) ||
          stepNum < 1
        ) {
          setErrorMessage("不正なステップ番号です");
          return;
        }

        // supabase から 現在のログインsession を取得
        const result = await supabase.auth.getSession();
        // session から access_tokenを取得
        const token = result.data.session?.access_token;

        // token がない場合、未ログイン扱い
        if (!token) {
          router.push("/login");
          return;
        }

        // API を呼び出し、現在の質問を取得
        // encodeURIComponent(diagnosisId) でURL に入れる文字列を安全な形に変換する
        // cache: "no-store" でキャッシュを使わず、毎回新しく取得する
        const res = await fetch(
          `/api/diagnosis/step?diagnosisId=${encodeURIComponent(diagnosisId)}&step=${stepNum}`,
          {
            method: "GET",
            // API に Supabase の token を送る
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        // API からのレスポンスを JSON形式で DiagnosisStepResponse の型で受け取る
        const json: DiagnosisStepResponse = await res.json();

        // APIエラー・HTTPエラーの場合の処理
        if (!res.ok || !json.success) {
          setErrorMessage(json.message ?? "質問の取得に失敗しました");
          return;
        }
        
        // API から 返ってきたデータ を 保存する
        setData(json);
      } catch (error) {
        // 開発者向けエラー
        console.error("failed to fetch step", error);
        // ユーザー向けに表示するエラーメッセージ
        setErrorMessage("質問の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStep();
  // [diagnosisId, step, router] の値が変わる度に useEffect を実行する
  }, [diagnosisId, step, router]);

  // 読み込み中の画面表示
  if (isLoading) {
    return (
      <main style={{ padding: "24px" }}>
        <p>読み込み中...</p>
      </main>
    );
  }

  // errorMessage がある or data.question がない or data.total がない or diagnosisId がないの状況の場合、
  // 質問を表示しない。エラー表示にする。
  if (errorMessage || !data?.question || data.total === undefined || !diagnosisId) {
    return (
      <main style={{ padding: "24px" }}>
        <p>{errorMessage || "質問を表示できませんでした"}</p>
        <Link href="/mypage">マイページへ戻る</Link>
      </main>
    );
  }

  // API から取得した質問の order を現在のステップ番号として使用
  // DB側 の正しい順番で表示するため
  const stepNum = data.question.order;

  return (
    <main style={{ padding: "24px" }}>
      {/* ページタイトル */}
      <h1>診断 Step {stepNum}</h1>

      {/* 現在の質問番号と全質問数 */}
      <p>
        現在の質問番号: {stepNum}/{data.total}
      </p>

      {/* 質問文 */}
      <p>質問: {data.question.questionText}</p>

      {/* 回答保存の為のフォーム追加 */}
      {/* 回答保存は AnswerForm.tsx 側で行う */}

      {/* diagnosisId= どの診断に保存するか */}
      {/* questionId= どの質問への回答か */}
      {/* order= 何問目か */}
      {/* isLast= 最後の質問かどうか */}
      <AnswerForm
        diagnosisId={diagnosisId} 
        questionId={data.question.id} 
        order={stepNum} 
        isLast={data.isLast ?? false} 
      />
    </main>
  );
}