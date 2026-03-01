//web/app/diagnosis/start/StartButton.tsx
//診断開始ボタンコンポーネント

//遷移するだけであればuseRouterで良いが、
// 条件付き(DB操作・サーバー側で条件判定可能・認証・権限チェックができる・ロジックが安全)で遷移したい場合は、
// form + Server Actionを使う
// そのため、useRouterを削除し、formで囲み、buttonのtypeをsubmitにする設計に変更


import { startDiagnosis } from "./StartAction";

export default function StartButton() {
  return (
    //formで囲み、buttonのtypeをsubmitにする設計に変更
    <form action={startDiagnosis}>
      <button
      type="submit"
      style={{
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid #ccc",
        cursor: "pointer",
      }}>
        診断を始める
      </button>
    </form>
  );
}