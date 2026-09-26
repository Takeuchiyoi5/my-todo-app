import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Component / Route Handler から呼び出すサーバー用 Supabase クライアント。
 * next/headers の cookies() (Next.js 16 では非同期) 経由でセッションを読み書きする。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component のレンダリング中は cookies().set が呼べない。
            // セッションの延長は proxy.ts 側で行っているのでここは無視してよい。
          }
        },
      },
    },
  );
}
