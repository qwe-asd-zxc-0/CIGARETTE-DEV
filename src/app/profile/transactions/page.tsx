import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, History } from "lucide-react";

export default async function TransactionsPage() {
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

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/profile" 
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">返回账户</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">交易记录</h1>
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
              {transactions.map((tx) => (
                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' : 'bg-white/10 text-white'
                    }`}>
                      {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-white font-bold">
                        {tx.type === 'deposit' ? '充值' : tx.type === 'payment' ? '支付' : '退款'}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${
                      tx.type === 'deposit' ? 'text-green-500' : 'text-white'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
