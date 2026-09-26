import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * サインアップ後にユーザーへ届く確認メールのリンク先。
 *
 * Supabase から返る認証コードをセッションに交換する処理は Cookie に
 * Set-Cookie を発行できるサーバー側でしか行えないため、
 * クライアント (supabase-js) からではなくここ (Route Handler) で処理する。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_error`,
  );
}
