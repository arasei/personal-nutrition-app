// web/app/diagnosis/start/StartButton.tsx


// 全体の概要
// - 診断開始ボタンコンポーネント
// - フロント側のログイン確認と認証に必要な token をAPIへ渡す係
// - 「診断を始める」ボタンを押したときに token を付けて API を呼び出す

// - 診断開始ページ(`web/app/diagnosis/start/page.tsx`)で
// useSupabaseSession から 現在の認証状態 と access_token を取得し、
// 「診断を始める」ボタンを押した時、その token(access_token) を `/api/diagnosis/start` に送り、
// 診断開始API(`web/app/api/diagnosis/start/route.ts`) を呼び出す

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
// - useSupabaseSession で認証状態を管理し、現在の token を受け取る
// - 「診断を始める」ボタン押下時に 受け取っている token を 使用する
// - token がない場合は APIを呼ばず、未ログインとして `/login` に遷移する
// - token がある場合は API(`web/app/api/diagnosis/start/route.ts`) を呼び出し、token を送り、検証する
// token の検証 と 診断レコードの作成は API側で行う
// - API側(`web/app/api/diagnosis/start/route.ts`)から diagnosisId を受け取り、
// 受け取った diagnosisId を使い 診断の質問ページ(`/diagnosis/step/1?diagnosisId=...`) に遷移する





// - このファイル内の流れ

// `web/app/diagnosis/start/page.tsx`
// ↓
// ユーザーが 診断開始ページ を開く
// ↓
// `web/app/diagnosis/start/StartButton.tsx`
//   ↓
// 認証
// useSupabaseSession.ts で token を取得して、ログイン確認
//   ↓
// token を `diagnosis/start/StartButton.tsx` に渡す
//   ↓
// StartButtonContent がボタン表示と通信状態を監視する
//   ↓
// ユーザーが「診断を始める」を押すことで handleStartDiagnosis を実行する
//   ↓
// token がない
//   └─ `/login` へ移動
// or
// token がある場合は  `/api/diagnosis/start`(診断開始API) を呼ぶ
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
// 返ってきたレスポンスが現在も有効か確認する
//   ↓
// 有効なレスポンスの場合
// 返ってきた diagnosisId を使い、`/diagnosis/step/1?diagnosisId=...` に遷移する
// or
// 無効なレスポンスの場合
// 画面離脱・認証状態変更時は古い通信を中止・無効化する





// 全体の流れ

// `web/app/diagnosis/start/page.tsx`
// ↓
// ユーザーが 診断開始ページを開く
// ↓
// `web/app/diagnosis/start/StartButton.tsx`
// ↓
// 認証
// useSupabaseSession.ts で token を取得して、ログイン確認
// ↓
// token を `diagnosis/start/StartButton.tsx` に渡す
// ↓
// StartButtonContent がボタン表示と通信状態を監視する
// ↓
// ユーザーが「診断を始める」を押すことで handleStartDiagnosis を実行する
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
// `web/app/diagnosis/start/StartButton.tsx`
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
import { useLayoutEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";


type StartButtonContentProps = {
  token: string | null;
  isSessionLoading: boolean;
};


// 認証状態を取得・監視する外側のコンポーネント
export default function StartButton() {
  // フロント側の ログイン確認・token取得は共通フック(useSupabaseSession) で行う
  // 以下は、APIで認証を行うために必要な token を準備している
  // - フロント側で token があるかを確認
  // - APIへ送るための token を用意
  // - isSessionLoading: ログイン確認中
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  // 認証状態が変わったら、ボタンの状態と通信管理を作り直す。
  // token を含むため、画面やログには出力しない
  const authKey = JSON.stringify([isSessionLoading, token]);

  return (
    <StartButtonContent
      key={authKey}
      token={token}
      isSessionLoading={isSessionLoading}
    />
  );
}

// ボタン表示・診断開始の通信を管理する内側のコンポーネント
function StartButtonContent({
  token,
  isSessionLoading,
}: StartButtonContentProps) {
  const router = useRouter();

  // 診断開始APIの処理中かどうかを管理するstate
  // - 成功時は画面が切り替わるまで true を維持し、二重操作を防ぐ
  // - isStarting: 診断開始APIで処理中
  const [isStarting, setIsStarting] = useState(false);
  // エラーメッセージを画面に表示するためのstate
  const [errorMessage, setErrorMessage] = useState("");

  const isMountedRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);

  // コンポーネントが表示されているかを確認する
  // - アンマウント時に古い通信を中止し、画面へ反映できない状態にする

  // useLayoutEffect を使う理由
  // - 今回は、内側のコンポーネントが取り除かれる際の通信無効化を、通常のEffectより早いタイミングで行うために使用。
  // - 行うのは ref の更新 と 通信中止だけで、API呼び出しは行わない。
  // - useLayoutEffect は画面描画を妨げる可能性があるため、ここに重い処理は書かない
  useLayoutEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      const controller = activeControllerRef.current;
      activeControllerRef.current = null;
      controller?.abort();
    };
  }, []);

  // 「診断を始める」ボタンを押した時の処理
  const handleStartDiagnosis = async () => {
    // 認証確認中・画面離脱後・すでに通信中なら開始しない。
    if (
      !isMountedRef.current || isSessionLoading || activeControllerRef.current !== null
    ) {
      return;
    }

    // 前回のエラーメッセージを消す
    setErrorMessage("");

    // tokenが無い = 未ログイン
    if (!token) {
      setErrorMessage("ログインが必要です");
      router.push("/login");
      return;
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    // この通信結果を、現在も反映してよいか確認する
    const isCurrentRequest = () => isMountedRef.current && activeControllerRef.current === controller && !controller.signal.aborted;

    // 診断開始API の通信状態にする
    setIsStarting(true);

    // 遷移開始時点から、アンマウントまでボタンを無効にしておく。
    let navigationStarted = false;

      // 診断開始APIを呼ぶ
      // - API側はここの token を見て、
      // - 「この人はログイン済みか？」・「この人の user.id は何か？」を確認する
    try {
      const res = await fetch("/api/diagnosis/start", {
        method: "POST",
        headers: {Authorization: `Bearer ${token}`,},
        signal: controller.signal,
      });

      // APIからのレスポンスを StartDiagnosisResponse型(共通の型) で受け取る
      const data: StartDiagnosisResponse = await res.json();

      // レスポンス読み取り後、認証変更・画面離脱により 通信が中止済み・無効 の状態でないかどうかを確認
      // 通信が中止・無効 状態の場合、古い結果を画面表示しないため
      if (!isCurrentRequest()) {
        return;
      }

      // API処理がエラーの場合の処理
      if(!data.success) {
        const errorData: ApiErrorResponse = data;
        setErrorMessage(errorData.message ?? "診断開始に失敗しました",);
        return;
      }

      // HTTP処理がエラーの場合の処理
      if (!res.ok) {
        setErrorMessage("診断開始に失敗しました");
        return;
      }

      // API呼び出しは成功したが、診断ID(diagnosisId)が返ってこない時
      // - 成功レスポンスの型では diagnosisId は必須だが、
      // 実際の応答に診断IDがない場合の誤った画面遷移を防ぐため確認する
      if (!data.diagnosisId) {
        setErrorMessage("診断開始に失敗しました");
        return;
      }

      // 診断作成が成功し、返ってきた diagnosisId を使い、step1に遷移
      router.push(`/diagnosis/step/1?diagnosisId=${encodeURIComponent(data.diagnosisId)}`,);
      navigationStarted = true;
    } catch {
      // 認証変更・画面離脱により 通信が中止済み・無効 の状態でないかどうかを確認
      // 通信が中止・無効 状態の場合、古い結果を画面表示しないため
      if (!isCurrentRequest()) {
        return;
      }

      console.error("診断開始の通信処理に失敗しました");
      setErrorMessage("診断開始に失敗しました");
    } finally {
      // 古い処理で状態を更新しないよう、有効な通信か確認している。
      // 遷移開始後は画面が切り替わるまで二重操作を防ぐ
      if (isCurrentRequest() && !navigationStarted) {
        activeControllerRef.current = null;
        setIsStarting(false);
      }
    }
  };

  // ログイン(認証)確認中 と 診断開始API通信中  成功後の画面切り替え待ちはボタンを無効にし、押せなくする
  const isButtonDisabled = isSessionLoading || isStarting;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleStartDiagnosis}
        disabled={isButtonDisabled}
        className="w-full"
      >
        {isSessionLoading ? "読み込み中..." : isStarting ? "開始中..." : "診断を始める"}
      </Button>

      {/* errorMessage があるときだけ表示する */}
      {errorMessage && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}
    </div>
  );
}
