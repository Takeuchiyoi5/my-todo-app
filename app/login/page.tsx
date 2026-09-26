"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";

/**
 * app/auth/callback でリンクのコード交換に失敗すると ?error=auth_callback_error 付きで
 * ここへ戻ってくる (確認メール・再設定メールのリンク期限切れなど)。
 * useSearchParams を使う部分は Suspense で囲む必要がある。
 */
function CallbackErrorMessage() {
  const searchParams = useSearchParams();
  if (searchParams.get("error") !== "auth_callback_error") return null;

  return (
    <p className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
      メールのリンクが無効か、有効期限が切れています。もう一度お試しください。
    </p>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // ログイン処理は supabase-js をこの画面(クライアント)から直接呼び出す
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard
      title="ログイン"
      description="メールアドレスとパスワードでログインしてください"
      footer={
        <div className="space-y-3">
          <p>
            <Link
              href="/forgot-password"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              パスワードを忘れた方
            </Link>
          </p>
          <p>
            アカウントをお持ちでない方は{" "}
            <Link
              href="/signup"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              新規登録
            </Link>
          </p>
          <p className="text-xs text-zinc-500">
            ログイン ID は登録したメールアドレスです。どのアドレスで登録したか分からない場合は、心当たりのあるアドレスでパスワード再設定をお試しください。
          </p>
        </div>
      }
    >
      <Suspense fallback={null}>
        <CallbackErrorMessage />
      </Suspense>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-300"
          >
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-300"
          >
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </AuthCard>
  );
}
