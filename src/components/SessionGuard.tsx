'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function SessionGuard({ 
  isValid, 
  reason 
}: { 
  isValid: boolean; 
  reason?: string;
}) {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!isValid) {
      // 如果 Session 无效（被踢），执行登出
      const handleLogout = async () => {
        await supabase.auth.signOut();
        // 可以选择弹窗提示，或者跳转到带参数的登录页
        const message = encodeURIComponent(reason || "Session expired");
        router.push(`/login?error=${message}`);
      };
      handleLogout();
    }
  }, [isValid, reason, router, supabase]);

  return null; // 这个组件不渲染任何 UI，只负责逻辑
}
