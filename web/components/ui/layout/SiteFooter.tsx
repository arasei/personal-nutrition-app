// web/components/ui/layout/SiteFooter.tsx

// 全体の概要
// - ページの共通フッター

// new Date().getFullYear()
// - 現在の西暦を自動取得する
// - 年が変わるたびにコードを書き換える必要がないため

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} 栄養診断アプリ
        </p>
      </div>
    </footer>
  );
}