// web/app/diagnosis/start/StartButton.tsx
// 診断開始ボタンコンポーネント

// 診断開始ボタンを押したときに、ログイン中ユーザーの Supabase session から access_token を取得し、
// その token を /api/diagnosis/start に送る。
// API側で token を検証し、Diagnosis レコードを作成した後、返ってきた diagnosisId を使って step1 に遷移する。


// API方式で実装

// handleStartDiagnosis関数内で
// tokenをSupabaseから取得して、APIに渡す
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
// ボタン押下時に Supabase から現在の session を取得する
// session から access_token を取り出す
// token がない場合は未ログインとして /login に遷移する
// token がある場合は /api/diagnosis/start を呼び出す
// APIから diagnosisId を受け取る
// /diagnosis/step/1?diagnosisId=... に遷移する



// 処理の流れ

// StartButton.tsx
// ボタン押下
//   ↓
// isLoading を true にする
//   ↓
// supabase.auth.getSession() で session を取得
//   ↓
// session から access_token を取得
//   ↓
// token がなければ「ログインが必要です」と表示して /login へ遷移
//   ↓
// token があれば /api/diagnosis/start に POST
//   ↓
// API側で token 検証・User同期・Diagnosis作成
//   ↓
// APIから diagnosisId を受け取る
//   ↓
// diagnosisId があれば /diagnosis/step/1?diagnosisId=... に遷移
//   ↓
// 最後に isLoading を false に戻す



// useRouter → 画面遷移用
// useState → ローディング制御用
// supabase → session 取得用



"use client";

import { supabase } from "@/lib/supabase/client";
import { StartDiagnosisResponse } from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function StartButton() {
  const router = useRouter();
  //開始処理中かどうかを管理するためのstate
  const [isLoading, setIsLoading] = useState(false);

  //開始ボタンを押した時の処理
  const handleStartDiagnosis = async () => {
    try {
      // 処理開始時にローディング状態に切り替える
      setIsLoading(true);

      //現在のログイン情報(session)を取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      //sessionからaccess_tokenを取り出す
      const token = session?.access_token;

      //tokenが無い=未ログイン
      if (!token) {
        alert("ログインが必要です");
        router.push("/login");
        return;
      }

      //診断開始APIを呼ぶ
      const res = await fetch("/api/diagnosis/start", {
        method: "POST",
        headers: {
          Authorization: token,
        },
      });

      //APIからのレスポンスをStartDiagnosisResponse型(共通の型)で受け取る
      const data: StartDiagnosisResponse = await res.json();

      //API呼び出し失敗時
      if (!res.ok || !data.success) {
        alert(data.message ?? "診断開始に失敗しました");
        return;
      }

      //API呼び出しは成功したが、診断ID(diagnosisId)が返ってこない時
      if (!data.diagnosisId) {
        alert("diagnosisIdの取得に失敗しました");
        return;
      }

      //作成し、返ってきたdiagnosisIdを使い、step1に遷移
      router.push(`/diagnosis/step/1?diagnosisId=${data.diagnosisId}`);
    } catch (error) {
      console.error("Failed to start diagnosis:", error);
      alert("診断開始に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleStartDiagnosis}
      disabled={isLoading}
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid #ccc",
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? "開始中..." : "診断を始める"}
    </button>
  );
} 