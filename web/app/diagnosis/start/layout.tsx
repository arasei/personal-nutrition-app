// web/app/diagnosis/start/layout.tsx



// 全体の概要
// - 診断開始ページに診断用ヘッダーを表示する。



// ポイント
// - 診断用ヘッダーとページ内容の配置のみを担当し、認証機能は持たない。
// - ログイン状態の確認 と 診断開始処理 は既存ページ側(StartButton)で行う
// - データへのアクセス権限の確認は既存API側で行う


// children に渡される、React で表示できる内容の型を読み込む
import type { ReactNode } from "react";
// 共通ヘッダーを読み込む
import SiteHeader from "@/components/ui/layout/SiteHeader";



// 受け取る children(既存ページ内容) の型を定義
type DiagnosisStartLayoutProps = {
  children: ReactNode;
};



// ヘッダーの下の領域に Children(既存ページ内容) を表示
export default function DiagnosisStartLayout({
  children,
}: DiagnosisStartLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader variant="diagnosis" />

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
