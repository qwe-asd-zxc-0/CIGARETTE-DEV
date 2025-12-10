import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 白名单：这些路径不需要鉴权，直接放行
  const publicPaths = ["/admin/login", "/admin/sign-up"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. 如果请求路径不是以 /admin 开头，直接放行
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // 3. 初始化 Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 4. 如果是访问后台但未登录 -> 跳转登录
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

// ⚠️ 关键修复在这里：只让中间件在 /admin 路径下生效
export const config = {
  matcher: [
    "/admin/:path*", 
  ],
};
