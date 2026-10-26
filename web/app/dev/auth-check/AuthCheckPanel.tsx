"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSupabaseSession } from "@/app/_hooks/useSupabaseSession";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type SessionState = ReturnType<typeof useSupabaseSession>;
type Endpoint = "history" | "detail" | "result" | "step" | "answers";
type ApiResult = { method: string; path: string; status: number; body: unknown };

const statusLabels: Record<SessionState["authStatus"], string> = {
  loading: "認証確認中",
  signedOut: "未ログイン",
  guest: "ゲスト",
  member: "通常ユーザー",
  error: "認証確認エラー",
};

export default function AuthCheckPanel() {
  const auth = useSupabaseSession();

  // 認証変更時は入力・応答を破棄し、前のユーザーの結果を残さない。
  const authKey = JSON.stringify([auth.authStatus, auth.session?.user.id, auth.token]);
  return <Checks key={authKey} auth={auth} />;
}

function Checks({ auth }: { auth: SessionState }) {
  const [endpoint, setEndpoint] = useState<Endpoint>("history");
  const [diagnosisId, setDiagnosisId] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [withoutToken, setWithoutToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const pending = useRef(false);
  const mounted = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);

  async function operate(action: () => Promise<void>) {
    if (pending.current || !mounted.current) return;
    pending.current = true;
    setBusy(true);
    setMessage("");
    setResult(null);
    try {
      await action();
    } catch {
      if (mounted.current) setMessage("操作に失敗しました。通信状態や設定を確認してください。");
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function startGuest() {
    await operate(async () => {
      // 作成直前にも確認し、既存ユーザーを匿名ユーザーに切り替えない。
      const current = await supabase.auth.getSession();
      if (!mounted.current) return;
      if (current.error) throw current.error;
      if (current.data.session) {
        setMessage("既存のセッションを維持しました。表示を確認してください。");
        return;
      }
      const { error } = await supabase.auth.signInAnonymously();
      if (error && mounted.current) {
        setMessage(`匿名認証に失敗しました（${error.code ?? "unknown"}）。旧Supabaseの設定を確認してください。`);
      }
    });
  }

  async function checkApi() {
    await operate(async () => {
      if (!withoutToken && (!auth.token || (!auth.isMember && !auth.isGuest))) {
        setMessage("通常ユーザーまたはゲストとして認証してください。");
        return;
      }
      const id = diagnosisId.trim();
      if (endpoint !== "history" && !id) {
        setMessage("診断IDを入力してください。");
        return;
      }
      if (endpoint === "answers" && !questionId.trim()) {
        setMessage("質問1のIDを入力してください。");
        return;
      }

      // 認証情報の送信先は、このアプリの固定APIだけに限定する。
      const paths: Record<Endpoint, string> = {
        history: "/api/diagnosis/history",
        detail: `/api/diagnosis/history/${encodeURIComponent(id)}`,
        result: `/api/diagnosis/${encodeURIComponent(id)}/result`,
        step: `/api/diagnosis/step?diagnosisId=${encodeURIComponent(id)}&step=1`,
        answers: "/api/diagnosis/answers",
      };
      const path = paths[endpoint];
      const method = endpoint === "answers" ? "POST" : "GET";
      const headers: Record<string, string> = {};
      if (!withoutToken) headers.Authorization = `Bearer ${auth.token}`;
      if (endpoint === "answers") headers["Content-Type"] = "application/json";
      const request = new AbortController();
      controller.current = request;
      const response = await fetch(path, {
        method,
        headers,
        credentials: "omit",
        cache: "no-store",
        signal: request.signal,
        ...(endpoint === "answers" ? {
          body: JSON.stringify({ diagnosisId: id, questionId: questionId.trim(), order: 1, value: 1 }),
        } : {}),
      });
      const text = await response.text();
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* JSON以外の応答も確認できるようにする。 */ }
      if (mounted.current && !request.signal.aborted) {
        setResult({ method, path, status: response.status, body });
      }
    });
  }

  const disabled = busy || auth.authStatus === "loading";
  const inputClass = "w-full rounded border border-border bg-surface p-2 text-foreground";

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">ローカル認証・API確認</h1>
      <p>開発用の確認ページです。回答保存の確認は、指定した診断への書き込みを試みます。</p>
      <Card className="space-y-3">
        <p>認証状態：{statusLabels[auth.authStatus]}</p>
        <p className="break-all">ユーザーID：{auth.session?.user.id ?? "なし"}</p>
        <p className="break-all">Supabase接続先：{process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
        {auth.errorMessage && <p role="alert">{auth.errorMessage}</p>}
        <div className="flex flex-wrap gap-3">
          <Button disabled={disabled || auth.authStatus !== "signedOut"} onClick={startGuest}>
            検証用ゲスト認証を開始
          </Button>
          <Button variant="secondary" disabled={disabled || (!auth.isGuest && !auth.isMember)}
            onClick={() => operate(async () => {
              const { error } = await supabase.auth.signOut({ scope: "local" });
              if (error) throw error;
            })}>
            このブラウザーの認証を終了
          </Button>
        </div>
        <nav className="flex flex-wrap gap-4 text-primary">
          <Link href="/login">通常ログイン</Link>
          <Link href="/diagnosis/start">診断開始画面</Link>
          <Link href="/history">履歴画面</Link>
        </nav>
      </Card>
      <Card className="space-y-4">
        <label className="block space-y-1">
          <span>確認するAPI</span>
          <select className={inputClass} value={endpoint} disabled={disabled}
            onChange={event => { setEndpoint(event.target.value as Endpoint); setResult(null); }}>
            <option value="history">履歴一覧</option>
            <option value="detail">履歴詳細</option>
            <option value="result">診断結果</option>
            <option value="step">質問の取得（質問1）</option>
            <option value="answers">回答の保存（質問1・回答値1）</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span>診断ID（履歴一覧では不要）</span>
          <input className={inputClass} value={diagnosisId} disabled={disabled}
            onChange={event => { setDiagnosisId(event.target.value); setResult(null); }} />
        </label>
        {endpoint === "answers" && <label className="block space-y-1">
          <span>質問1のID（回答保存の確認用）</span>
          <input className={inputClass} value={questionId} disabled={disabled}
            onChange={event => { setQuestionId(event.target.value); setResult(null); }} />
        </label>}
        <label className="flex gap-2">
          <input type="checkbox" checked={withoutToken} disabled={disabled}
            onChange={event => { setWithoutToken(event.target.checked); setResult(null); }} />
          認証トークンを付けずに送信する
        </label>
        <Button disabled={disabled} onClick={checkApi}>{busy ? "確認中…" : "APIを確認"}</Button>
        {message && <p role="status">{message}</p>}
        {result && <section aria-label="API確認結果" className="space-y-2">
          <p className="break-all">{result.method} {result.path}</p>
          <p className="font-bold">HTTP {result.status}</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-background p-3 text-sm">
            {JSON.stringify(result.body, null, 2)}
          </pre>
        </section>}
      </Card>
    </main>
  );
}
