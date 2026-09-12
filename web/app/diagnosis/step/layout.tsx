// web/app/diagnosis/step/layout.tsx



// 全体の概要
// - 診断質問ページに診断用ヘッダーを表示する
// - 質問ページを Suspense で囲み、描画待機中の表示を用意する





// ポイント
// - 診断用ヘッダー と ページ内容の配置を担当し、認証機能は持たない。
// - このレイアウトはヘッダーとページの配置のみを担当する
// - ログイン確認と質問データ取得は既存の質問ページ側で行う
// - データへのアクセス権限の確認は既存API側で行う
// API通信中の表示は、既存ページの isLoading で管理する
// このファイル内の PageLoading は useSearchParams() による描画の待機状態を表している
// - SiteHeader は Suspense の外側にあるため、内側が待機表示に切り替わっても、ヘッダーはその切り替え対象にならない。



// children に渡される、React で表示できる内容の型を読み込む
import { Suspense, type ReactNode } from "react";
// 共通ヘッダーを読み込む
import SiteHeader from "@/components/ui/layout/SiteHeader";
import { PageLoading } from "@/components/ui/PageLoading";




// 受け取る children(既存ページ内容) の型を定義
type DiagnosisStepLayoutProps = {
  children: ReactNode;
};


// Suspense を追加する理由
// - 質問側では useSearchParams() を使用しているため、その描画を受け止める境界を用意しています。
// API通信があるから、という理由ではありません。


// <Suspense>...</Suspense>
// - 内側のコンポーネントが、Suspense に対応した仕組みによって描画を一時停止した場合、その待機を受け止める境界
// - 全ての非同期処理を自動的に待ってくれるものではない

// fallback={...}
// - 内側をまだ表示できないとき、代わりに表示する内容


// <PageLoading message="..."/>
// - useSearchParams() による描画の待機状態を表している



// ヘッダーの下の領域に Children(既存ページ内容) を表示
export default function DiagnosisStepLayout({
  children,
}: DiagnosisStepLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader variant="diagnosis" />

      <div className="flex-1">
        <Suspense
          fallback={<PageLoading message="診断画面を読み込み中..." />}
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
