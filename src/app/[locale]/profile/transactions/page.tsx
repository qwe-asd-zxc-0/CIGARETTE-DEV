import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, History, Wallet, RefreshCcw, ShoppingCart } from "lucide-react";
import { getTranslations } from 'next-intl/server';

export default async function TransactionsPage() {
  const t = await getTranslations('Profile');
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  // 辅助函数：获取交易类型的配置
  const getTransactionConfig = (type: string) => {
    switch (type) {
      case 'deposit':
        return {
          label: t('deposit'),
          icon: ArrowDownLeft,
          colorClass: 'text-green-500',
          bgClass: 'bg-green-500/10',
          sign: '+',
          amountClass: 'text-green-500'
        };
      case 'payment':
        return {
          label: t('payment'),
          icon: ShoppingCart,
          colorClass: 'text-white',
          bgClass: 'bg-zinc-800',
          sign: '-',
          amountClass: 'text-white'
        };
      case 'refund':
        return {
          label: t('refund'),
          icon: RefreshCcw,
          colorClass: 'text-blue-400',
          bgClass: 'bg-blue-500/10',
          sign: '+',
          amountClass: 'text-blue-400'
        };
      default:
        return {
          label: t('otherTransaction'),
          icon: History,
          colorClass: 'text-zinc-400',
          bgClass: 'bg-zinc-800',
          sign: '',
          amountClass: 'text-zinc-400'
        };
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t('backToProfile')}</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">{t('transactionHistory')}</h1>
        </div>

        {/* 汇总卡片 (可选) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl">
              <p className="text-zinc-500 text-xs font-bold uppercase mb-2">{t('totalExpenditure')}</p>
              <p className="text-2xl font-bold text-white">
                ${transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
              </p>
           </div>
           <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl">
              <p className="text-zinc-500 text-xs font-bold uppercase mb-2">{t('totalDeposit')}</p>
              <p className="text-2xl font-bold text-green-500">
                ${transactions.filter(t => t.type === 'deposit').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
              </p>
           </div>
           <div className="bg-zinc-900 border border-white/10 p-6 rounded-xl">
              <p className="text-zinc-500 text-xs font-bold uppercase mb-2">{t('totalRefund')}</p>
              <p className="text-2xl font-bold text-blue-400">
                ${transactions.filter(t => t.type === 'refund').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
              </p>
           </div>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                <History className="w-8 h-8" />
              </div>
              <p className="text-zinc-500">暂无交易记录</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((tx) => {
                const config = getTransactionConfig(tx.type);
                const Icon = config.icon;
                
                return (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass} ${config.colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold">{config.label}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            tx.status === 'completed' ? 'border-green-500/30 text-green-500' : 
                            tx.status === 'pending' ? 'border-yellow-500/30 text-yellow-500' : 
                            'border-red-500/30 text-red-500'
                          }`}>
                            {tx.status === 'completed' ? '成功' : tx.status === 'pending' ? '处理中' : '失败'}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 mt-0.5">
                          {tx.description || "无详细描述"}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          {new Date(tx.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold text-lg ${config.amountClass}`}>
                        {config.sign}${Number(tx.amount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
