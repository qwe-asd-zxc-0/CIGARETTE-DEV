import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// 🛡️ 简单的内存限流器 (Rate Limiter)
// 生产环境建议改用 Redis
const rateLimit = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 分钟窗口
  const limit = 100; // 每分钟 100 次请求

  const record = rateLimit.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  if (record.count >= limit) return false;

  record.count++;
  rateLimit.set(ip, record);
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================
  // 1. API 路由处理 (保持原有的安全逻辑)
  // ==========================================
  if (pathname.startsWith('/api')) {
    // 🛡️ 应用限流
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 初始化 Supabase (为了检查 API 权限)
    let response = NextResponse.next({ request: { headers: request.headers } });
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return request.cookies.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({ request: { headers: request.headers } });
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    // 🔒 仅保护管理后台的 API
    if (pathname.startsWith("/api/admin")) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
       }
    }
    // 注意：/api/upload 如果给前台用，就不要保护；如果只给后台用，就加上保护。
    // 这里假设游客上传凭证可能需要用，暂时放开，或者你在路由内部做逻辑判断。

    return response;
  }

  // ==========================================
  // 2. 页面路由处理 (国际化 + 页面鉴权)
  // ==========================================
  
  // 初始化 next-intl
  const handleI18nMiddleware = createMiddleware(routing);
  const response = handleI18nMiddleware(request);

  // 初始化 Supabase (为了页面鉴权)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 🌍 获取不带语言前缀的路径
  const pathnameWithoutLocale = pathname.replace(/^\/(en|zh|ms|th)/, '') || '/';

  // ✅ 核心修改：只保护 Admin 后台，放开其他所有页面
  const isProtectedRoute = pathnameWithoutLocale.startsWith('/admin') && 
                           !pathnameWithoutLocale.startsWith('/admin/login');

  if (isProtectedRoute) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // 获取当前语言环境，重定向到后台登录页
      const segments = pathname.split('/');
      const potentialLocale = segments[1];
      const currentLocale = routing.locales.includes(potentialLocale as any) 
        ? potentialLocale 
        : routing.defaultLocale;

      const url = request.nextUrl.clone();
      url.pathname = `/${currentLocale}/admin/login`; // 强制跳到后台登录
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
};