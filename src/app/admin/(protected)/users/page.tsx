"use client";

import { useEffect, useState } from "react";
import { UserPlus, Search, Loader2 } from "lucide-react";
import UserTable from "@/components/admin/users/UserTable";
import CreateUserModal from "@/components/admin/users/CreateUserModal";
import { getUsers } from "./actions";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

  // 加载数据函数
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUsers(search);
      setUsers(data as any);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  // 监听搜索输入（带防抖效果更好，这里简化为直接监听）
  useEffect(() => {
    // 简单防抖：输入停止 500ms 后才查询
    const timer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timer);
  }, [search]); 

  // 当关闭新建窗口时，刷新列表
  useEffect(() => {
    if (!showCreateModal) {
      loadData();
    }
  }, [showCreateModal]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            用户管理
            {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">管理客户、余额及权限。</p>
        </div>
        
        {/* 新建用户按钮 */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-900/20"
        >
          <UserPlus className="w-4 h-4" /> 新增用户
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
        <input 
          placeholder="搜索姓名或邮箱..." 
          className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-colors"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 用户列表 */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
        <UserTable users={users} onUserDeleted={loadData} />
        
        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <p>未找到匹配 "{search}" 的用户</p>
          </div>
        )}
      </div>

      {/* 新建用户弹窗 */}
      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}