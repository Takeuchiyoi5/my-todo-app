import type { ReactNode } from "react";

/**
 * ログイン / 新規登録ページ共通の、中央寄せカード型フォームの外枠。
 * フック等は使わないため "use client" は不要 (親の Client Component に同梱される)。
 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl shadow-black/40">
        <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        )}
        <div className="mt-6">{children}</div>
        {footer && (
          <div className="mt-6 text-center text-sm text-zinc-400">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
