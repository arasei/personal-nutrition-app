// web/app/diagnosis/start/page.tsx

// 全体の概要
// - 診断開始ページ
// - 診断開始ページ(web/app/diagnosis/start/page.tsx)を表示するだけ



// 役割
// - 診断開始ページを表示
// - 「診断を始める」ボタンを表示する



// ポイント
// - `web/app/diagnosis/start/page.tsx` は、Server Component とする。
// 表示・Link・StartButton配置だけ の役割のため


// このファイル内の流れ

// /diagnosis/start
//       ↓
// 説明表示
//       ↓
// StartButton
//       ↓
// 認証確認
//       ↓
// 診断作成API



import Link from "next/link";
import StartButton from "./StartButton";

export default function DiagnosisStartPage() {
  return (

    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-xl">
        {/* ページ説明部分 */}
        <header>
          <p className="text-sm text-gray-500">
            栄養診断
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
            診断を始める
          </h1>

          <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
            生活習慣や体調についての質問に答えて、栄養素の傾向を確認します。
          </p>
        </header>


        {/* 診断開始という1つのまとまりのカードとして表示 */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">

          <h2 text-lg font-semibold text-gray-900>
            栄養診断を開始する
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            ボタンを押すと質問1へ進みます。
          </p>

          <div className="mt-4">
            <StartButton />
          </div>
        </section>

        <div className="mt-6 text-center">
          {/* トップページ(/)への遷移リンク */}
          <Link
            href="/"
            className="text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900"
          >
            トップページへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
