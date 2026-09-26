import { createBrowserClient } from "@supabase/ssr";

/**
 * "use client" コンポーネントから呼び出すブラウザ用 Supabase クライアント。
 * サインアップ・ログイン・ログアウトなど、supabase-js を画面側から直接呼ぶ処理はこれを使う。
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
