"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Mail, Lock, User, ArrowRight, Loader2, Sparkles, 
  Eye, EyeOff, ShieldCheck, KeyRound, ArrowLeft // ✅ 新增 ArrowLeft 图标
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
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

  // 验证码倒计时状态
  const [countdown, setCountdown] = useState(0);

  // 错误信息状态
  const [errors, setErrors] = useState({
    password: "",
    confirm: "",
    code: ""
  });

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码处理
  const handleSendCode = () => {
    if (!formData.email) {
      alert("Please enter your email address first.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    console.log(`Sending code to ${formData.email}...`);
    setCountdown(60); 
    alert(`Verification code sent to ${formData.email} (Simulated: 123456)`);
  };

  // 实时校验逻辑
  useEffect(() => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    if (formData.password && !passwordRegex.test(formData.password)) {
      setErrors(prev => ({ ...prev, password: "At least 8 chars, letters & numbers required." }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirm: "Passwords do not match." }));
    } else {
      setErrors(prev => ({ ...prev, confirm: "" }));
    }
  }, [formData.password, formData.confirmPassword]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (errors.password || errors.confirm) return;
    if (formData.code !== "123456") { 
       setErrors(prev => ({...prev, code: "Invalid verification code (Try 123456)"}));
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
        throw new Error(data.error || "Failed to create profile");
      }

      alert("Account created successfully!"); 
      router.push("/product"); 

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center relative overflow-hidden p-4 font-sans">
      
      {/* 🚀 新增：左上角返回箭头 */}
      <div className="absolute top-6 left-6 z-50">
        <Link 
          href="/product" 
          className="group flex items-center gap-3 text-zinc-400 hover:text-white transition-all duration-300"
        >
          <div className="p-2.5 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-red-500/30 transition-all shadow-lg backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-sm font-bold tracking-widest opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden sm:block">
            BACK TO SHOP
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
                Join Global Tobacco
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-zinc-400 text-sm">
              Sign up to unlock exclusive offers & tracking
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
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
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
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
            </div>

            {/* Verification Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Verification Code</label>
              <div className="flex gap-3">
                <div className="relative group flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className={`w-full bg-black/40 border ${errors.code ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all`}
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({...formData, code: e.target.value});
                      setErrors(prev => ({...prev, code: ""}));
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className="px-4 py-3.5 min-w-[120px] bg-white/5 border border-white/10 rounded-xl text-white font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {countdown > 0 ? `${countdown}s` : "Send Code"}
                </button>
              </div>
              {errors.code && <p className="text-xs text-red-500 ml-1 mt-1">{errors.code}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 8 chars (A-Z & 0-9)"
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
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Repeat password"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!errors.password || !!errors.confirm}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-red-700 to-red-600 text-white font-bold rounded-xl py-4 mt-6 transition-all hover:shadow-[0_0_40px_-10px_rgba(220,38,38,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>CREATING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER NOW</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Already have an account?{" "}
              <Link 
                href="/sign-in" 
                className="text-white font-bold hover:text-red-500 transition-colors underline decoration-zinc-700 underline-offset-4 hover:decoration-red-500"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}