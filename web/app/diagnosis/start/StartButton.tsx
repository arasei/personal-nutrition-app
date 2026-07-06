// web/app/diagnosis/start/StartButton.tsx


// 全体の概要
// - 診断開始ボタンコンポーネント
// - フロント側のログイン確認と認証に必要な token をAPIへ渡す係
// - 「診断を始める」ボタンを押したときに token を付けて API を呼び出す

// - 診断開始ページ(`web/app/diagnosis/start/page.tsx`)で「診断を始める」ボタンを押したときに、
// useSupabaseSession から access_token を取得し、その token(access_token) を `/api/diagnosis/start` に送る。
// そして、API(`web/app/api/diagnosis/start/route.ts`) を呼び出す

// - API側で token を検証し、Diagnosis レコードを作成した後、
// 返ってきた diagnosisId を使って step1 に遷移する。





// ポイント
// - StartButton.tsx
// → 診断を開始する「機能」を持つ
// → API呼び出し・ログイン確認・画面遷移

// - Button.tsx
// → ボタンの「見た目」を持つ
// → ボタンの色・余白・角丸・disabled 時の見た目


// - type="button"
// → 通常のクリック用ボタン

// - type="submit"
// → フォーム送信用ボタン

// - StartButton(診断開始ボタン) は フォーム送信ではないため、 type="button" とする

// - handleStartDiagnosis関数内で、useSupabaseSession から受け取った token をAPI(`web/app/api/diagnosis/start/route.ts`)に渡す
// - fetchでAPIを呼び、API から返ってきたdiagnosisIdを使ってrouter.pushでstep1に遷移する

// - userIdをクライアントから送らない。
// クライアントから userId を送ると、他人の userId を送れてしまう可能性があるため。

// - 本人確認は API側で token を検証して行う。(認証)

// - このファイルでは、Diagnosis は作成しない
// API側で Supabase Auth から取得した user.id を使って Diagnosis を作成する

// - このファイルでは、Prisma を直接使わない

// - このファイルでは、回答保存はしない




// このコンポーネントの役割
// - 「診断を始める」ボタン押下時に useSupabaseSession から token を取得
// - token がない場合は未ログインとして `/login` に遷移する
// - token がある場合は API(`web/app/api/diagnosis/start/route.ts`) を呼び出し、token を検証する
// - API側(`web/app/api/diagnosis/start/route.ts`)から diagnosisId を受け取り、
// 受け取った diagnosisId を使い 診断の質問ページ(`/diagnosis/step/1?diagnosisId=...`) に遷移する





// - このファイル内の流れ

// `web/app/diagnosis/start/page.tsx`
// ↓
// ユーザーが ボタン「診断を始める」を押す
// ↓
// `web/app/diagnosis/start/StartButton.tsx`
//   ↓
// 認証
// useSupabaseSession.ts で token を取得して、ログイン確認
//   ↓
// token を `diagnosis/start/StartButton.tsx` に渡す
//   ↓
// ユーザーが「診断を始める」を押す
//   ↓
// token がない
//   └─ `/login` へ移動
// or
// token がある場合は  `/api/diagnosis/start` を呼ぶ
// POST /api/diagnosis/start
//   ↓
// `web/app/api/diagnosis/start/route.ts`
//   ↓
// 認証
// API側で getAuthenticatedUserで token を検証・user.id を取得・Diagnosis 作成
//   ↓
// API側から diagnosisId が返ってくる
//   ↓
// `web/app/diagnosis/start/StartButton.tsx`
//   ↓
// 返ってきた diagnosisId を使い、`/diagnosis/step/1?diagnosisId=...` に遷移する





// 全体の流れ

// `web/app/diagnosis/start/page.tsx`
// ↓
// ユーザーが ボタン「診断を始める」を押す
// ↓
// `web/app/diagnosis/start/StartButton.tsx` を呼び出す
// ↓
// `web/app/diagnosis/start/StartButton.tsx`
// ↓
// 認証
// useSupabaseSession.ts で token を取得して、ログイン確認
// ↓
// token を `diagnosis/start/StartButton.tsx` に渡す
// ↓
// token がない場合は /login へ遷移
// or
// token がある場合は token を付けて `/api/diagnosis/start` を呼ぶ
// POST /api/diagnosis/start
// ↓
// `web/app/api/diagnosis/start/route.ts`
// ↓
// 認証
// API側(`web/app/api/diagnosis/start/route.ts`) で getAuthenticatedUser により token 検証
// ↓
// API側で user.id を取得
// ↓
// API側で Diagnosis 作成
// ↓
// API側から diagnosisId を  `web/app/diagnosis/start/StartButton.ts` に返す
// ↓
// `web/app/diagnosis/start/StartButton.ts`
// ↓
// 返ってきた diagnosisId を使い `/diagnosis/step/1?diagnosisId=xxx` に遷移





"use client";

// ログイン情報を確認して token を返す役割
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import type {
  StartDiagnosisResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";


export default function StartButton() {
  const router = useRouter();

  // フロント側の ログイン確認・token取得は共通フック(useSupabaseSession) で行う
  // 以下は、APIで認証を行うために必要な token を準備している
  // - フロント側で token があるかを確認
  // - APIへ送るための token を用意
  // - isSessionLoading: ログイン確認中
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  // 診断開始APIの処理中かどうかを管理するstate
  // - isStarting: 診断開始APIの通信中
  const [isStarting, setIsStarting] = useState(false);
  // エラーメッセージを画面に表示するためのstate
  const [errorMessage, setErrorMessage] = useState("");

  //開始ボタンを押した時の処理
  const handleStartDiagnosis = async () => {
    try {
      // 前回のエラー表示を消す
      setErrorMessage("");

      // tokenが無い = 未ログイン
      if (!token) {
        setErrorMessage("ログインが必要です");
        router.push("/login");
        return;
      }

      // 診断開始API の通信状態にする
      setIsStarting(true);

      // 診断開始APIを呼ぶ
      // - API側はここの token を見て、
      // - 「この人はログイン済みか？」・「この人の user.id は何か？」を確認する
      const res = await fetch("/api/diagnosis/start", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // APIからのレスポンスを StartDiagnosisResponse型(共通の型) で受け取る
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

      // API呼び出しは成功したが、診断ID(diagnosisId)が返ってこない時
      // data.success === true の時点で、型上は diagnosisId は必須のため削除しても可能
      if (!data.diagnosisId) {
        setErrorMessage("診断開始に失敗しました");
        return;
      }

      // 診断作成が成功し、返ってきた diagnosisId を使い、step1に遷移
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
    <div className="space-y-2">

      <Button
        type="button"
        onClick={handleStartDiagnosis}
        disabled={isButtonDisabled}
        className="w-full"
      >
        {isSessionLoading ? "ログイン確認中..." : isStarting ? "開始中..." : "診断を始める"}
      </Button>

      {/* errorMessage があるときだけ表示する */}
      {errorMessage && (
        <p className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
} 