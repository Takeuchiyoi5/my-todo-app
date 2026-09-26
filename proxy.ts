import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ログイン不要でアクセスできるページ
const PUBLIC_PATHS = ["/login", "/signup"];

/**
 * Next.js 16 の Proxy（旧 Middleware）。
 * - リクエストごとに Supabase セッションの Cookie を読み書きし、必要なら更新する
 * - 未ログインで保護ページに来たら /login へ
 * - ログイン済みで /login, /signup に来たら / へ
 *
 * ここでの認証チェックはあくまで「楽観的チェック」。実データへのアクセスは
 * RLS (Supabase) と、各ページ/Route Handler 側のセッション確認で守ること。
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getSession() ではなく getUser() を使うこと。
  // getUser() は毎回 Supabase Auth サーバーにトークンを問い合わせて検証するため、
  // Cookie を書き換えられただけの偽セッションを弾ける。
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // 静的アセット・画像最適化・favicon・API・メール確認用 Route Handler (app/auth/callback) は対象外にする
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
