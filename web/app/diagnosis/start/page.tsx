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



import StartButton from "./StartButton";
import Card from "@/components/ui/Card";
import LinkButton from "@/components/ui/LinkButton";

export default function DiagnosisStartPage() {
  return (

    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-xl">
        {/* ページ説明部分 */}
        <header>
          <p className="text-sm text-muted">
            栄養診断
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            診断を始める
          </h1>

          <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
            生活習慣や体調についての質問に答えて、栄養素の傾向を確認します。
          </p>
        </header>


        {/* 診断開始という1つのまとまりのカードとして表示 */}
        <section className="mt-8">
          <Card>
            <h2 className="text-lg font-semibold text-foreground">
              栄養診断を開始する
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted">
              ボタンを押すと質問1へ進みます。
            </p>

            <div className="mt-4">
              <StartButton />
            </div>
          </Card>
        </section>

        <div className="mt-6 text-center">
          {/* トップページ(/)への遷移リンク */}
          <LinkButton
            href="/"
            variant="text"
          >
            トップページへ戻る
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
