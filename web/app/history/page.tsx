// web/app/history/page.tsx



// 全体の概要
// - 履歴APIからデータを取得して、不足傾向が高い上位3件の栄養素(lowNutrients)と日付をそれぞれの履歴カードとして画面に表示し、リンクから履歴詳細ページへ遷移できるページ
// - ログイン中ユーザーの Supabase token を使って、履歴API(web/app/api/diagnosis/history/route.ts)を呼び、
// 本人の診断履歴だけを取得し、一覧表示するページ




// ポイント

// - lowNutrients = 不足傾向が高い順の上位3栄養素

// - scores: 各診断の栄養素スコア
// scores: {
//           orderBy: { score: "asc" }, // score が低い順 = 不足傾向が高い
//           include: { nutrient: true },
//         },


// - APIから履歴一覧データ diagnosis (配列)が histories として返る
// - 履歴データをmapで画面に並べる
// - 履歴一覧をクリック、IDごとの履歴詳細へ遷移


// - 日付のデータの扱い方
// APIで日付を返すとき
// データとして使いやすい文字列の状態に変換して返す
//   ↓
// toISOString()


// - 画面に日付を表示するとき
//   ↓
// toLocaleDateString()








// このファイル内での SWR について

// const {
//   data: histories,
//   error,
//   isLoading: isHistoryLoading,
// } = useSWR(
//   token ? ["diagnosis-history", token] : null,
//   ([, token]) => fetchDiagnosisHistory(token)
// );



// - token がある時だけ 履歴API(/api/diagnosis/history) を呼ぶ

// - 取得中は isHistoryLoading

// - 成功したら履歴データは histories に保存し、扱う

// - 失敗したら error



// useSupabaseSession で token(ログイン中ユーザー情報・状態) を確認、取得し、
// useSWR(...) で 履歴一覧表示するために使う必要な情報(data・error・isLoading)を取得し、受け取り方・状態を指定するということを "diagnosis-history" という名前(SWRキーの目印)で 1つにまとめて管理
// token が無い場合は、null として API を呼ばない。
// token があれば useSWR を実行し、key とした ["diagnosis-history" , token] の内の [, token] で token だけを指定して使用して
// fetchDiagnosisHistory(token) で `function fetchDiagnosisHistory` を実行し、
// GET fetch("/api/diagnosis/history") で 履歴一覧API(`web/app/api/diagnosis/history/route.ts`)を呼び出し、実行している。

// - token がある → useSWR で履歴APIを呼ぶ
// - token がない → SWRキーを null にして、APIを呼ばない。

// useSWR は以下の情報を返す
// - histories: 履歴一覧API から取得したデータ
// - error: API取得に失敗した時のエラー
// - isHistoryLoading: 履歴一覧API を取得中どうか

// ["diagnosis-history", token] はSWRキー
// - "diagnosis-history": 
// 診断履歴取得用のデータだと分かる目印(箱の名前)
// 履歴一覧API から履歴一覧を表示するために必要な情報(data・error・isLoading)の 受け取り方・状態 を1つにまとめた箱(キーの名前)
// - token: ログインユーザーごとのの履歴データを区別するための値(ログイン情報・状態)
// - token も SWR の キーに入れることで、
// ログインユーザーが変わった時(token が変わる度)に前のユーザーの履歴を使い回さず、
// 新しいユーザーの履歴を取得できる

// ([, token]) は配列の分割代入
// - 1つ目の "diagnosis-history" は使わない
// - 2つ目の token だけを取り出す

// 取り出した token を fetchDiagnosisHistory(token) に渡し、token の情報を使い、
// GET /api/diagnosis/history で 履歴一覧API(`web/app/api/diagnosis/history/route.ts`) を呼びだし、
// 履歴一覧(histories)を取得し、履歴一覧ページ(web/app/history/page.tsx)に表示する



// - SWR 流れ

// `web/app/history/page.tsx`

// useSupabaseSession
// ↓
// token を取得
// ↓
// tokenあり？
// ├─ いいえ
// │  └─ SWRキーは null
// │     └─ APIを呼ばない
// │
// └─ はい
//    └─ SWRキーは ["diagnosis-history", token]
//       ↓
//       SWRが token の情報を元に fetcher を実行
//       ↓
//       fetchDiagnosisHistory(token)
//       ↓
//       Authorization: Bearer <token>
//       ↓
//       GET /api/diagnosis/history
//       ↓
//       `web/app/api/diagnosis/history/route.ts`
//       ↓
//       履歴一覧表示する為に整形したデータの配列を histories として、作成し、
//       型を付けて `web/app/history/page.tsx` に返す
//       ↓
//       `web/app/history/page.tsx`
//       ↓
//       histories に履歴一覧データが入る
//       ↓
//       画面に履歴一覧を表示する









// - このファイル内の流れ

// 履歴一覧をページを開く
// ↓
// `web/app/history/page.tsx`
// ↓
// 認証
// useSupabaseSession から token を取得
// ↓
// access_tokenを取り出す
// ↓
// useSWR(...) で 履歴一覧の情報を管理し、token を元に function fetchDiagnosisHistory(...) を実行
// token が取れるまでAPI を呼ばず、token が取れたら本人の履歴を取得し、その 結果・エラー・読み込み状態 を SWR に管理させる
// ↓
// GET /api/diagnosis/history/route.ts
// `web/app/history/page.tsx` が token を `web/app/api/diagnosis/history/route.ts` へ リクエストを送る
// ↓
// `web/app/api/diagnosis/history/route.ts`
// ↓
// 履歴一覧表示する為に整形したデータの配列を histories として、作成し、
// 型を付けて `web/app/history/page.tsx` に返す
// ↓
// `web/app/history/page.tsx`
// ↓
// `web/app/history/page.tsx` で 履歴一覧(histories)表示
// ↓
// - <Link href={`/history/${history.id}`} key={history.id}>
// 診断履歴詳細のリンクを1つクリックで `web/app/history/[diagnosisId]/page.tsx`(診断履歴詳細ページ) へ遷移可能
// - 「← マイページへ」 の <Link>...</Link> をクリックで `web/app/mypage/mypage.tsx`(マイページ) へ遷移可能










// - 全体の流れ

// 履歴一覧ページを開く
//   ↓
// `web/app/history/page.tsx`
//   ↓
// 認証
// useSupabaseSession で token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// useSWR(...) で 履歴一覧の情報を管理し、token を元に function fetchDiagnosisHistory(...) を実行
//   ↓
// GET /api/diagnosis/history
// web/app/history/page.tsx が token を web/app/api/diagnosis/history/route.ts へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/history/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// Prismaで user.id で本人の完了済み診断だけ取得(Prisma で userId: user.id の履歴だけ検索)
//   ↓
// scores を score 昇順(score の低い順 = 不足傾向が高い順)で取得
//   ↓
// 不足傾向が高い順で並べたランキングの上位3栄養素(lowNutrients)だけ整形して作成
//   ↓
// 履歴一覧表示に必要な値(histories) を `web/app/history/page.tsx` に返す
//   ↓
// `web/app/history/page.tsx`
//   ↓
// `web/app/history/page.tsx` で data.histories(履歴一覧)を画面に表示
//   ↓
// <Link href={`/history/${history.id}`} key={history.id}>
// 診断履歴詳細のリンクを1つクリックで `web/app/history/[diagnosisId]/page.tsx`(診断履歴詳細ページ) へ遷移可能
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// useParamsで [diagnosisId] を取得
//   ↓
// 認証
// useSupabaseSession で token を取得
//   ↓
// access_tokenを取り出す
//   ↓
// GET /api/diagnosis/history/${diagnosisId}/route.ts
// `web/app/history/[diagnosisId]/page.tsx` が token を `web/app/api/diagnosis/history/[diagnosisId]/route.ts` へ リクエストを送る
//   ↓
// `web/app/api/diagnosis/history/[diagnosisId]/route.ts`
//   ↓
// 認証
// getAuthenticatedUser(request)
// getAuthenticatedUser.ts で token 検証し、ログインユーザー情報(user)を確認し、取得
//   ↓
// user.id を取得し、使用可能
//   ↓
// URLの [diagnosisId] から diagnosisId(診断ID) を取得
//   ↓
// 認可
// 今回の診断を diagnosisId + user.id + COMPLETED で本人の完了済み診断に絞り取得
//   ↓
// 前回診断も user.id で本人に絞って取得
//   ↓
// 今回の scores を見やすい配列(栄養素+栄養素ID+点数)に整形(nutrientScores)
//   ↓
// スコア上位3件を作る(topNutrients)
//   ↓
// スコア下位3件を作る(lowNutrients)
//   ↓
// 同じnutrientIdを元に前回との差分を作る(differences)
//   ↓
// 前回データがあるか判定
// ├─ ある → diff を計算
// └─ ない → 前回データなし
//   ↓
// createdAt を toISOString() で文字列にする
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` に 診断履歴詳細を表示するために
// 必要な値(
// success: true,
// id: currentDiagnosis.id,
// createdAt: currentDiagnosis.createdAt.toISOString(),
// nutrientScores,
// topNutrients,
// lowNutrients,
// differences,
// ) を返す
//   ↓
// `web/app/history/[diagnosisId]/page.tsx`
//   ↓
// `web/app/history/[diagnosisId]/page.tsx` で画面に診断履歴詳細を表示








"use client";

import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// SWR でAPIからデータを取る処理を管理
import useSWR from "swr";
import type {
  DiagnosisHistoryItem,
  GetDiagnosisHistoryResponse,
} from "@/types/diagnosisApi";
import { PageLoading } from "@/components/ui/PageLoading";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";


// 履歴APIを呼び出すfetcher関数
async function fetchDiagnosisHistory(token: string): Promise<DiagnosisHistoryItem[]> {
  const res = await fetch("/api/diagnosis/history", {
    method: "GET",
    // APIにログイン中ユーザーの token を渡す
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // 前のデータを使い回さない
    // - 毎回サーバーから新しいデータを取りに行く
    cache: "no-store",
  });

  // APIから返ってきたデータをJSONとして解析する
  const responseData: GetDiagnosisHistoryResponse = await res.json();

  // HTTP処理がエラーの場合の処理
  if (!res.ok) {
    const message = "message" in responseData && responseData.message ? responseData.message : "履歴取得に失敗しました";

    throw new Error(message);
  }

  // API処理がエラーの場合の処理(データが返って来ない、取得できない時)
  // - success: true の時だけ histories を使えるようにする
  if (!responseData.success) {
    const message = "message" in responseData && responseData.message ? responseData.message : "履歴取得に失敗しました";

    throw new Error(message);
  }

  // 画面で使いたい履歴配列だけ返す
  return responseData.histories;
}




// 画面表示ロジック
export default function HistoryPage() {
  const router = useRouter();

  // ログイン中ユーザーの token を取得
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  
  useEffect(() => {
    // tokenが無い場合、未ログインとして /login に遷移する
    if (!isSessionLoading && !token) {
      router.replace("/login");
    }
  }, [isSessionLoading, token, router]);



// useSupabaseSession → tokenを取得する
// useSWR → tokenがある時だけ履歴一覧を取得し、data・error・isLoadingを管理する
// "diagnosis-history" → tokenの名前ではなく、SWRキーの目印
// fetchDiagnosisHistory(token) → /api/diagnosis/history を呼ぶ

  // - token がある → useSWR で履歴APIを呼ぶ
  // - token がない → SWRキーを null にして、APIを呼ばない。

  // useSWR は以下の情報を返す
  // - histories: 履歴一覧API から取得したデータ
  // - error: API取得に失敗した時のエラー
  // - isHistoryLoading: 履歴一覧API を取得中どうか

  // ["diagnosis-history", token] はSWRキー
  // - "diagnosis-history": 
  // 履歴一覧API から履歴一覧を表示するために必要な情報(data・error・isLoading)の 受け取り方・状態 を1つにまとめた箱(キーの名前)
  // - token: ログインユーザーごとのの履歴データを区別するための値(ログイン情報・状態)
  // ログインユーザーが変わった時(token が変わる度)に前のユーザーの履歴を使い回さず、
  // 新しいユーザーの履歴を取得できる

  // ([, token]) は配列の分割代入
  // - 1つ目の "diagnosis-history" は使わない
  // - 2つ目の token だけを取り出す

  const {
    data: histories,
    error,
    isLoading: isHistoryLoading,
  } = useSWR(
    token ? ["diagnosis-history", token] : null,
    ([, token]) => fetchDiagnosisHistory(token)
  );

  // ログイン状態確認中 or 履歴一覧取得中 の場合の表示
  // isSessionLoading
  // - Supabase認証確認中
  // isLoading
  // - 履歴一覧API取得中
  if (isSessionLoading || isHistoryLoading) {
    return <PageLoading />;
  }

  if (!token) {
    return <p>ログインページへ移動しています...</p>;
  }


  // API取得失敗の場合のエラーメッセージ表示
  if (error) {
    console.error("履歴一覧の取得に失敗しました:", error);
    
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <ErrorMessage>
          {error.message}
        </ErrorMessage>
      </main>
    );
  }



  // 履歴カードは「カード全体をクリックして詳細ページへ移動する」ため、単純に Link を Card へ置き換えることはしない

  // 以下のように役割を分ける
  // 外側の Link
  // - ページ移動を担当
  // 内側の Card
  // - 共通の見た目を担当


  // className="group block rounded-xl ..."
  // group
  // - 外側のリンクが hoverされたことを、内側の Cardへ伝える
  // block
  // - リンクをカード全体の大きさに広げる
  // rounded-xl
  // - フォーカスリングをカードと同じ角丸にする

  // focus-visible:ring-primary/30
  // - キーボードのTabキーで履歴カードを選択した時、エメラルド系のリングを表示する
  // マウス操作だけでなく、キーボード操作でも現在位置がわかるようにするため

  // group-hover:border-primary
  // - 外側のリンクへマウスを乗せると、内側のCardの枠線をエメラルド色にする

  // group-hover:shadow-md
  // - クリック可能なカードであることがわかるように、hover時だけ影を少し強くする
  // - 共通Card.tsx自体には、hoverを追加しない。
  // 通常のカードまでクリック可能に見えてしまうのを防ぐため

  // border-border
  // - カード内の区切り線も共通の枠線色へ統一する

  // min-w-0
  // - スマートフォンで栄養素名が長い場合に、文字が適切に縮んだり折り返しできるようにする

  // shrink-0
  // - 点数や矢印が狭い画面でつぶれないようにする




  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-muted">
          診断履歴
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          過去の診断結果
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          これまでの診断結果と、不足傾向が高い栄養素を確認できます。
        </p>
      </header>
      {/* マイページへ戻る導線(<LinkButton>...</LinkButton>)を置く */}
      {/*  
        LinkButton でページ遷移を可能にする
        - あらかじめ行き先が決まっている通常ページ移動のため LinkButton を使用する

        variant="text"
        - 「マイページへ」がこの画面の主要操作ではなく、補助的なページ移動のため
      */}
      <nav aria-label="履歴一覧の移動" className="mb-6">
        <LinkButton href="/mypage" variant="text">
          ← マイページへ
        </LinkButton>
      </nav>

      <h2 className="text-xl font-semibold text-foreground">
        診断履歴
      </h2>

      {/* 履歴が0件の場合の表示 */}
      {(!histories || histories.length === 0) && (
        <Card className="mt-4 text-center">
          <p className="text-sm text-muted">
            まだ診断履歴がありません。
          </p>
        </Card>
      )}

      {/* 履歴カード一覧を表示 */}
      {/* mapで1件ずつ履歴を表示 */}
      <div className="mt-4 space-y-3">
        {histories?.map((history) => (
          // 履歴一覧 → 詳細リンクに遷移
          <Link
            key={history.id}
            href={`/history/${history.id}`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Card className="transition group-hover:border-primary group-hover:shadow-md">
              <div className="flex items-center justify-between gap-4">
                {/* 日付表示 */}
                {/* データとして送られてきた日付を日本環境に対応した表示にする */}
                <p className="font-semibold text-foreground">
                  {new Date(history.createdAt).toLocaleDateString("ja-JP")}
                </p>

                <span
                  className="shrink-0 text-sm text-primary"
                  aria-hidden="true"
                >
                  →
                </span>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                {/* 不足傾向が高い上位3件の栄養素の表示 */}
                <h3 className="text-sm font-medium text-muted">
                  不足傾向が高い栄養素 上位3件
                </h3>

                <ul className="mt-3 space-y-2">
                  {history.lowNutrients.map((nutrient) => (
                    <li
                      key={nutrient.nutrientId}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="min-w-0 text-sm text-foreground">
                        {nutrient.nutrientName}
                      </span>

                      <span className="shrink-0 text-sm font-semibold text-foreground">
                        {nutrient.score}点
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}