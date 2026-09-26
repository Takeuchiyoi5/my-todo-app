"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/auth-card";

const INPUT_CLASS =
  "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

/**
 * ログイン中のユーザーが自分のパスワードを変更する画面。
 * セッションを乗っ取られた場合に勝手に変更されないよう、
 * 現在のパスワードを確認してから変更する。
 */
export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("新しいパスワードと確認用のパスワードが一致しません。");
      return;
    }
    if (newPassword === currentPassword) {
      setError("現在と異なるパスワードを入力してください。");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("ログイン情報を取得できませんでした。再度ログインしてください。");
      setIsSubmitting(false);
      return;
    }

    // 現在のパスワードが正しいかを、同じアカウントで再ログインして確かめる
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setError("現在のパスワードが正しくありません。");
      setIsSubmitting(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("パスワードを変更しました。次回から新しいパスワードでログインしてください。");
  }

  return (
    <AuthCard
      title="パスワード変更"
      description="現在のパスワードと、新しいパスワードを入力してください"
      footer={
        <Link
          href="/"
          className="font-medium text-indigo-400 hover:text-indigo-300"
        >
          TODO 一覧に戻る
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-zinc-300"
          >
            現在のパスワード
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-zinc-300"
          >
            新しいパスワード
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="6文字以上"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-zinc-300"
          >
            新しいパスワード（確認）
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-lg border border-emerald-900 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "変更中..." : "パスワードを変更"}
        </button>
      </form>
    </AuthCard>
  );
}
