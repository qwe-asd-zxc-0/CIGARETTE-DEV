"use client";

import { useState } from "react";
import Image from "next/image";
import { Search, Shield, ShieldOff, UserPlus, Loader2, Trash2 } from "lucide-react";
import { searchUserByEmail, toggleAdminPermission } from "@/app/[locale]/admin/(protected)/settings/actions";

export default function AdminManager({ admins }: { admins: any[] }) {
  const [email, setEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearchResult(null);
    const res = await searchUserByEmail(email);
    setLoading(false);
    if (res.success) {
      setSearchResult(res.user);
    } else {
      alert(res.message);
    }
  };

  const handleToggle = async (userId: string, status: boolean) => {
    if (!confirm(status ? "Grant admin privileges?" : "Revoke admin privileges?")) return;
    await toggleAdminPermission(userId, status);
    setSearchResult(null); // 清空搜索结果
    setEmail("");
  };

  return (
    <div className="space-y-8">
      {/* 添加管理员区域 */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" />
          Add New Administrator
        </h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs text-zinc-500 font-bold uppercase">User Email</label>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email to search..."
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            </form>
          </div>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </button>
        </div>

        {/* 搜索结果展示 */}
        {searchResult && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 relative overflow-hidden">
                {searchResult.avatarUrl && <Image src={searchResult.avatarUrl} alt="Avatar" fill className="object-cover" />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{searchResult.fullName || "Unnamed"}</p>
                <p className="text-xs text-blue-400">{searchResult.email}</p>
              </div>
            </div>
            {searchResult.isAdmin ? (
              <span className="text-xs font-bold text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">Already Admin</span>
            ) : (
              <button
                onClick={() => handleToggle(searchResult.id, true)}
                className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full transition-colors"
              >
                Grant Admin
              </button>
            )}
          </div>
        )}
      </div>

      {/* 现有管理员列表 */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Current Administrators ({admins.length})</h3>
        <div className="grid gap-3">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-xl hover:border-white/10 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 relative overflow-hidden border border-white/10">
                  {admin.avatarUrl ? (
                    <Image src={admin.avatarUrl} alt={admin.fullName} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold">
                      {admin.email[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">{admin.fullName || "Admin User"}</p>
                  <p className="text-sm text-zinc-500">{admin.email}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">ID: {admin.id}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleToggle(admin.id, false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-900/30 bg-red-900/10 text-red-500 hover:bg-red-900/20 hover:text-red-400 transition-colors text-xs font-bold"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Revoke
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}