// web/app/page.tsx


// 全体の概要
// - 栄養診断アプリが何をするサービスなのかを説明し、診断・ログイン・新規登録へ案内するページ

// 役割
// - 診断紹介
// - 説明を表示・リンクを表示
// - 何のアプリ?・何ができる?・どこを押す? を案内する

// Server
// ↓
// HTMLを用意
// ↓
// ユーザーへ表示






// ポイント
// - ブラウザで動く処理が必要ないので Server Component とする。
// (useState・useEffect・useRouter・onClickを使ったクライアント処理・
// ブラウザAPI・Supabaseのクライアント側認証フック を使用しないため)
// - トップページでは、DB取得なし・API通信なし・認証確認なし・stateなし





// このファイル内の流れ


// トップページ
//   │
//   ├─ SiteHeader
//   │    ├─ トップ
//   │    ├─ 診断開始
//   │    ├─ 使い方
//   │    ├─ ログイン
//   │    └─ 新規登録
//   │
//   ├─ ヒーロー
//   │    ├─ アプリ説明
//   │    ├─ 診断開始ボタン
//   │    ├─ ログインボタン
//   │    └─ 診断結果の表示イメージ
//   │
//   ├─ WHAT YOU CAN DO
//   │    └─ 3つの機能カード
//   │
//   ├─ 診断開始CTA
//   │
//   └─ SiteFooter


// ユーザー
//   ↓
// localhost:3000/
//   ↓
// Home
// Server Component
//   ↓
// 栄養診断の説明
//   │
//   ├──── 診断を始める
//   │          ↓
//   │    /diagnosis/start
//   │          ↓
//   │     StartButton
//   │     Client Component
//   │          ↓
//   │      token確認
//   │          ↓
//   │      API呼び出し
//   │
//   ├──── ログイン
//   │          ↓
//   │       /login
//   │
//   └──── 新規登録
//              ↓
//           /signup


// トップページで使用するアイコンを import する
// - Leaf
// ヒーロー上部のラベル
// - ArrowRight
// 診断開始ボタン
// - BarChart3
// 栄養バランスの可視化
// - BookOpen
// 不足栄養素の確認
// - Sparkles
// 食品・生活習慣の提案
// - Utensils
// 最下部の診断案内


import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Leaf,
  Sparkles,
  Utensils,
} from "lucide-react";


import LinkButton from "@/components/ui/LinkButton";
import Card from "@/components/ui/Card";
import SiteFooter from "@/components/ui/layout/SiteFooter";
import SiteHeader from "@/components/ui/layout/SiteHeader";
import DiagnosisResultPreview from "@/components/ui/DiagnosisResultPreview";


// WHAT YOU CAN DO の表示データを定義
const features = [
  {
    icon: BarChart3,
    number: "01",
    title: "栄養バランスを可視化",
    description: "レーダーチャートで、栄養素ごとの診断結果をわかりやすく確認できます。",
  },
  {
    icon: BookOpen,
    number: "02",
    title: "不足傾向の栄養素を確認",
    description: "不足傾向が高い栄養素をランキング形式で確認できます。",
  },
  {
    icon: Sparkles,
    number: "03",
    title: "食品・料理・生活習慣を提案",
    description: "診断結果に合わせて、食品や料理、生活習慣のヒントを確認できます。",
  },
];



export default function Home() {
  return (
    // min-h-screen
    // - 内容が少ない場合でも、ページを画面の高さまで広げる
    // flex flex-col
    // - ヘッダー・メイン・フッター を縦方向で並べる
    // flex-1
    // - メイン部分を伸ばして、フッターが不自然に上へ上がらないようにする
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/*
        relative overflow-hidden
        - 背景のぼかし装飾が、セクションの外へはみ出さないようにする
        aria-hidden="true"
        - 背景装飾には情報がないため、スクリーンリーダーに読み上げさせない
        max-w-6xl
        - PCで内容が横へ広がりすぎるのを防ぐ
        lg:grid-cols-[1.1fr_0.9fr]
        - PC では「左側の説明 + 右側のイメージ」という2列構成にする
        - PCでは左側の説明を少し広くする
        - 320pxではこの指定を適用させず、自動的に1列にする
      */}
      <main className="flex-1">
        {/* ヒーロー */}
        {/* 2列構成(左側の説明 + 右側のイメージ) */}
        {/* 320px では縦並び、広い画面では横並びで左側・右側 として表示する */}
        <section className="relative overflow-hidden border-b border-border bg-surface">
          <div
            aria-hidden="true"
            className="absolute -right-20 top-8 size-72 rounded-full bg-primary-light blur-3xl"
          />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">

            {/* 左側:アプリの説明文 と 遷移ボタン(診断開始ページ・ログインページ) */}
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-2 text-xs font-semibold tracking-widest text-primary-hover">
                <Leaf
                  aria-hidden="true"
                  className="size-4"
                />
                PERSONAL NUTRITION CHECK
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
                あなたの食生活を見直して
                <br />
                <span className="text-primary">
                  理想のカラダづくり
                </span>
                <br />
                をサポート
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
                生活習慣や体調についての質問に答えることで、栄養素の傾向やおすすめの食品・料理を確認できます。
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {/* 診断開始ページへの遷移ボタン */}
                <LinkButton
                  href="/diagnosis/start"
                  variant="primary"
                  className="w-full gap-2 sm:w-auto"
                >
                  診断を始める
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4"
                  />
                </LinkButton>

                {/* ログインページへの遷移ボタン */}
                <LinkButton
                  href="/login"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  ログインして続ける
                </LinkButton>
              </div>
            </div>



            {/* 右側: 診断結果のサンプル表示(実際の診断結果に近い縮小イメージ) */}
            <DiagnosisResultPreview />
          </div>
        </section>








        {/* WHAT YOU CAN DO */}


        {/*
          scroll-mt-20
          - 固定ヘッダーの後ろに見出しが隠れないようにする指定

          md:grid-cols-3
          - 狭い画面では1列、PCでは3列で表示する指定
         */}
        <section
          id="what-you-can-do"
          aria-labelledby="features-heading"
          className="scroll-mt-20 border-y border-border bg-background px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-primary-hover">
                  WHAT YOU CAN DO
                </p>

                <h2
                  id="features-heading"
                  className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  毎日の食事をもっと味方に。
                </h2>
              </div>

              <p className="text-sm text-muted">
                診断から改善まで、ひとつの場所で
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map(({icon:Icon, number, title, description}) => (
                <Card
                  key={number}
                  className="h-full"
                >
                  {/* アイコン・番号・タイトル・説明 */}
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-primary-light text-primary">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>

                    <span
                      aria-hidden="true"
                      className="font-mono text-xs text-border"
                    >
                      {number}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-foreground">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>




        {/* 診断開始CTA */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="grid size-12 place-items-center rounded-xl bg-primary-light text-primary">
              <Utensils aria-hidden="true" className="size-6" />
            </span>

            <div>
              <h2 className="text-lg font-bold text-foreground">
                まずは、いつもの生活習慣を振り返るところから。
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted">
                生活習慣や体調についての質問に順番に答えて、
                現在の栄養素の傾向を確認します。
              </p>
            </div>

            <LinkButton
              href="/diagnosis/start"
              variant="secondary"
              className="w-full gap-2 md:w-auto"
            >
              診断を始める
              <ArrowRight aria-hidden="true" className="size-4" />
            </LinkButton>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
