'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Copy, Loader2, ShieldCheck, Clock, Bitcoin } from "lucide-react";
import { confirmPayment } from "./actions";
import Image from "next/image";
import { useTranslations } from 'next-intl';

interface PaymentClientProps {
  order: {
    id: string;
    totalAmount: number;
    currency: string;
    createdAt: Date;
  };
}

export default function PaymentClient({ order }: PaymentClientProps) {
  const t = useTranslations('Payment');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes countdown
  const [copied, setCopied] = useState(false);

  // 模拟倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentComplete = async () => {
    setLoading(true);
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const res = await confirmPayment(order.id);
    
    if (res.success) {
      router.push("/profile/orders");
    } else {
      alert(t('verifyFailed'));
      setLoading(false);
    }
  };

  // 模拟的 USDT 地址
  const walletAddress = "T9yD14Nj9j7xAB4dbGeiX9h8veH5Zvx5yq";

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-zinc-800/50 p-6 text-center border-b border-white/5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 mb-4">
            <Bitcoin className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">{t('title')}</h1>
          <p className="text-zinc-400 text-sm mt-1">{t('orderNo')} {order.id.slice(0, 8)}</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Amount */}
          <div className="text-center">
            <p className="text-zinc-500 text-sm uppercase tracking-wider">{t('totalAmount')}</p>
            <div className="text-4xl font-black text-white mt-2">
              ${Number(order.totalAmount).toFixed(2)} <span className="text-lg text-zinc-500 font-medium">USDT</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-orange-500 bg-orange-500/10 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            <span className="text-xs">{t('remainingTime')}</span>
          </div>

          {/* QR Code Placeholder */}
          <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center">
             {/* 这里可以使用 qrcode.react 生成真实的二维码 */}
             <div className="w-full h-full bg-black/10 flex items-center justify-center text-black/50 text-xs text-center">
               [QR Code for {walletAddress.slice(0, 6)}...]
             </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">{t('addressLabel')}</label>
            <div className="flex items-center gap-2 bg-black border border-white/10 rounded-lg p-3">
              <code className="text-xs text-zinc-300 flex-1 break-all font-mono">{walletAddress}</code>
              <button 
                onClick={() => handleCopy(walletAddress)}
                className="p-2 hover:bg-white/10 rounded-md transition text-zinc-400 hover:text-white"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handlePaymentComplete}
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('verifying')}
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                {t('iHavePaid')}
              </>
            )}
          </button>

          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            {t('warning')}
          </p>
        </div>
      </div>
    </div>
  );
}
