"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { motion, AnimatePresence } from "framer-motion";
import { X, TicketPercent, Gift } from "lucide-react";

export default function CouponPopup() {
  const router = useRouter();
  
  // 状态管理
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  // 优惠券配置
  const couponConfig = {
    title: "Welcome Gift",
    // 👇 核心文案：去掉了 Code，直接强调注册福利
    description: "Register now to get 10% OFF your first order", 
  };

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenCoupon");

    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setIsMinimized(false); 
        sessionStorage.setItem("hasSeenCoupon", "true");
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      setIsMinimized(true);
    }
  }, []);

  const handleMinimize = () => {
    setIsOpen(false);
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsOpen(true);
  };

  const handleGetCoupon = () => {
    router.push("/sign-up"); // 跳转注册页
    setIsOpen(false);
    setIsMinimized(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* ==================== 状态 A: 完整大弹窗 ==================== */}
        {isOpen && !isMinimized && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0 font-sans">
            {/* 黑色遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMinimize}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] cursor-pointer"
            />

            {/* 弹窗主体 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* 背景装饰光 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-[50px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/10 rounded-full blur-[50px] pointer-events-none" />

              {/* 关闭按钮 */}
              <button
                onClick={handleMinimize}
                className="absolute top-3 right-3 p-2 text-zinc-500 hover:text-white transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 内容区 */}
              <div className="p-8 flex flex-col items-center text-center relative z-0">
                
                {/* 图标 (换成了 Gift 图标，更有新人礼的感觉) */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center mb-6 shadow-lg shadow-red-900/40 ring-4 ring-black/50">
                  <Gift className="w-10 h-10 text-white animate-bounce-slow" />
                </div>

                <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-3">
                  {couponConfig.title}
                </h2>

                {/* 🚀 核心修改：放大并加粗文案 */}
                <p className="text-2xl font-bold text-white mb-8 leading-snug px-2">
                  Register now to get <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                    10% OFF
                  </span>
                  <br />
                  your first order
                </p>

                {/* 跳转按钮 */}
                <button
                  onClick={handleGetCoupon}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  GET IT NOW
                  <TicketPercent className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ==================== 状态 B: 最小化悬浮图标 ==================== */}
        {isMinimized && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRestore}
            className="fixed bottom-24 right-6 z-50 group w-14 h-14 rounded-full shadow-lg shadow-red-900/20 flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 border border-white/10"
            aria-label="Get Coupon"
          >
            {/* 提示气泡 */}
            <div className="absolute right-full mr-3 px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none origin-right scale-95 group-hover:scale-100">
              Get 10% OFF
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
            </div>

            <Gift className="w-6 h-6 text-white" />
            
            {/* 红点提示 */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-zinc-900"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}