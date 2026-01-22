'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Copy, Loader2, RefreshCw, Bitcoin } from "lucide-react";
import { initCryptoPayment, checkPaymentStatus } from "./actions";
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react'; // 需要 npm install qrcode.react

interface PaymentClientProps {
  order: {
    id: string;
    totalAmount: number;
    currency: string;
    createdAt: Date;
    status: string;
    paymentId?: string | null;
    paymentAddress?: string | null;
    paymentAmount?: number | null;
    paymentCoin?: string | null;
  };
}

// 定义币种分组数据
const CRYPTO_GROUPS = [
  {
    label: "Recommended / 推荐",
    options: [
      { value: "xmr", label: "XMR (Monero)" },
      { value: "usdt", label: "USDT (TRC20)" },
      { value: "btc", label: "BTC (Bitcoin)" },
      { value: "ltc", label: "LTC (Litecoin)" },
      { value: "eth", label: "ETH (Ethereum)" },
    ]
  },
  {
    label: "Stablecoins / 稳定币",
    options: [
      { value: "usdt_erc20", label: "USDT (ERC20)" },
      { value: "usdt_bep20", label: "USDT (BSC)" },
      { value: "usdt_sol", label: "USDT (Solana)" },
      { value: "usdt_poly", label: "USDT (Polygon)" },
      { value: "usdt_ton", label: "USDT (TON)" },
      { value: "usdc", label: "USDC (ERC20)" },
      { value: "usdc_trc20", label: "USDC (TRC20)" },
      { value: "usdc_bep20", label: "USDC (BSC)" },
      { value: "usdc_sol", label: "USDC (Solana)" },
      { value: "usdc_poly", label: "USDC (Polygon)" },
      { value: "dai", label: "DAI (ERC20)" },
      { value: "busd", label: "BUSD (BSC)" },
    ]
  },
  {
    label: "Major Chains / 主流公链",
    options: [
      { value: "trx", label: "TRX (Tron)" },
      { value: "sol", label: "SOL (Solana)" },
      { value: "bnb", label: "BNB (BSC)" },
      { value: "matic", label: "MATIC (Polygon)" },
      { value: "avax", label: "AVAX (Avalanche)" },
      { value: "ftm", label: "FTM (Fantom)" },
      { value: "ton", label: "TON (Toncoin)" },
      { value: "ada", label: "ADA (Cardano)" },
      { value: "xrp", label: "XRP (Ripple)" },
      { value: "doge", label: "DOGE (Dogecoin)" },
      { value: "kas", label: "KAS (Kaspa)" },
    ]
  },
  {
    label: "Privacy / 隐私",
    options: [
      { value: "bch", label: "BCH (Bitcoin Cash)" },
      { value: "dash", label: "DASH (Dash)" },
      { value: "zec", label: "ZEC (Zcash)" },
      { value: "etc", label: "ETC (Ethereum Classic)" },
      { value: "dgb", label: "DGB (DigiByte)" },
      { value: "rvn", label: "RVN (Ravencoin)" },
    ]
  },
  {
    label: "Others / 其他",
    options: [
      { value: "arb", label: "ARB (Arbitrum)" },
      { value: "op", label: "OP (Optimism)" },
      { value: "base", label: "Base (ETH)" },
      { value: "dot", label: "DOT (Polkadot)" },
      { value: "atom", label: "ATOM (Cosmos)" },
      { value: "near", label: "NEAR (Protocol)" },
      { value: "algo", label: "ALGO (Algorand)" },
      { value: "fil", label: "FIL (Filecoin)" },
      { value: "xtz", label: "XTZ (Tezos)" },
      { value: "eos", label: "EOS" },
      { value: "shib", label: "SHIB (ERC20)" },
      { value: "link", label: "LINK (ERC20)" },
      { value: "uni", label: "UNI (ERC20)" },
    ]
  }
];

export default function PaymentClient({ order }: PaymentClientProps) {
  const t = useTranslations('Payment'); // 确保你有对应的翻译文件
  const router = useRouter();
  
  const [selectedCoin, setSelectedCoin] = useState('xmr'); // 默认 XMR
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    address: string;
    amount: number;
    coin: string;
  } | null>(
    order.paymentAddress && order.paymentAmount && order.paymentCoin
      ? { address: order.paymentAddress, amount: Number(order.paymentAmount), coin: order.paymentCoin }
      : null
  );
  const [status, setStatus] = useState(order.status);
  const [copied, setCopied] = useState(false);

  // 轮询检查状态
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentData && status !== 'paid') {
      interval = setInterval(async () => {
        const res = await checkPaymentStatus(order.id);
        if (res.success && res.status === 'paid') {
          setStatus('paid');
          clearInterval(interval);
          // 支付成功后延迟跳转
          setTimeout(() => router.push("/profile/orders"), 2000);
        }
      }, 10000); // 每10秒检查一次
    }
    return () => clearInterval(interval);
  }, [paymentData, status, order.id, router]);

  const handleGenerateAddress = async () => {
    setLoading(true);
    // 默认 mainnet，实际可扩展选择网络
    const res = await initCryptoPayment(order.id, selectedCoin, 'mainnet');
    
    if (res.success && res.paymentAddress) {
      setPaymentData({
        address: res.paymentAddress,
        amount: res.paymentAmount!,
        coin: selectedCoin
      });
    } else {
      alert("Failed to generate payment address: " + res.message);
    }
    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 支付成功状态页面
  if (status === 'paid') {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        {/* Background Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-neutral-950" />
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
        </div>

        <div className="relative z-10 max-w-md w-full bg-zinc-900/80 backdrop-blur-xl border border-green-500/30 rounded-2xl p-8 text-center animate-in zoom-in duration-300 mx-4">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">{t('paymentSuccessful')}</h2>
          <p className="text-zinc-400 text-lg">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center pt-20 pb-12 px-4 sm:px-6">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="bg-zinc-800/30 p-6 text-center border-b border-white/5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 text-red-500 mb-4 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
            <Bitcoin className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('title')}</h1>
          <p className="text-zinc-400 text-sm mt-2 font-mono bg-zinc-800/50 inline-block px-3 py-1 rounded-full">
            {t('orderNo')} {order.id.slice(0, 8)}
          </p>
        </div>

        <div className="p-6 space-y-6 flex-1">
          
          {/* Amount Display */}
          <div className="text-center bg-zinc-950/50 p-4 rounded-xl border border-white/5">
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mb-1">{t('orderTotal')}</p>
            <div className="text-4xl font-black text-white tracking-tight">
              ${Number(order.totalAmount).toFixed(2)} <span className="text-lg text-zinc-500 font-medium">USD</span>
            </div>
          </div>

          {!paymentData ? (
            /* Selection Phase */
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 block ml-1">{t('selectCurrency')}</label>
                <div className="relative">
                  <select 
                    value={selectedCoin}
                    onChange={(e) => setSelectedCoin(e.target.value)}
                    className="w-full appearance-none bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition shadow-sm text-ellipsis overflow-hidden"
                  >
                    {CRYPTO_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label} className="bg-zinc-900 text-zinc-400 font-semibold">
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value} className="text-white py-1">
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 px-1 leading-relaxed">
                  {t('recommendation')}
                </p>
              </div>

              <button
                onClick={handleGenerateAddress}
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Processing...</span>
                  </>
                ) : (
                  t('payNow')
                )}
              </button>
            </div>
          ) : (
            /* Payment Phase */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Instructions */}
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm text-red-200 text-center leading-relaxed" dangerouslySetInnerHTML={{ __html: t.raw('instruction') }}>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-2xl mx-auto w-fit h-fit shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <QRCodeSVG 
                  value={`${paymentData.coin}:${paymentData.address}?amount=${paymentData.amount}`}
                  size={200}
                  level={"M"}
                  includeMargin={false}
                />
              </div>

              {/* Address & Amount Details */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('amountToSend')}</label>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 group hover:border-zinc-600 transition-colors">
                    <span className="text-xl font-mono font-bold text-white tracking-tight">{paymentData.amount}</span>
                    <span className="text-sm font-bold text-red-400 uppercase bg-red-400/10 px-2 py-0.5 rounded">{paymentData.coin}</span>
                    <button 
                       onClick={() => handleCopy(paymentData.amount.toString())}
                       className="ml-auto p-2 -mr-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('depositAddress')}</label>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 group hover:border-zinc-600 transition-colors">
                    <code className="text-sm text-zinc-300 flex-1 break-all font-mono leading-relaxed">{paymentData.address}</code>
                    <button 
                      onClick={() => handleCopy(paymentData.address)}
                      className="p-2 -mr-2 hover:bg-white/10 rounded-lg transition text-zinc-400 hover:text-white shrink-0"
                    >
                      {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-3 text-zinc-400 text-sm bg-zinc-800/30 py-3 rounded-lg">
                <RefreshCw className="w-4 h-4 animate-spin text-red-500" />
                {t('waitingForPayment')}
              </div>
              
              <button 
                 onClick={() => setPaymentData(null)}
                 className="w-full py-3 text-zinc-500 text-sm hover:text-white transition-colors border border-transparent hover:border-zinc-800 rounded-lg"
              >
                Cancel / Change Currency
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}