"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, ArrowRight, Mail, Lock, Send } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // 简单的错误信息汉化
      if (error.message === "Invalid login credentials") {
        setError("账号或密码错误");
      } else {
        setError("登录失败，请检查您的网络或账号信息");
      }
      setLoading(false);
    } else {
      router.refresh();
      router.push("/profile"); // 登录成功跳转到个人中心
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black pt-28">
      {/* 左侧装饰区 */}
      <div className="hidden md:flex flex-1 bg-zinc-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-lg text-center md:text-left">
          <h2 className="text-4xl font-bold text-white mb-6">欢迎回到 <br/>Global Tobacco</h2>
          <p className="text-zinc-400 text-lg">探索来自全球的精选烟草产品和配件。</p>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">登录</h1>
            <p className="mt-2 text-zinc-500">访问您的账户和订单历史。</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">电子邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase">密码</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(!showForgot)}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    忘记密码？
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {showForgot && (
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-center space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-zinc-300">请联系客服重置密码</p>
                  <div className="flex flex-col items-center gap-3">
                    {/* 客服二维码 - 请替换为实际图片路径 */}
                    <div className="w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center">
                      <img 
                        src="/images/telegram-qr.png" 
                        alt="Telegram QR" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // 如果图片加载失败，显示占位符
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<span class="text-black text-xs">二维码</span>';
                        }}
                      />
                    </div>
                    <a
                      href="https://t.me/GlobalTobaccoSupport"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      @GlobalTobaccoSupport
                    </a>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "登录账户"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500">
            还没有账户？{" "}
            <Link href="/sign-up" className="text-white font-bold hover:underline underline-offset-4">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}