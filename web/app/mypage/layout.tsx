// web/app/mypage/layout.tsx


// 全体の概要
// - マイページを会員専用共通ヘッダー と一緒に表示するレイアウト



// ポイント
// - 会員ページ向けの見た目を表示するものであり、認証機能ではない。
// - ログイン状態を確認している間(認証)や、未ログインでログインページへ遷移する直前にも表示される
// - このレイアウトはヘッダーとページの配置のみを担当する
// - ログイン状態の確認とデータ取得は既存ページ側で行う
// - データへのアクセス権限の確認は既存API側で行う

// children に渡される、React で表示できる内容の型を読み込む
import type { ReactNode } from "react";
// 共通ヘッダーを読み込む
import SiteHeader from "@/components/ui/layout/SiteHeader";

// 受け取る children(既存ページ内容) の型を定義
type MypageLayoutProps = {
  children: ReactNode;
};


// ヘッダーの下の領域に Children(既存ページ内容) を表示
export default function MypageLayout({
  children,
}: MypageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 会員向けのヘッダー表示 */}
      <SiteHeader variant="member" />

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
