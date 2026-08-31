// web/app/diagnosis/step/[step]/page.tsx

// 全体の概要
// - URL から step と diagnosisId を取得し、ログイン中ユーザーの token を使って診断ステップ取得APIを呼び、現在の質問を取得して表示するページ
// - 診断の各ステップごとに表示するページ
// - [step]は動的ルートで、URLの/diagnosis/step/1 や /diagnosis/step/2 の数字部分を受け取るページ




// 役割
// - 1問分の枠組みを表示
// - 1問ずつ質問を表示する役割




// ポイント
// URLで状態を表す
// - 現在のステップ番号や診断IDをURLで管理する。

// 例.
// /diagnosis/step/2?diagnosisId=abc
// なら、
// step = 2
// diagnosisId = abc
// という状態がURLから分かる。




// - このファイル内の流れ

// `web/app/diagnosis/start/StartButton.tsx`
// ↓
// diagnosisId を使い、`/diagnosis/step/1?diagnosisId=...` に遷移する
// ↓
// `web/app/diagnosis/step/[step]/page.tsx` を開く
// ↓
// useParams で URLから step
// ↓
// useSearchParams で diagnosisId を取得
// ↓
// 認証
// useSupabaseSession で token を取得し、ログイン確認
// ↓
// GET /api/diagnosis/step
// `web/app/diagnosis/step/[step]/page.tsx` が token を `web/app/api/diagnosis/step/route.ts` へ リクエストを送る
// ↓
// `web/app/api/diagnosis/step/route.ts`
// ↓
// API側 で 本人確認・step確認・質問数(total)取得・order = step の番号に合う質問取得し、整形し、
// フロントに質問データを返す
// ↓
// `web/app/diagnosis/step/[step]/page.tsx`
// ↓
// 返ってきた質問データを使い、画面に質問を表示する
// ↓
// AnswerForm に必要な値を渡す




// - 全体の流れ

// `web/app/diagnosis/step/[step]/page.tsx` を開く
//   ↓
// /diagnosis/step/1?diagnosisId=xxx
//   ↓
// useParams で URL から step を取る
//   ↓
// useSearchParams で diagnosisId を取る
//   ↓
// 認証
// useSupabaseSession で token を取得し、ログイン確認
//   ↓
// GET /api/diagnosis/step?diagnosisId=xxx&step=1
// `web/app/diagnosis/step/[step]/page.tsx` が token を `web/app/api/diagnosis/step/route.ts` へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/step/route.ts`
//   ↓
// getAuthenticatedUser(request) で token を検証し、ログイン中ユーザーかどうかを確認し、取得
//   ↓
// ログイン中ユーザー情報を取得後、user.id を取得し、使用可能
//   ↓
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
// AnswerForm.tsx で回答を入力
//   ↓
// POST /api/diagnosis/answers
//   ↓
// /api/diagnosis/answers に回答保存成功
//   ↓
// nextHref へ移動
// 次の質問ページ(web/app/diagnosis/step/[step]/page.tsx) 
// or
// 結果ページ(web/app/diagnosis/[diagnosisId]/result/page.tsx)






"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import AnswerForm from "./AnswerForm";
import type {
  DiagnosisStepResponse,
  ApiErrorResponse,
} from "@/types/diagnosisApi";
import { PageLoading } from "@/components/ui/PageLoading";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";



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

  const { token, isLoading: isSessionLoading } = useSupabaseSession();

  // API から取得した質問データを保存する場所
  const [data, setData] = useState<DiagnosisStepResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // useEffect() で diagnosisId・step・router が変わった時、API取得を行う
  useEffect(() => {
    // Supabase がログイン状態を確認中は、API を呼ばず待つ
    if (isSessionLoading) {
      return;
    }

    const fetchStep = async () => {
      // API取得処理
      // - エラーが起きる可能性のある処理を try/catch で行う
      try {
        setIsLoading(true);
        setErrorMessage("");

        // diagnosisIdが存在するかチェック
        // - 回答保存には必ず、どの診断に対する回答かを示すdiagnosisId が必要
        if (!diagnosisId) {
          setErrorMessage("診断IDが見つかりません");
          return;
        }

        // URL から取得したstep(文字列)を数値に変換
        const stepNum = Number(step);

        // stepNum が正しいステップ番号か確認
        // - !Number.isFinite(stepNum)
        // → 数字として有効でない場合を弾く
        // - !Number.isInteger(stepNum)
        // → 小数を弾く
        // - stepNum < 1
        // → 0以下を弾く
        if (
          !Number.isFinite(stepNum) ||
          !Number.isInteger(stepNum) ||
          stepNum < 1
        ) {
          setErrorMessage("不正なステップ番号です");
          return;
        }

        // ログイン確認完了後も、token がない場合、未ログイン扱い
        // - 未ログインで守りたいページなので replace で行う
        // - ブラウザの戻るボタンでまた診断ステップページへ戻りにくくするため
        if (!token) {
          setErrorMessage("ログインが必要です");
          router.replace("/login");
          return;
        }

        // API を呼び出し、現在の質問を取得
        // - encodeURIComponent(diagnosisId) でURL に入れる文字列を安全な形に変換する
        // - cache: "no-store" でキャッシュを使わず、毎回新しく取得する
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

        // HTTP処理がエラーの場合の処理
        if (!res.ok) {
          const errorData = json as ApiErrorResponse;
          setErrorMessage(errorData.message ?? "質問の取得に失敗しました");
          return;
        }

        // API処理がエラーの場合の処理
        if (!json.success) {
          setErrorMessage(json.message ?? "質問の取得に失敗しました");
          return;
        }
        
        // API から 返ってきたデータ を 保存する
        // - json.success が true の時だけ setData(json) を行う
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
  }, [diagnosisId, step, router, token, isSessionLoading]);

  // ログイン状態確認中 or 質問取得中の場合の画面表示
  // isSessionLoading
  // - Supabase認証確認中
  // isLoading
  // - 質問API取得中
  if (isSessionLoading || isLoading) {
    return <PageLoading message="診断画面を読み込み中..." />;
  }

  // errorMessage がある or data がない or data.success がない or diagnosisId がないの状況の場合、
  // 質問を表示しない。エラー表示にする。
  // - 診断質問ページ の 内容を表示する幅 を制限する、
  // max-w-xl: 最大幅 を約576px に制限している
  if (errorMessage || !data || !data.success || !diagnosisId) {
    return (
      <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
        <ErrorMessage>
          {errorMessage || "質問を表示できませんでした"}
        </ErrorMessage>

        {/* <nav>...</nav> で移動用リンクだとわかるようにする */}
        {/* 単独の移動リンクのため、 LinkButton を使用 */}
        <nav aria-label="診断エラー時の移動">
          <LinkButton href="/mypage" variant="text">
            マイページへ戻る
          </LinkButton>
        </nav>
      </main>
    );
  }

  // API から取得した質問の order を現在のステップ番号として使用
  // - DB側 の正しい順番で表示するため
  const stepNum = data.question.order;



  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-muted">
          栄養診断
        </p>

        {/* ページタイトル */}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          あなたの生活習慣について
        </h1>

        {/* 現在の質問番号と全質問数 */}
        <p className="mt-2 text-sm font-medium text-primary">
          質問 {stepNum} / {data.total}
        </p>
      </header>

      <section
        className="mt-8"
        aria-labelledby="question-heading"
      >
        <Card>
          {/* 質問文 */}
          <h2
            id="question-heading"
            className="text-lg font-semibold leading-7 text-foreground"
          >
            {data.question.questionText}
          </h2>
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
        </Card>
      </section>
    </main>
  );
}
