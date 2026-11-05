// web/app/diagnosis/start/DiagnosisStartActions.tsx


// 【全体の概要】
// # 診断開始ページ
// # 診断開始画面の案内と操作を、現在の認証状態に応じて切り替える。
// # 未ログイン時はゲスト認証の入口を表示し、認証後は 既存のStartButton で診断を開始できるようにする


// 【役割】
// # 認証状態別の表示 と 未ログイン時のゲスト認証開始を担当する

// # 「ゲストで試す」
// - Supabase の匿名(ゲスト)認証を開始
// - ゲスト向け表示に切り替わる

// # 「診断を始める」
// - 別ファイルの StartButton が診断開始API を呼ぶ
// - 質問1へ移動



// 【ポイント】
// # ゲスト認証は、クリック時の signInAnonymously() で作成します。(Supabase公式の匿名ユーザー(ゲスト)作成処理を使用)
// # 操作時点の getSession() で既存session(認証情報) を取得できた場合、signInAnonymously() (匿名(ゲスト)ユーザー追加)を実行しない
// # 通常ユーザーをログアウトさせない。
// # token を画面・ログへ出力しない。
// # 認証成功後は、既存の共通hook によって表示を切り替える
// # 同じ画面のボタン連打を防ぐ。
// # 複数タブから同時に開始するケースまで排他制御するコードではない。
// # 送信済みの匿名(ゲスト)認証処理は、画面を離れたからといって取り消せるとは限りません。
// # アンマウント後の表示更新 と 匿名(ゲスト)認証の開始 を防ぐ構成
// - getSession() の完了前にアンマウントされた場合、その後の匿名(ゲスト)認証開始へ進まない。
// - 匿名(ゲスト)認証の完了後にアンマウント済みの場合、画面の状態を更新しない。
// - 診断作成は、このファイルではなく `StartButton.tsx` が担当する
// # GuestExitPanel は authStatus === "guest" の条件分岐の内側に置かない。
// - サインアウト(ログアウト) すると、認証状態がゲストから未ログインへ変わる。
// - 条件分岐の内側に置くと、終了処理の途中でコンポーネントが取り外され、成功後の画面遷移まで進めない可能性があるため
// # 現在の構成では終了用コンポーネントを維持しながら、終了処理中の診断開始操作を隠す。


// 【現在の構成】
// DiagnosisStartActions
// ├─ DiagnosisStartContent
// │  └─ これまで作った認証状態別の表示
// └─ GuestExitPanel
//    └─ ゲスト終了の操作




"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import LinkButton from "@/components/ui/LinkButton";
import StartButton from "./StartButton";
import GuestExitPanel from "@/components/auth/GuestExitPanel";

// # 認証状態を見て、表示する案内・ボタンを選ぶコンポーネント
export default function DiagnosisStartActions() {

  // # 診断開始画面にサインアウト(ログアウト)ボタン(GuestExitPanel.tsx)を組み込み、呼び出す
  // - GuestExitPanel が onBusyChange(true) を呼ぶと、親の isExitingGuest が true になり、診断開始部分が取り外される。
  // 終了パネル自体は残るため、サインアウトによって認証状態が変わっても、終了確認と画面遷移を続けられる。
  const [isExitingGuest, setIsExitingGuest] = useState(false);

  return (
    <div className="space-y-6">
      {!isExitingGuest && <DiagnosisStartContent />}

      <GuestExitPanel onBusyChange={setIsExitingGuest} />
    </div>
  )
}


// 認証状態に応じて、診断開始画面の操作・表示案内 を切り替える(診断開始ボタン or ゲストで試すボタンを表示する)コンポーネント
function DiagnosisStartContent() {
  // 認証状態を取得
  const { authStatus, errorMessage } = useSupabaseSession();

// ## 認証状態別の表示

  // # 認証状態を 確認中(loading) の表示
  if (authStatus === "loading") {
    return (
      <p role="status" className="text-sm text-muted">
        ユーザー情報を確認しています...
      </p>
    );
  }

  // # 認証状態確認が エラー(error) 時の表示
  if (authStatus === "error") {
    return (
      <div className="space-y-3">
        {/* 認証情報の取得エラー表示 */}
        <ErrorMessage>
          {errorMessage ?? "ユーザー情報の取得に失敗しました"}
        </ErrorMessage>

        {/* ページを再読み込み実行するボタン */}
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.location.reload()}
        >
          再読み込みして確認する
        </Button>
      </div>
    );
  }

  // # 認証状態が 未ログイン(signedOut) 時の表示
  // - 「ゲストで試す」(GuestStartButton) を表示する。
  if (authStatus === "signedOut") {
    return <GuestStartButton />;
  }

  // # 認証状態が ゲスト(guest) 時の表示
  if (authStatus === "guest") {
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm font-semibold text-primary">
          ゲストとして利用中です
        </p>

        <p className="text-sm text-muted">
          診断と今回の結果をお試しいただけます。<br />
          ゲスト利用中の診断結果は、新規登録後のアカウントには引き継がれません。
        </p>

        <p className="text-sm leading-6 text-muted">
          「診断を始める」を押すと、新しい診断を作成して質問1へ進みます。<br />
          再診断を開始すると、以前のゲスト診断の結果は閲覧できなくなります。
        </p>

        <StartButton />
      </div>
    );
  }

  // # 認証状態が 通常ユーザー(member) 時の表示
  // - ここまでの if条件 に当てはまらない認証状態は 通常ユーザーと扱う
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        「診断を始める」を押すと、質問1へ進みます。
      </p>

      <StartButton />
    </div>
  );
}

// #「ゲストで試す」が押されたときに匿名(ゲスト)認証を開始するコンポーネント
// - 認証状態が未ログインの時だけ表示する。
// - このコンポーネントでは、診断開始APIは呼び出さない。
function GuestStartButton() {

  // ## ゲスト開始ボタンの状態管理

  // # 匿名(ゲスト)認証を開始している最中かどうか管理
  const [isStarting, setIsStarting] = useState(false);
  // # ゲスト開始ボタンで発生したエラーメッセージを管理
  const [errorMessage, setErrorMessage] = useState("");

  // # 処理中かどうかを即座に書き換えれる値として保持
  // - state の反映を待たず、同じボタンの連打(処理の重複実行)を防ぐため
  // - useRef の値は ".current" で読み書きする
  const inFlightRef = useRef(false);

  // # コンポーネントが現在マウントされているかを保持
  // - アンマウント後に、古い処理で表示を更新しないため
  // - useRef の値は ".current" で読み書きする
  const isMountedRef = useRef(false);


  // # コンポーネントのマウント・アンマウントに合わせた処理を登録
  // - useLayoutEffect はブラウザーの再描画前に動くEffect です
  useLayoutEffect(() => {
    // # マウントされたため、処理結果を反映してよい状態(true)にする
    isMountedRef.current = true;

    return () => {
      // # アンマウント後の処理(状態更新・匿名(ゲスト)認証の開始)が、この ref を確認して中止できるようにする。
      isMountedRef.current = false;
    };
  }, []);

  // # クリック時に実行する非同期関数
  // - 成功時は 共通hook が認証状態の変更を受け取り、親コンポーネントがゲスト向け表示へ切り替わる。(signedOut → guest)
  // - このコンポーネントでは、診断作成や画面遷移は行わない。
  const handleStartGuest = async () => {
    // # すでにアンマウント or 処理中 の場合、実行を止める
    if (!isMountedRef.current || inFlightRef.current) {
      return;
    }

    // # 非同期処理を始める前に、処理中の印(状態を true にする)を付ける。
    inFlightRef.current = true;
    setIsStarting(true);
    // # 前回のエラーメッセージを削除
    setErrorMessage("");

    // # 例外が起きる可能性のある処理を try で行う
    try {
      // # ボタンを表示した時点の状態だけに限らず、操作時点の session をもう一度確認する。
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // # session 取得中にこのコンポーネントが取り外されている場合、処理中止する
      if (!isMountedRef.current) {
        return
      }

      // # session取得で エラー(sessionError) が返っている場合の処理
      if (sessionError) {
        // # 認証状態 の画面表示名を 「ユーザー情報」 とする
        setErrorMessage(
          "ユーザー情報を確認できませんでした。時間をおいて再度お試しください。"
        );
        return;
      }

      // # 既存session がある場合の処理
      // - ボタン表示後に別の場所でログインが完了した場合に、古い画面から匿名(ゲスト)認証を開始しないために必要
      if (session) {
        // # すでにゲスト・通常ユーザーの認証があれば作り直さない。
        // # 通常(認証イベントが届けば)は 共通hook の通知で表示が切り替わる。
        setErrorMessage(
          "すでにユーザー情報があります。画面が切り替わらない場合は再読み込みしてください。",
        );
        return;
      }

      // ## 匿名(ゲスト)認証・エラー処理

      // # 新しい匿名(ゲスト)ユーザーの作成 と 匿名(ゲスト)認証 を開始する
      const { data, error } = await supabase.auth.signInAnonymously();

      // # 匿名(ゲスト)認証中 にアンマウントされているか。どうか確認
      // # 条件を満たした場合、処理中止
      if (!isMountedRef.current) {
        return;
      }

      // # 返ってきた結果を、ゲスト開始成功として扱えるか確認する
      // # 以下の条件を満たした場合、処理中止
      // - error : Supabase からエラーが返った
      // - !data.session?.access_token : session or token が無い
      // - data.session.user.is_anonymous !== true : 匿名(ゲスト)ユーザーであることを確認できない
      if (error || !data.session?.access_token || data.session.user.is_anonymous !== true) {
        setErrorMessage(
          "ゲスト利用を開始できませんでした。時間をおいて再度お試しください。",
        );
        return;
      }

      // # try内で例外が発生した場合の処理
    } catch {
      // # まだマウントされている時だけエラー表示更新する
      if (isMountedRef.current) {
        setErrorMessage(
          "ゲスト利用の開始中にエラーが発生しました。再度お試しください。",
        );
      }
      // # 成功・失敗 に関わらず行う処理
    } finally {
      // # 処理中状態のref を解除する(falseにする)
      inFlightRef.current = false;

      // # まだマウントされているか確認する
      // # 条件を満たす場合、匿名(ゲスト)認証中の状態を解除する
      if (isMountedRef.current) {
        setIsStarting(false);
      }
    }
  };

  // ## 未ログイン時の表示画面

  // # 案内 と ゲスト開始ボタン
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        登録せずに診断と今回の結果をお試しいただけます。<br />
        ゲスト利用中の診断結果は、新規登録後のアカウントには引き継がれません。
      </p>

      {/* # ゲスト開始ボタン */}
      <Button
        type="button"
        onClick={handleStartGuest}
        disabled={isStarting}
        className="w-full"
      >
        {isStarting ? "読み込み中..." : "ゲストで試す"}
      </Button>

      {/* エラー表示 */}
      {errorMessage && (
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>
      )}

      {/* ログイン・新規登録リンク */}
      {/* ゲスト開始処理中ではない場合だけ、ログイン・新規登録リンクを表示する */}
      {!isStarting && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton
            href="/login"
            variant="secondary"
            className="flex-1"
          >
            ログイン
          </LinkButton>

          <LinkButton
            href="/signup"
            variant="secondary"
            className="flex-1"
          >
            アカウントを作成する
          </LinkButton>
        </div>
      )}
    </div>
  );
}
