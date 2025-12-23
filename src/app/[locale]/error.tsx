'use client'; // 错误组件必须是 Client Component

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Error');

  useEffect(() => {
    // 这里可以将错误日志发送到你的日志服务 (如 Sentry)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center py-20 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-900/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-zinc-800/20 rounded-full blur-[80px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-zinc-900/80 border border-white/10 p-8 rounded-3xl max-w-lg w-full backdrop-blur-xl shadow-2xl relative z-10"
      >
        <motion.div 
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20"
        >
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-white mb-3">{t('title')}</h2>
        <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
          {t('description')}
          <br />
          <span className="inline-block mt-3 px-3 py-1 bg-black/30 rounded text-xs font-mono text-red-400/80 border border-red-900/20">
            Error: {error.message || "Unknown error occurred"}
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={
              // 尝试恢复
              () => reset()
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-red-900/20 active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            尝试重新加载
          </button>
          
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
