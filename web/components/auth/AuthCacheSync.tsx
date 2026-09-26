// web/components/auth/AuthCacheSync.tsx

// 全体の概要
// - 認証変更時のキャッシュ整理(古いtoken に 対応するSWRデータ を使わせない)をページをまたいでも実行するコンポーネント




// ポイント
// - このファイルは、SWR内の 古いtoken の 取得済みデータ を使わせないための整理を行う。
// ブラウザで動くファイル
// ブラウザ内のすべての情報を完全消去する処理ではない。
// - キャッシュ整理
// 以前取得したデータを、別の認証状態で表示しないための処理
// - このファイルのみに安全性を依存せず、キー分離と各画面の表示制御を併用します。
// - 古いtokenに対応するデータだけが対象
// - 新しくログインしたアカウントのキャッシュには触れない
// - revalidate: false により、消した直後に古い認証情報で再取得しない
// - localStorage.clear() は使用しない
// - DBの履歴は削除しない



"use client"


import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { useEffect, useRef } from "react";
import { useSWRConfig } from "swr";



// 指定された古いtoken に属する、診断関連のSWRキーかどうかを判定する
function isDiagnosisCacheForToken(
  key: unknown,
  previousToken: string,
): boolean {
  if (!Array.isArray(key) || key.length !== 2) {
    return false;
  }

  const [resource, keyToken] = key;

  if (keyToken !== previousToken || typeof resource !== "string") {
    return false;
  }

  return (
    resource === "diagnosis-history" || /^\/api\/diagnosis\/[^/]+\/result$/.test(resource)
  );
}

export default function AuthCacheSync() {
  const { token, isLoading } = useSupabaseSession();
  const { mutate } = useSWRConfig();

  const previousTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const previousToken = previousTokenRef.current;
    previousTokenRef.current = token;

    // 初回のページ表示や、token に変化がない場合は何もしない
    if (!previousToken || previousToken === token) {
      return;
    }

    // 新しいtoken のキャッシュには触れず、古いtoken のデータだけ消す
    // - SWR の mutate は、条件に一致するデータを更新できる
    // - 今回は、undefined に更新し、再取得しない設定とする
    void mutate(
      (key) => isDiagnosisCacheForToken(key, previousToken),
      undefined,
      { revalidate: false },
    ).catch(() => {
      // token や キャッシュ の中身はログに出さない
      console.error("診断データのキャッシュ整理に失敗しました");
    });
  }, [token, isLoading, mutate]);

  return null;
}
