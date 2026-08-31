// web/components/ui/PageLoading.tsx

// 全体の概要
// - ページ全体でデータを読み込み中の時に表示する共通コンポーネント


// ポイント
// message
// - 画面ごとに表示したい文章を受け取るので
// 画面ごとに文章を変更できる

// message = "読み込み中..."
// - message が未指定なら「読み込み中...」を表示する

// aria-busy="true"
// - このページは現在、データを読み込み中だと補助技術へ伝える

// role="status"
// - 読み込み状態のメッセージだと補助技術へ伝える


// 使用例.
{/*
  履歴一覧ページでは以下のように使用している。

  <PageLoading message="ログイン情報を確認中です..."/>
  <PageLoading message="履歴一覧を読み込み中です..."/>
*/}



// このファイル内の流れ
// 各ページ
//   ↓
// isLoading / isSessionLoading / isHistoryLoading を確認
//   ↓
// true の場合
// <PageLoading /> を返す
//   ↓
// PageLoading.tsx
//   ↓
// 指定した message と spinner を表示
//   ↓
// message 未指定なら「読み込み中...」を表示
//   ↓
// データ取得完了
//   ↓
// 通常ページを表示

type PageLoadingProps = {
  message?: string;
};

export function PageLoading({
  message = "読み込み中...",
}: PageLoadingProps) {
  return (

    // aria-busy="true"
    // - 「この領域は現在処理中です。」と定義

    // <div className="flex flex-col items-center gap-3">...</div>
    // - この div は 「spinner ＋ message」 を1セットとして管理するための箱

    // spinner
    // - 回転する見た目のローディング表示

    // aria-hidden="true"
    // - spinnerは、見た目だけであり、支援技術には読み込ませない と定義

    // border-border
    // - 回転する円の薄い部分
    // - カードや入力欄と同じ共通の枠線色を使用する

    // border-t-primary
    // - 円の上側だけエメラルド色にする
    // animate-spin で回転すると、エメラルド部分が回っているように見える

    // text-muted
    // - 「読み込み中...」を補助説明用の文字色にする
    <main
      className="flex min-h-64 items-center justify-center px-4 py-8"
      aria-busy="true"
    >
      {/* 「spinner ＋ message」 を1セットとして管理するための箱 */}
      <div className="flex flex-col items-center gap-3">
        {/* spinner・ローディング表示 */}
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden="true"
        />
        {/* 読み込み状態を伝えるための表示message */}
        <p role="status" className="text-sm text-muted">
          {message}
        </p>
      </div>
    </main>
  );
}
