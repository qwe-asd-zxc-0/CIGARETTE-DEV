'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, CheckCircle, ShieldCheck as ShieldCheckIcon, Bitcoin } from "lucide-react";
import Link from "next/link";
import { rechargeBalance } from "./actions";
import { useTranslations } from 'next-intl';

interface RechargeClientProps {
  currentBalance: number;
}

export default function RechargeClient({ currentBalance }: RechargeClientProps) {
  const t = useTranslations('Profile');
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'crypto'>('crypto');

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      alert(t('enterValidAmount'));
      return;
    }
    
    if (val > 500) {
      alert("Maximum recharge amount is $500");
      return;
    }

    setLoading(true);
    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const res = await rechargeBalance(val);
    setLoading(false);

    if (res.success) {
      alert("✅ " + t(res.message));
      router.push("/profile");
      router.refresh();
    } else {
      alert("❌ " + t(res.message));
    }
  };

  const quickAmounts = [50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4">
      <div className="max-w-md mx-auto">
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t('backToProfile')}</span>
        </Link>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('balanceRecharge')}</h1>
            <p className="text-zinc-500 text-sm mt-2">{t('rechargeDesc')}</p>
            <div className="mt-4 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
              <span className="text-zinc-400 text-xs uppercase tracking-wider">{t('availableBalance')}</span>
              <div className="text-2xl font-bold text-white">${currentBalance.toFixed(2)}</div>
            </div>
          </div>

          <form onSubmit={handleRecharge} className="space-y-6">
            {/* Payment Method Selection */}
            <div className="grid grid-cols-1 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('crypto')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  paymentMethod === 'crypto' 
                    ? 'bg-white text-black border-white' 
                    : 'bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700'
                }`}
              >
                <Bitcoin className="w-6 h-6" />
                <span className="text-xs font-bold">Crypto</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                {t('rechargeAmount')} 
                <span className="text-xs text-zinc-500 ml-2">(Max: $500)</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > 500) return; // Prevent typing > 500
                    setAmount(e.target.value);
                  }}
                  placeholder="0.00"
                  className="w-full bg-black border border-white/10 rounded-xl py-4 pl-8 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-white/30 transition-colors"
                  step="0.01"
                  min="0.01"
                  max="500"
                />
              </div>
              {parseFloat(amount) > 500 && (
                <p className="text-red-500 text-xs mt-2">Maximum recharge amount is $500</p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  className="py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-bold transition-colors border border-white/5"
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  {t('processing')}
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-5 h-5" />
                  {t('rechargeNow')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
              <ShieldCheckIcon className="w-3 h-3" /> {t('securePayment')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
