"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";

/**
 * パスワードを忘れたユーザーに、再設定用のメールを送る画面。
 * メール内のリンク → app/auth/callback でセッション化 → /reset-password へ進む。
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    // 登録済みかどうかに関わらず同じ表示にする (登録の有無を第三者に知られないため)
    setIsSent(true);
  }

  return (
    <AuthCard
      title="パスワード再設定"
      description="登録したメールアドレスに、再設定用のリンクを送ります"
      footer={
        <Link
          href="/login"
          className="font-medium text-indigo-400 hover:text-indigo-300"
        >
          ログイン画面に戻る
        </Link>
      }
    >
      {isSent ? (
        <p className="rounded-lg border border-emerald-900 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
          入力したメールアドレスが登録されていれば、再設定用のメールを送信しました。メール内のリンクを開いて、新しいパスワードを設定してください。
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
            {isSubmitting ? "送信中..." : "再設定メールを送る"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
