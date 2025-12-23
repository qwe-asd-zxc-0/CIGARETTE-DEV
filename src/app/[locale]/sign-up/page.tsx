"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing"; // ✅ 使用国际化路由
import { motion } from "framer-motion";
import { 
  Mail, Lock, User, ArrowRight, Loader2, Sparkles, 
  Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft // ✅ 新增 ArrowLeft 图标
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useTranslations } from 'next-intl'; // ✅ 引入翻译钩子

export default function SignUpPage() {
  const t = useTranslations('SignUp'); // ✅ 获取 SignUp 翻译
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // 表单状态
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    code: "", // 验证码
    password: "",
    confirmPassword: "",
  });

  // 密码可见性控制
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 验证码状态
  const [generatedCode, setGeneratedCode] = useState("");

  // 错误信息状态
  const [errors, setErrors] = useState({
    password: "",
    confirm: "",
    code: ""
  });

  // 生成验证码
  const generateCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
  };

  // 初始化验证码
  useEffect(() => {
    generateCode();
  }, []);

  // 实时校验逻辑
  useEffect(() => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (formData.password && !passwordRegex.test(formData.password)) {
      setErrors(prev => ({ ...prev, password: t('errorPassword') }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirm: t('errorConfirm') }));
    } else {
      setErrors(prev => ({ ...prev, confirm: "" }));
    }
  }, [formData.password, formData.confirmPassword]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (errors.password || errors.confirm) return;
    if (formData.code !== generatedCode) { 
       setErrors(prev => ({...prev, code: t('errorCode')}));
       generateCode(); // 输错刷新验证码
       setFormData(prev => ({...prev, code: ""}));
       return;
    }

    setIsLoading(true);

    try {
      const mockUserId = "user_" + Math.random().toString(36).substr(2, 9);
      const mockError = null;

      if (mockError) throw mockError;

      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: mockUserId,
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password, 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "创建账户失败");
      }

      // 注册成功后，自动执行登录
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        console.error("自动登录失败:", loginError);
        alert("账户创建成功，但自动登录失败，请手动登录。");
        router.push("/sign-in");
      } else {
        // 使用 window.location.href 强制跳转，确保 Auth 状态正确更新且页面刷新
        window.location.href = "/"; 
      }

    } catch (err: any) {
      console.error(err);
      alert(err.message || "注册失败，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden p-4 pt-28 font-sans">
      
      {/* 🚀 新增：左上角返回箭头 */}
      <div className="absolute top-28 left-6 z-50">
        <Link 
          href="/product" 
          className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-all duration-300"
        >
          <div className="p-2.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-red-500/30 transition-all shadow-lg backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-sm font-bold tracking-widest opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden sm:block">
            {t('backToHome')}
          </span>
        </Link>
      </div>

      {/* 背景氛围 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-red-900/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-orange-900/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-lg bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* 顶部红条装饰 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-600 to-red-600" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-zinc-300 tracking-widest uppercase">
                {t('joinCommunity')}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-zinc-400 text-sm">
              {t('joinDesc')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t('nameLabel')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t('emailLabel')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <p className="text-xs text-zinc-500 ml-1">
                {t('emailHint')}
              </p>
            </div>

            {/* Verification Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t('codeLabel')}</label>
              <div className="flex gap-3">
                <div className="relative group flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="0000"
                    maxLength={4}
                    className={`w-full bg-black/40 border ${errors.code ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all`}
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({...formData, code: e.target.value});
                      setErrors(prev => ({...prev, code: ""}));
                    }}
                  />
                </div>
                <div 
                  onClick={generateCode}
                  className="px-4 min-w-[120px] bg-white/5 border border-white/10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all select-none"
                  title={t('clickToRefresh')}
                >
                  <span className="text-2xl font-mono font-bold text-white tracking-widest italic" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    {generatedCode}
                  </span>
                </div>
              </div>
              {errors.code && <p className="text-xs text-red-500 ml-1 mt-1">{errors.code}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t('passwordLabel')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className={`w-full bg-black/40 border ${errors.password ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all`}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 ml-1 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">{t('confirmPasswordLabel')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className={`w-full bg-black/40 border ${errors.confirm ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-500 ml-1 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  {t('submit')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-6">
            {t('hasAccount')}{" "}
            <Link href="/login" className="text-white font-bold hover:underline underline-offset-4">
              {t('login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}