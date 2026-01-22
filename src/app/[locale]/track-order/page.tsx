'use client';

import { useState, useEffect } from 'react'; // ✅ 新增 useEffect
import { useTranslations } from 'next-intl';
import { Loader2, Mail, ArrowRight, Lock, ShoppingBag } from 'lucide-react';
import { sendOtp, verifyOtp } from '@/app/actions/auth';

export default function TrackOrderPage() {
  const t = useTranslations('Common.TrackOrderPage');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ 新增：倒计时状态
  const [countdown, setCountdown] = useState(0);

  // ✅ 新增：倒计时计时器逻辑
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 处理发送验证码
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 如果还在倒计时，阻止发送
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('email', email);

    const res = await sendOtp(formData);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setCountdown(60); // ✅ 发送成功，开始 60s 倒计时
    } else {
      setError(res.message);
    }
  };

  // 处理提交验证码
  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('email', email);
    
    const res = await verifyOtp(null, formData); 
    
    setLoading(false);
    if (res?.message) {
        setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* === 🌑 背景特效 === */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>

      {/* === 卡片内容 === */}
      <div className="relative z-10 w-full max-w-md">
        {/* 顶部图标 */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-zinc-900/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-zinc-800 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
             {step === 'email' ? <ShoppingBag className="w-7 h-7 text-zinc-400" /> : <Lock className="w-7 h-7 text-red-500" />}
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {step === 'email' ? t('titleEmail') : t('titleOtp')}
            </h1>
            <p className="text-sm text-zinc-400">
              {step === 'email' 
                ? t('descEmail')
                : t('descOtp', { email: email })}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('emailLabel')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition text-white placeholder:text-zinc-700"
                  />
                </div>
              </div>
              
              {/* ✅ 修改：发送按钮 (支持倒计时状态) */}
              <button
                type="submit"
                disabled={loading || countdown > 0} 
                className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : countdown > 0 ? (
                  <span className="text-zinc-600">{t('resendIn', { seconds: countdown })}</span>
                ) : (
                  <>
                    {t('sendCodeBtn')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('codeLabel')}</label>
                <input
                  type="text"
                  name="code"
                  required
                  maxLength={6}
                  placeholder={t('codePlaceholder')}
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 bg-black/50 border border-zinc-800 rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 outline-none transition text-white placeholder:text-zinc-800"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-red-900/20"
              >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : t('verifyBtn')}
              </button>

              {/* ✅ 新增：底部操作栏 (重发 + 换邮箱) */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendCode()}
                  disabled={loading || countdown > 0}
                  className="flex-1 py-3 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? t('resendIn', { seconds: countdown }) : t('resendCode')}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); }}
                  className="flex-1 py-3 text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 rounded-xl transition"
                >
                  {t('changeEmail')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}