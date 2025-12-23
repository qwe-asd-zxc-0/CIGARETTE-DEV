"use client";

import { useState } from "react";
import { Shield, Lock, Loader2 } from "lucide-react";
import { adminLogin } from "../actions"; // 引入刚才写的 action

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);
    
    // 如果 result 有返回，说明 redirect 没触发（即出错了）
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-4 border border-red-600/20">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold">管理平台</h1>
          <p className="text-zinc-500 text-sm mt-1">仅限授权人员进入</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">邮箱</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Password</label>
            <div className="relative">
              <input 
                name="password"
                type="password" 
                required
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none transition-colors"
                placeholder="••••••••"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Secure Login"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-600">
            系统活动会被记录和监控。
          </p>
        </div>
      </div>
    </div>
  );
}