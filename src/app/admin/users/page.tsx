import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import UserTable from "@/components/admin/users/UserTable"; // 引入新组件

export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams?.q || "";

  // 查询用户数据 (包含所有地址，以便在详情页展示)
  const users = await prisma.profile.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      addresses: true, // ✅ 获取所有地址
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* 顶部标题与搜索 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-zinc-400 text-sm">Manage user profiles, roles, and verifications.</p>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          </div>
          <form>
            <input
              type="text"
              name="q"
              placeholder="Search users..."
              defaultValue={query}
              className="bg-zinc-900 border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 w-64 transition-all"
            />
          </form>
        </div>
      </div>

      {/* 渲染交互式表格 */}
      <UserTable users={users} />
    </div>
  );
}