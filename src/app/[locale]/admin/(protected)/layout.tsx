import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Admin Layout Component
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // 1. 初始化 Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 2. 获取当前用户
  const { data: { user }, error } = await supabase.auth.getUser();

  // 如果没有用户，踢回登录页
  if (error || !user) {
    redirect("/admin/login");
  }

  // 3. 核心安全检查：查询数据库，确认 isAdmin === true
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  });

  // 4. 如果不是管理员，踢回首页
  if (!profile || !profile.isAdmin) {
    redirect("/");
  }

  // 5. 验证通过，渲染后台
  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans">
      <AdminSidebar /> 
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen bg-black transition-all duration-300">
        <div className="max-w-7xl mx-auto pt-16 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}