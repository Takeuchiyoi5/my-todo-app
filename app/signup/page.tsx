"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsAlreadyRegistered(false);
    setIsSubmitting(true);

    // 新規登録処理は supabase-js をこの画面(クライアント)から直接呼び出す
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 確認メール内のリンクの飛び先。コード交換はサーバー側でしかできないため
        // app/auth/callback の Route Handler で処理する。
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      // プロジェクト側で「メール確認」が無効な場合は、この時点で既にログイン済み
      router.push("/");
      router.refresh();
      return;
    }

    // 登録済みのアドレスで signUp すると、Supabase はエラーにせず「成功したように見える」
    // 応答を返し、メールも送らない。その場合 user.identities が空配列になるので判別できる。
    if (data.user?.identities?.length === 0) {
      setIsAlreadyRegistered(true);
      return;
    }

    setMessage(
      "確認メールを送信しました。メール内のリンクを開いて登録を完了してください。",
    );
  }

  return (
    <AuthCard
      title="新規登録"
      description="メールアドレスとパスワードで新しいアカウントを作成します"
      footer={
        <>
          すでにアカウントをお持ちの方は{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            ログイン
          </Link>
        </>
      }
    >
      {message ? (
        <p className="rounded-lg border border-emerald-900 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
          {message}
        </p>
      ) : (
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
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6文字以上"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {isAlreadyRegistered && (
            <div className="rounded-lg border border-amber-900 bg-amber-950/50 px-3 py-2 text-sm text-amber-300">
              このメールアドレスは登録済みの可能性があります。
              <Link
                href="/login"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                ログイン
              </Link>
              するか、パスワードを忘れた場合は
              <Link
                href="/forgot-password"
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                パスワード再設定
              </Link>
              をお試しください。
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "登録中..." : "新規登録"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
