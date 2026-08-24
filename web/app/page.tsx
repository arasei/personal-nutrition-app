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
// - ブラウザで動く処理が必要ないので Sever Component
// (useState・useEffect・useRouter・onClickを使ったクライアント処理・
// ブラウザAPI・Supabaseのクライアント側認証フック を使用しないため)
// - トップページでは、DBアクセスなし・APIアクセスなし・認証確認なし・stateなし





// このファイル内の流れ

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


import LinkButton from "@/components/ui/LinkButton";
import Card from "@/components/ui/Card";


export default function Home() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/*
        max-w-xl
        - 最大幅を制限
        - max-w-xl をもう一段入れる理由
        <main>...</main> の max-w-4xl はページ全体の基準幅として設定し、
        <div>...</div> の max-w-xl は文章・カード の幅 を少し狭めに統一させて読みやすくする
      */}
      <div className="mx-auto max-w-xl">
        {/* ページ見出し */}
        <header>
          <p className="text-sm text-gray-500">
            栄養診断
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            毎日の生活習慣から
            <br className="hidden sm:block"/>
            栄養素の傾向を確認
          </h1>

          <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
            生活習慣や体調についての質問に答えることで、
            栄養素の傾向やおすすめの食品・料理を確認できます。
          </p>
        </header>

        {/* 診断開始 */}
        <section className="mt-8">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900">
              栄養診断を始める
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              質問に答えて、現在の栄養素の傾向を確認してみましょう。
            </p>

            {/*
              診断開始ページ(web/app/diagnosis/start/page.tsx) への遷移リンク
              - ここで直接診断API は呼ばない
            */}
            <div className="mt-4">
              <LinkButton
                href="/diagnosis/start"
                className="w-full"
              >
                診断を始める
              </LinkButton>
            </div>
          </Card>
        </section>

        {/* アカウント */}
        <section className="mt-6">
          <Card>
            <h2 className="text-lg font-semibold text-gray-900">
              アカウント
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              診断結果や履歴を確認するには、ログインまたは新規登録をしてください。
            </p>

            <div className="mt-4 space-y-3">
              {/* ログインリンクボタン */}
              <LinkButton
                href="/login"
                variant="secondary"
                className="w-full"
              >
                ログイン
              </LinkButton>

              {/* 新規登録リンクボタン */}
              <LinkButton
                href="/signup"
                variant="secondary"
                className="w-full"
              >
                新規登録
              </LinkButton>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}