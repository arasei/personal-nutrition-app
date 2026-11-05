// web/components/auth/GuestExitPanel.tsx

// 【全体の概要】
// # ゲスト利用終了用の共通コンポーネント


// 【役割】
// # 診断開始画面からゲスト利用を終了する
// # ゲスト終了の注意文とボタンを表示する
// # 利用者にゲスト利用終了の意思を確認する
// # 操作対象が同じゲストであることを再確認する
// # 現在のsession を終了する
// # 終了を確認できたらトップページへ移動する
// # 確認できなければエラーを表示する



// 【ポイント】
// # ゲスト終了(サインアウト)直前のユーザー確認
// # 連打防止
// # 画面離脱後の処理停止
// # 成功時と失敗時の表示の分離
// # 診断開始ボタンは隠す処理はしない
// - 診断開始ボタンを隠すのは親コンポーネントの担当


// 【親コンポーネントでの呼び出し、連携条件・注意】
// - このコンポーネントを、guest状態の条件分岐だけで取り外さない。
// - onBusyChange(true)を受け取った親が、周囲の操作を抑止する。
// - 成功時は画面遷移まで処理中状態を維持し、失敗時だけ解除する。

// 【親コンポーネントとの制約】
// - マウント状態の確認は、送信済みのサインアウト要求を取り消さない。
// - 操作直前にユーザーを確認するが、別タブとの完全な排他制御ではない。
// - アプリDBのデータ削除や、発行済みトークンの即時失効を保証しない。




// 【このコンポーネントの担当範囲外】
// - アプリDB上のユーザー・診断データの削除
// - currentGuestDiagnosisId の削除・更新
// - localStorage.clear() による、現在のオリジン(http://localhost:3000) の localStorageの保存データを一括削除する。
// 認証情報以外の保存済みデータを消す可能性があるため、この操作は行わない。
// - ゲスト終了(サインアウト)後に、通常ユーザーへの自動切り替え、ログイン
// - ゲスト終了時に自動的な新ゲスト再作成





// 【ゲスト終了時の動作の流れ】

// # ゲスト終了(サインアウト)すると今回の結果に戻れない旨を確認する
// ↓
// # ゲスト終了(サインアウト)処理中状態にし、親コンポーネントへ通知して診断開始などの操作を隠す。
// ↓
// # ゲスト終了(サインアウト)操作処理中 の 現在のsession が操作開始時点と同じゲストか確認する
// ↓
// # scope: "local" でゲスト終了(サインアウト)する
// ↓
// # このクライアントにsession が残っていないか確認する
// - 成功時 : ゲスト終了(サインアウト)に成功したらゲスト終了(サインアウト)処理中表示を画面遷移まで維持したままトップページ(/)へ遷移する
// - 失敗時 : エラーを表示し、ゲスト終了(サインアウト)処理中状態を解除する。成功扱いにしない


"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";

// ## 受け取る値 と 状態管理

// # このコンポーネントが受け取る値の型 を定義
// - onBusyChange 自体には、画面を隠す機能はない。
// 親コンポーネントから渡された関数を呼び出している
// - busy : 引数の名前
// - boolean : true または false
// - => void : 呼び出し側が戻り値を利用しない関数
// # 以下の通知に使用する
// - onBusyChange(true); // ゲスト終了(サインアウト)処理が始まった
// - onBusyChange(false); // 失敗して処理中状態を解除した

type GuestExitPanelProps = {
  onBusyChange: (busy: boolean) => void;
};

// ## コンポーネント と 状態

// # このコンポーネントで、似ているようで異なる以下の3つの値を使用している
// 値 : 担当
// - isExiting : このパネルを「ゲストを終了しています」の表示へ切り替える
// - inFlightRef.current : 再描画を待たずに連打を止める
// - 親コンポーネントの isExitingGuest : 診断開始など、パネル外の操作を隠す


// # props を定義した型(GuestExitPanelProps)で受け取り onBusyChange を取り出している
export default function GuestExitPanel({
  onBusyChange,
}: GuestExitPanelProps) {
  const router = useRouter();
  // # 現在の認証状態 と session を 共通hook から取得する
  const { authStatus, session } = useSupabaseSession();

  // # ゲスト終了(サインアウト)処理中かどうかを画面表示用のstateとして管理する。初期値はfalse
  const [isExiting, setIsExiting] = useState(false);
  // # ゲスト終了(サインアウト)処理のエラーメッセージを管理している。初期値は空文字
  const [errorMessage, setErrorMessage] = useState("");

  // # 同じゲスト終了(サインアウト)処理の連打・重複実行を防ぐref
  const inFlightRef = useRef(false);
  // # このコンポーネントが現在マウントされているかを保持するref
  const isMountedRef = useRef(false);


  // ## マウント状態の管理


  // # この useLayoutEffect は、ブラウザを再描画前に実行されるEffect。ref だけを更新している。
  // - この ref は通信のキャンセル機能ではない。アンマウント後の状態更新や画面遷移を避けるために使う。
  useLayoutEffect(() => {
    // # マウント時(このコンポーネント追加時)
    // - このコンポーネントが存在している印(true)をつける
    isMountedRef.current = true;

    // # アンマウント実行時
    // - アンマウント(このコンポーネントが取り外される)時などの、
    // クリーンアップ(存在している印(true)を外す)を行い、
    // 後続の非同期処理は、この値を確認して状態更新や画面遷移を止める印(false)をつけて、中止する。
    return () => {
      isMountedRef.current = false;
    };
  }, []);


  // # ゲスト終了ボタンを押した直後にこのコンポーネントを引き続き実行してよいか確認する
  // - アンマウント済み or 処理中 or ゲストではない or session がない のいずれかの条件に当てはまった場合、
  // ゲスト終了(サインアウト)処理中止
  const handleExit = async () => {
    if (
      !isMountedRef.current || inFlightRef.current || authStatus !== "guest" || !session
    ) {
      return;
    }


    // ## 対象ユーザー と ゲスト終了(サインアウト)意思 の確認

    // # クリック時点のユーザーIDを保存。同じゲストか比較する。
    const expectedUserId = session.user.id;

    // # ブラウザ標準の確認ダイアログを呼び出し、表示
    const confirmed = window.confirm(
      "ゲスト利用を終了すると、今回の診断結果には戻れなくなります。" + "結果は新規登録後のアカウントにも引き継がれません。" + "終了しますか？",
    );

    // # 利用者がゲスト終了(サインアウト)に同意したかどうか確認
    // - ゲスト終了に同意しなかった場合、何も終了せずゲスト利用継続する
    if (!confirmed) {
      return;
    }

    // # 処理中へ切り替える
    // - この時点ではゲスト終了(サインアウト)は実行していない。
    // 先に追加操作を抑え、その後で sessionを再確認するため

    // # ref に処理中の印(true)を付け、連続実行を止める。
    inFlightRef.current = true;
    // # このパネルを処理中表示へ切り替える
    setIsExiting(true);
    // # 前回のエラーメッセージを消す
    setErrorMessage("");
    // # 親コンポーネントへ処理中であることを通知する。
    // - 親コンポーネントが診断開始部分を隠す
    onBusyChange(true);


    try {
      // # 認証状態を比較し、同じゲストであることを再確認する
      // - 表示時点ではなく、操作時点の認証状態を確認する。

      // # 戻り値から必要な値を取り出し、受け取る
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      // # 待っている間にアンマウントされていないか確認し、アンマウント済みの場合、処理中止。
      if (!isMountedRef.current) {
        return;
      }

      // session 取得がエラーの場合の処理
      if (sessionError) {
        throw new Error("session-check-failed");
      }

      // # ゲスト終了対象が適切か(別のユーザーに切り替わっていないかどうか)確認する
      // - sessionなし or 匿名ユーザー(ゲストユーザー)ではない or クリック時とユーザーIDが違う のいずれかに当てはまった場合、
      // ゲスト終了(サインアウト)処理を実行しない。
      if (
        !currentSession || currentSession.user.is_anonymous !== true || currentSession.user.id !== expectedUserId
      ) {
        throw new Error("session-changed");
      }

      // ## ゲスト終了(サインアウト)実行 と ゲスト終了確認

      // # 現在のsession を終了する
      // - 現在のsession を終了し、戻り値がエラーの場合、signOutError として受け取る
      // - scope: "local" : 現在のsession を対象とする指定。
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local",});

      // # 通信待ちの間にアンマウントされていないか確認し、アンマウント済みの場合、処理中止。
      if (!isMountedRef.current) {
        return;
      }

      // # エラー(signOutError)が 返ってきた場合、例外を投げ、失敗時の処理へ進む
      if (signOutError) {
        throw new Error("sign-out-failed");
      }

      // # sessionが残っていないことを確認
      // - signOut() によりゲスト終了(サインアウト)を行い、エラーを返さないことを確認し、
      // このクライアントでsessionが残っていないことを確認できた状態になってから遷移する

      // # 戻り値の取り出しを開始
      const {
        data: { session: remainingSession },
        error: verificationError,
      } = await supabase.auth.getSession();

      // # 通信待ちの間にアンマウントされていないか確認し、アンマウント済みの場合、処理中止。
      if (!isMountedRef.current) {
        return;
      }

      // # session確認エラー or session が残っている 場合、終了を確認できないため、例外を投げ、失敗時の処理へ進む
      if (verificationError || remainingSession) {
        throw new Error("sign-out-not-confirmed");
      }

      // # try内のここまでの処理が成功時は処理中フラグを解除せず、トップページ("/")へ遷移する。
      // - replace を使い、ブラウザーの現在の履歴項目をトップページ("/")に置き換える
      // - 「処理中表示の維持」は、成功時に setIsExiting(false) などを呼ばないことで実現している。
      router.replace("/");

      // # ゲスト終了を失敗し、確認できなかった場合の処理を catch {...} で扱う
      // # try内の以下の例外を対象
      // - throw new Error(...) で自分から発生させた例外
      // - SDK などの処理中に発生した例外
    } catch {
      // # 失敗時にも、通信待ちの間にアンマウントされていないか確認し、アンマウント済みの場合、処理中止。
      if (!isMountedRef.current) {
        return;
      }

      // # 利用者向けのエラーメッセージを設定する
      setErrorMessage(
        "ゲスト利用の終了を確認できませんでした。" + "ユーザー状態が変わった可能性もあります。" + "再読み込みして状態を確認してください。",
      );

      // ## 処理中状態の解除は、失敗時だけ行う。
      // - 成功時はトップページ(/)へ遷移するまで処理中表示を維持するため、成功時は、finally で一律に解除しない。
      // - 失敗時だけ、catch内で連打防止・処理中表示・親コンポーネントへの通知を解除する。解除は失敗時だけに限定する。
      // 成功時にも解除すると、遷移前に未ログイン向けのボタンなどが再表示される可能性があるため。


      // # 連打防止用の処理中フラグを解除する
      inFlightRef.current = false;
      // # このパネルの処理中表示を解除する
      setIsExiting(false);
      // # 親コンポーネントにも処理中の解除を通知する
      onBusyChange(false);
    }
  };

  // ## ゲスト終了(サインアウト)中・ユーザーがゲスト以外の表示

  // # ゲスト終了(サインアウト)の処理中は、共通hook の  認証状態(authStatus)が未ログイン(signedOut) に変わっても、
  // トップページへの遷移まで処理中表示を維持する。
  // - `signOut()` : Supabaseのサインアウトを実行するメソッド
  // - `signedOut` : アプリの共通フックが返す未ログイン状態

  // # if(isExiting) {...} の分岐を authStatus !== "guest" より前に置くことが重要
  // - ゲスト終了(サインアウト)の通知で認証状態が先に未ログインへ変わっても、
  // isExiting が true なら処理中表示を維持できる。
  if (isExiting) {
    return (
      <p role="status" className="text-sm text-muted">
        ゲスト利用を終了しています...
      </p>
    );
  }

  // # ユーザーがゲスト以外で、エラーもない場合の処理
  // - 失敗後に認証状態が変わっていた場合も、エラーを隠して成功扱いにしない。
  // - 現在の状態がゲスト以外か確認する
  // - 終了操作のエラーがないか確認する
  // - エラーもなければ、このゲスト終了パネル(コンポーネント)は何も描画(表示)しない
  if (authStatus !== "guest") {
    if (!errorMessage) {
      return null;
    }

    // # ユーザーがゲストでは無いが、終了エラーがある場合の処理、表示
    // - エラー と再読み込みボタンを表示
    // - ゲスト終了(サインアウト)の確認中に認証状態が変わり、ゲスト終了を確認できなかった場合に使用する表示
    return (
      <div className="space-y-3">
        {/* 共通のエラー文表示 */}
        <ErrorMessage>
          {errorMessage}
        </ErrorMessage>

        {/* 再読み込みボタンを配置 */}
        {/* クリック時にページを再読み込みする */}
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

  // # ゲストの終了操作を表示する
  // - ここまでの条件に当てはまらなければ、現在はゲストで、終了処理中ではない

  // # ゲスト終了パネル と 注意文
  return (
    <section
      aria-label="ゲスト利用の終了"
      className="space-y-3 border-t border-border pt-4"
    >
      <p className="text-sm leading-6 text-muted">
        ゲスト利用を終了すると、今回の診断結果には戻れなくなります。<br/>
        結果は新規登録後のアカウントには引き継がれません。
      </p>

      {/* # ゲスト状態が残っている場合のエラーメッセージ表示 */}
      {errorMessage && (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      )}

      {/* ゲスト終了ボタン */}
      {/* クリック時に "handleExit" を呼び出す */}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={handleExit}
      >
        ゲスト利用を終了する
      </Button>
    </section>
  );
}
