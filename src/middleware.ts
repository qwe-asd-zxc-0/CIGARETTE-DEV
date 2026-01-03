import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// 🛡️ 简单的内存限流器 (Rate Limiter)
// 注意：在 Serverless/Edge 环境中，Map 可能不会跨请求持久化。
// 生产环境建议使用 Redis (如 @upstash/ratelimit)。
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

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  rateLimit.set(ip, record);
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. 处理 API 路由 (不进行国际化重定向，但保留鉴权)
  if (pathname.startsWith('/api')) {
    // 🛡️ 1.1 应用限流
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // 初始化 Supabase
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

    // API 鉴权逻辑
    // 保护 /api/admin 和 /api/upload
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/upload")) {
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) {
         return NextResponse.json(
           { error: "Unauthorized: Please log in." },
           { status: 401 }
         );
       }
    }
    return response;
  }

  // 2. 初始化 next-intl 中间件 (处理页面路由)
  const handleI18nMiddleware = createMiddleware(routing);
  const response = handleI18nMiddleware(request);

  // 3. Supabase 集成 (使用 next-intl 的 response)
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
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 4. 页面鉴权逻辑
  // 获取不带 locale 的路径
  const pathnameWithoutLocale = pathname.replace(/^\/(en|zh|ms|th)/, '') || '/';

  // 定义受保护的路径 (根据原 middleware 的 matcher)
  const isProtectedRoute = 
    pathnameWithoutLocale.startsWith('/admin') ||
    pathnameWithoutLocale.startsWith('/checkout') ||
    pathnameWithoutLocale.startsWith('/cart') ||
    pathnameWithoutLocale.startsWith('/profile');

  // 定义公开的 Auth 路径 (白名单)
  const isPublicAuthRoute = 
    pathnameWithoutLocale === '/admin/login' || 
    pathnameWithoutLocale === '/admin/sign-up' ||
    pathnameWithoutLocale === '/login' ||
    pathnameWithoutLocale === '/sign-up';

  if (isProtectedRoute && !isPublicAuthRoute) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // 获取当前 locale
      const segments = pathname.split('/');
      const potentialLocale = segments[1];
      const currentLocale = routing.locales.includes(potentialLocale as any) 
        ? potentialLocale 
        : routing.defaultLocale;

      const url = request.nextUrl.clone();
      
      if (pathnameWithoutLocale.startsWith("/admin")) {
        url.pathname = `/${currentLocale}/admin/login`;
      } else {
        url.pathname = `/${currentLocale}/login`;
      }
      
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // 匹配所有路径，但排除静态资源 (_next, images, etc.)
  matcher: ['/((?!_next|.*\\..*).*)']
};