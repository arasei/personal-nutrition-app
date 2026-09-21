// web/app/mypage/page.tsx

// 全体の概要
// - ログイン後の遷移先となるマイページ
// - 「診断を始める」・「履歴を見る」 のボタン と リンク から 診断開始ページ(`web/app/diagnosis/start/page.tsx`) or 履歴一覧ページ(`web/app/history/page.tsx`) へ遷移可能 なページ



// ポイント
// - ログイン中ユーザーだけが表示できるように、Supabase session を確認する
// - 未ログインの場合は /login に遷移する
// - /mypage から診断開始と履歴一覧へ遷移できる



// このページの役割
// - ログイン状態を確認する
// - 未ログインなら /login に戻す
// - ログイン済みならマイページメニューを表示する
// - 診断開始ボタンを表示する
// - 履歴一覧へのリンクを表示する 
// - ログアウト処理を実行し、成功後にトップページへ遷移する




// このファイル内の流れ
// /login
//   ↓
// ログイン成功
//   ↓
// router.push で /mypageへ遷移
//   ↓
// /mypage
//   ↓
// Supabase から現在の session を取得
//   ↓
// session から access_token を確認
//   ↓
// token が無い場合 → /login に遷移
//   ↓
// token がある場合 → マイページを表示
//   ↓
// 診断開始ボタン・履歴リンクを表示
//   ├─ 診断を始める → 診断開始API(/diagnosis/start) → 質問ページ(/diagnosis/step/1)
//   └─ 履歴を見る   → /history








"use client";

import StartButton from "@/app/diagnosis/start/StartButton";
import { useRouter } from "next/navigation";
import LinkButton from "@/components/ui/LinkButton";
import { PageLoading } from "@/components/ui/PageLoading";
import Card from "@/components/ui/Card";
import { useSupabaseSession } from "../_hooks/useSupabaseSession";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { supabase } from "@/lib/supabase/client";

export default function Mypage() {
  const router = useRouter();

  // ログイン状態をuseSupabaseSession から取得
  const {
    token,
    isLoading: isSessionLoading,
  } = useSupabaseSession();

  // 画面を処理中表示に切り替えるためのstate
  // - true の間は、マイページ内の本文・ボタンを無効ではなく ボタンを含む本文を処理中表示(PageLoading) を表示する
  // - ログアウト処理開始後に新たに「診断を始める」「履歴を見る」を押すことも防ぐ。
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ログアウト失敗時の表示
  const [logoutError, setLogoutError] = useState("");

  // 処理の連続実行 と リダイレクトの競合 を防ぐためのフラグ
  // - すでに開始済みの通信を取り消す処理ではない。
  const logoutInProgressRef = useRef(false);

  // ページを離れた後に、状態更新や画面遷移 を防ぐためのフラグ
  // - ログアウト通信中にユーザーが別ページへ移動した場合、遅れて完了した処理で再びトップへ移動させないようにする。
  // - 画面側の後続処理を止める仕組み。すでに送信したログアウト自体をキャンセルするものではない。
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);


  // 認証確認が終わり、利用できるトークンがない場合は、ログインページ(/login)へ遷移する
  // - 通常の未ログイン時はログインページ(/login)へ遷移する
  // - マイページ(/mypage)でログアウト処理中の場合は、通常　の未ログインリダイレクト処理を止める
  // - ログアウト成功後のトップページ(/)への遷移は、handleLogout で行う
  useEffect(() => {
    if (isSessionLoading || isLoggingOut || logoutInProgressRef.current) {
      return;
    }

    if (!token) {
      router.replace("/login");
    }
  }, [isSessionLoading, isLoggingOut, token, router]);


  const handleLogout = async () => {
    // 連打や認証情報がない状態での実行を防ぐ
    if (logoutInProgressRef.current || isSessionLoading || !token) {
      return;
    }

    logoutInProgressRef.current = true;
    setIsLoggingOut(true);
    setLogoutError("");

    try {
      // 現在の session をログアウトする
      // - アカウント や 診断データの削除は行わない。
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      // ログアウト処理(signOut)失敗として Supabase から error が返された場合、例外として投げて catch で扱う
      if (error) {
        throw error;
      }

      // 通信中にページを離れていた場合は、遷移しない
      if (!isMountedRef.current) {
        return;
      }

      // ログアウト処理(signOut)成功時は処理中状態を維持してトップページ(/)へ遷移する
      // - ここで解除すると、/login への遷移と競合する可能性があるため
      router.replace("/");
    // ログアウト失敗時はトップページへ遷移せず、処理中状態を解除する
    // - Supabaseから返された error と、例外として発生した失敗を catch で扱う。
    // - ただし、その時点ですでに session がなくなっていれば、共通フックの状態に従って /login へ移動します。
    } catch {
      if (!isMountedRef.current) {
        return;
      }

      setLogoutError("ログアウトに失敗しました。時間をおいて再度お試しください。");

      // 失敗時だけ解除し、session が残っていれば再試行できようにする
      logoutInProgressRef.current = false;
      setIsLoggingOut(false);
    }
  };

  // 初回のログイン確認中のローディング表示
  // - session 確認中はマイページ本体を表示しない
  if (isSessionLoading) {
    return <PageLoading />;
  }

  // ログアウト処理開始後は、token がなくなる前から本文を隠して追加操作(連打など)を防ぐ
  if (isLoggingOut) {
    return <PageLoading />;
  }

  // ページ遷移が完了するまでの間も、本文を表示しない
  if (!token) {
    return <PageLoading />;
  }

  // マイページ の 内容を表示する箱の幅 を ログイン・新規登録画面と同じ幅に制限する
  // - max-w-md: 最大幅 を 約448px に制限している
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium text-muted">
          Nutriflecta
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          マイページ
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted">
          栄養診断を始めたり、これまでの診断結果を確認できます。
        </p>
      </header>

      {/* 診断開始ページへ案内カード */}
      <section className="mt-8">
        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            栄養診断
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            現在の生活習慣から、栄養素の傾向を確認できます。
          </p>

          {/* 診断開始ボタン */}
          <div className="mt-5">
            <StartButton />
          </div>
        </Card>
      </section>

      {/* 履歴ページへ案内カード */}
      <section className="mt-4">
        <Card>
          <h2 className="text-lg font-semibold text-foreground">
            診断履歴
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted">
            過去の診断結果や、前回からの変化を確認できます。
          </p>

          {/* 履歴一覧ページ(`web/app/history/page.tsx`) へ 遷移するためのリンク<LinkButton>...</LinkButton> */}
          <div className="mt-5">
            <LinkButton
              href="/history"
              variant="secondary"
              className="w-full"
            >
              履歴を見る
            </LinkButton>
          </div>
        </Card>
      </section>

      {/* ログアウトボタン */}
      <div className="mt-8 space-y-3 border-t border-border pt-6">
        {logoutError && (
          <ErrorMessage id="logout-error">
            {logoutError}
          </ErrorMessage>
        )}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={handleLogout}
          aria-describedby={logoutError ? "logout-error" : undefined}
        >
          ログアウト
        </Button>
      </div>
    </main>
  );
}
