// web/components/ui/PageLoading.tsx

// 全体の概要
// - ページ全体でデータを読み込み中の時に表示する共通コンポーネント


// ポイント
// - message
// → 画面ごとに表示したい文章を受け取る

// - message = "読み込み中..."
// → message が未指定なら「読み込み中...」を表示する

// - aria-busy="true"
// → このページは現在、データを読み込み中だと補助技術へ伝える

// - role="status"
// → 読み込み状態のメッセージだと補助技術へ伝える

type PageLoadingProps = {
  message?: string;
};

export function PageLoading({
  message = "読み込み中...",
}: PageLoadingProps) {
  return (
    <main style={{ padding: 24 }} aria-busy="true">
      <p role="status">{message}</p>
    </main>
  );
}