import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 白名单：这些路径不需要鉴权，直接放行
  const publicPaths = ["/admin/login", "/admin/sign-up"];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // 2. 初始化 Supabase
  // 创建一个响应对象，以便后续设置 Cookie
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

  // 3. 检查用户登录状态
  const { data: { user } } = await supabase.auth.getUser();

  // 4. 鉴权逻辑：未登录处理
  if (!user) {
    // 如果是 API 请求，返回 401 JSON 错误
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    // 区分后台和前台的重定向逻辑
    const url = request.nextUrl.clone();
    
    if (pathname.startsWith("/admin")) {
      url.pathname = "/admin/login";
    } else {
      // 前台受保护页面 (checkout, profile) 跳转到普通登录页
      url.pathname = "/login";
    }
    
    return NextResponse.redirect(url);
  }

  return response;
}

// ⚠️ 关键修复：扩大匹配范围，包含 /api 下的敏感路径
export const config = {
  matcher: [
    "/admin/:path*",          // 保护所有后台页面
    "/api/admin/:path*",      // 保护所有后台 API
    "/api/upload",            // 保护上传接口
    "/checkout",              // 保护结算页
    "/cart",                  // 保护购物车
    "/profile/:path*",        // 保护个人中心
  ],
};