'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet, CreditCard, CheckCircle, ShieldCheck as ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { rechargeBalance } from "./actions";
import { useTranslations } from 'next-intl';

export default function RechargePage() {
  const t = useTranslations('Profile');
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      alert(t('enterValidAmount'));
      return;
    }

    setLoading(true);
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
          </div>

          <form onSubmit={handleRecharge} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">{t('rechargeAmount')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black border border-white/10 rounded-xl py-4 pl-8 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-white/30 transition-colors"
                  step="0.01"
                  min="0.01"
                />
              </div>
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
              {loading ? t('processing') : t('rechargeNow')}
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

function ShieldCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
