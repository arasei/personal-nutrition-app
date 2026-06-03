// web/app/diagnosis/start/StartButton.tsx


// 診断開始ボタンコンポーネント

// 診断開始ボタンを押したときに、useSupabaseSession から access_token を取得し、
// その token を /api/diagnosis/start に送る。
// API側で token を検証し、Diagnosis レコードを作成した後、返ってきた diagnosisId を使って step1 に遷移する。



// handleStartDiagnosis関数内で
// useSupabaseSession から受け取った token をAPIに渡す
// fetchでAPIを呼び、返ってきたdiagnosisIdを使ってrouter.pushでstep1に遷移する


// このコンポーネントがやらないこと
// userId をクライアントから送らない
// Diagnosis を直接作成しない
// Prisma を直接使わない
// 回答保存はしない


// userIdをクライアントから送らない
// クライアントから userId を送ると、他人の userId を送れてしまう可能性があるため
// 本人確認は API 側で token を検証して行う
// API側で Supabase Auth から取得した user.id を使って Diagnosis を作成する


// このコンポーネントの役割
// 「診断を始める」ボタンを表示する
// ボタン押下時に useSupabaseSession から取得済みの token を使う
// token がない場合は未ログインとして /login に遷移する
// token がある場合は /api/diagnosis/start を呼び出す
// APIから diagnosisId を受け取る
// /diagnosis/step/1?diagnosisId=... に遷移する




// 流れ

// 画面表示
//   ↓
// useSupabaseSession がログイン確認
//   ↓
// token を StartButton に渡す
//   ↓
// ユーザーが「診断を始める」を押す
//   ↓
// token がない
//   └─ /login へ移動

// token がある
//   ↓
// POST /api/diagnosis/start
//   ↓
// API側で token を検証
//   ↓
// API側で user.id を取得
//   ↓
// Diagnosis 作成
//   ↓
// diagnosisId を返す
//   ↓
// /diagnosis/step/1?diagnosisId=... に移動





"use client";

// ログイン情報を確認して token を返す役割
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import type {
  StartDiagnosisResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function StartButton() {
  const router = useRouter();

  // Supabase のログイン確認・token取得は共通フックに任せる
  // isSessionLoading: ログイン確認中
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  // 診断開始APIの処理中かどうかを管理するstate
  // isStarting: 診断開始APIの通信中
  const [isStarting, setIsStarting] = useState(false);
  // エラーメッセージを画面に表示するためのstate
  const [errorMessage, setErrorMessage] = useState("");

  //開始ボタンを押した時の処理
  const handleStartDiagnosis = async () => {
    try {
      // 前回のエラー表示を消す
      setErrorMessage("");

      //tokenが無い=未ログイン
      if (!token) {
        setErrorMessage("ログインが必要です");
        router.push("/login");
        return;
      }

      // 診断開始API の通信状態にする
      setIsStarting(true);

      //診断開始APIを呼ぶ
      // API側はここの token を見て、
      // 「この人はログイン済みか？」・「この人の user.id は何か？」を確認する
      const res = await fetch("/api/diagnosis/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      //APIからのレスポンスをStartDiagnosisResponse型(共通の型)で受け取る
      const data: StartDiagnosisResponse = await res.json();

      // HTTP処理がエラーの場合の処理
      if (!res.ok) {
        const errorData = data as ApiErrorResponse;
        setErrorMessage(errorData.message ?? "診断開始に失敗しました");
        return;
      }

      // API処理がエラーの場合の処理
      if (!data.success) {
        setErrorMessage(data.message ?? "診断開始に失敗しました");
        return;
      }

      //API呼び出しは成功したが、診断ID(diagnosisId)が返ってこない時
      // data.success === true の時点で、型上は diagnosisId は必須のため削除しても可能
      if (!data.diagnosisId) {
        setErrorMessage("diagnosisIdの取得に失敗しました");
        return;
      }

      //診断作成が成功し、返ってきたdiagnosisIdを使い、step1に遷移
      router.push(`/diagnosis/step/1?diagnosisId=${data.diagnosisId}`);
    } catch (error) {
      console.error("Failed to start diagnosis:", error);
      setErrorMessage("診断開始に失敗しました");
    } finally {
      setIsStarting(false);
    }
  };

  // ログイン確認中 と 診断開始API通信中 はボタンを押せなくする
  const isButtonDisabled = isSessionLoading || isStarting;

  return (
    <div>
      <button
        type="button"
        onClick={handleStartDiagnosis}
        disabled={isButtonDisabled}
        style={{
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #ccc",
          cursor: isButtonDisabled ? "not-allowed" : "pointer",
          opacity: isButtonDisabled ? 0.7 : 1,
        }}
      >
        {isButtonDisabled ? "開始中..." : "診断を始める"}
      </button>

      {/* errorMessage があるときだけ表示する */}
      {errorMessage && (
        <p style={{ color: "red", marginTop: 8 }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
} 