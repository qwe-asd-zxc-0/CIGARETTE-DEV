"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Shield, ShieldCheck, ShieldAlert, Key, Loader2 } from "lucide-react"; 
import { AnimatePresence } from "framer-motion";
import UserDrawer from "./UserDrawer";
// ✅ 关键点：只引用，不定义
import { toggleAgeVerified, toggleAdminStatus, sendPasswordResetEmail } from "@/app/admin/(protected)/users/actions";

export default function UserTable({ users }: { users: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRowClick = (user: any) => {
    setSelectedUser(user);
  };

  // ✅ 包装函数：处理管理员状态切换 (返回 void，满足 form action 类型要求)
  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    const res = await toggleAdminStatus(userId, currentStatus);
    setLoadingId(null);

    if (res.success) {
      alert("✅ " + res.message);
    } else {
      alert("❌ " + res.message);
    }
  };

  // ✅ 包装函数：处理年龄验证状态切换 (返回 void，满足 form action 类型要求)
  const handleToggleAgeVerified = async (userId: string, currentStatus: boolean) => {
    setLoadingId(userId);
    const res = await toggleAgeVerified(userId, currentStatus);
    setLoadingId(null);

    if (res.success) {
      alert("✅ " + res.message);
    } else {
      alert("❌ " + res.message);
    }
  };

  // 处理发送重置邮件
  const handleResetPassword = async (e: React.MouseEvent, email: string, userId: string) => {
    e.stopPropagation(); // 防止触发打开详情页
    if (!confirm(`Send password reset email to ${email}?`)) return;

    setLoadingId(userId);
    const res = await sendPasswordResetEmail(email);
    setLoadingId(null);

    if (res.success) {
      alert("✅ Email sent successfully!");
    } else {
      alert("❌ Error: " + res.message);
    }
  };

  return (
    <>
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/5 uppercase font-bold text-xs tracking-wider text-zinc-200">
              <tr>
                <th className="p-4 pl-6">User Profile</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-center">Security</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right pr-6">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  onClick={() => handleRowClick(user)} 
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden relative border border-white/10 flex items-center justify-center">
                        {user.avatarUrl ? (
                          <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-zinc-500">{(user.fullName || user.email || "U").substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-red-400 transition-colors">
                          {user.fullName || "No Name"}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      <span>{user.addresses?.[0] ? `${user.addresses[0].city || '-'}, ${user.addresses[0].country}` : <span className="text-zinc-600 italic">No Address</span>}</span>
                    </div>
                  </td>

                  {/* 安全操作区：管理员开关 + 重置密码 */}
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      {/* 1. 管理员开关 - 使用包装函数处理返回值 */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAdminStatus(user.id, !!user.isAdmin);
                        }}
                        disabled={loadingId === user.id}
                        className={`p-1.5 rounded-lg border transition-all ${user.isAdmin ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-white"}`} 
                        title="Toggle Admin"
                      >
                        {loadingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      </button>

                      {/* 2. 发送重置邮件按钮 */}
                      <button 
                        onClick={(e) => handleResetPassword(e, user.email, user.id)}
                        className="p-1.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-red-900/30 hover:text-red-400 hover:border-red-500/30 transition-all"
                        title="Send Password Reset Email"
                        disabled={loadingId === user.id}
                      >
                        {loadingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>

                  {/* 年龄验证状态 - 使用包装函数处理返回值 */}
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAgeVerified(user.id, !!user.isAgeVerified);
                      }}
                      disabled={loadingId === user.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${user.isAgeVerified ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}
                    >
                      {loadingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : user.isAgeVerified ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      {loadingId === user.id ? "..." : user.isAgeVerified ? "Verified" : "Check"}
                    </button>
                  </td>

                  <td className="p-4 text-right pr-6 text-zinc-500 text-xs">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ⚠️ 此处原有的 toggleAdminStatus 等代码已删除，因为它们已移至 actions.ts