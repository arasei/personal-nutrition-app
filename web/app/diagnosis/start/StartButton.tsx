// web/app/diagnosis/start/StartButton.tsx
// 診断開始ボタンコンポーネント


// 診断開始ボタンを押したときにログイン中ユーザーの token を取得し、開始APIを呼んで diagnosisId を受け取り、step1 に遷移するクライアントコンポーネント

// API方式で実装

// handleStartDiagnosis関数内で
// tokenをSupabaseから取得して、APIに渡す
// fetchでAPIを呼び、返ってきたdiagnosisIdを使ってrouter.pushでstep1に遷移する

// userIdをクライアントから送らない
// 本人確認はAPI側で行う
// なぜなら、userIdはサーバー側でSupabaseから取得して保存するため
// クライアントからuserIdを送ると、他のユーザーが他人のuserIdを送って診断を始める可能性があるため


// やっていること
// ボタンを押す
// ログイン中か確認する
// ログイン中なら開始APIを呼ぶ
// サーバーが診断レコードを作る
// そのIDを受け取ってstep1へ進む

// 流れ
// StartButton.tsx
// ↓ ボタン押下
// session取得
// ↓
// token取得
// ↓
// /api/diagnosis/start を fetch
// ↓
// route.ts 側で token検証
// ↓
// Diagnosis作成
// ↓
// diagnosisId を返す
// ↓
// StartButton.tsx が router.push



// useRouter → 画面遷移用
// useState → ローディング制御用
// supabase → session 取得用



"use client";

import { supabase } from "@/lib/supabase";
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
        router.push("/sign_in");
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