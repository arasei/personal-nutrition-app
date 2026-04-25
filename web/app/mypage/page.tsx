// web/app/mypage/page.tsx

// ログイン後の遷移先 mypage/page.tsx 追加

// マイページから他ページへ遷移するためのリンクを設置
// ログイン後は/mypageへ遷移
// /mypage から診断開始へ遷移可能
// /mypageから履歴一覧へ遷移可能
// 現在は入力もstateも無いのでServer Component仕様



// 流れ
// /login
//   ↓
// ログイン成功
//   ↓
// router.push で /mypageへ遷移
//   ↓
// /mypage
//   ├─ 診断を始める → /diagnosis/start
//   └─ 履歴を見る   → /history






// Next.jsのページ遷移リンクを読み込み
import Link from "next/link";

export default function Mypage() {
  return (
    <main>
      <h1>マイページ</h1>

      <p>メニュー</p>
      <div>
        <Link href="/diagnosis/start">診断を始める</Link>
      </div>

      <div>
        <Link href="/history">履歴を見る</Link>
      </div>
    </main>
  )
}