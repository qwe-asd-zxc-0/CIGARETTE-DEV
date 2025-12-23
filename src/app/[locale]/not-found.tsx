'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* 背景光晕效果 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-8 max-w-md relative z-10"
      >
        {/* 404 大字 - 带呼吸动画 */}
        <motion.h1 
          animate={{ 
            textShadow: [
              "0 0 20px rgba(220, 38, 38, 0.2)",
              "0 0 40px rgba(220, 38, 38, 0.4)",
              "0 0 20px rgba(220, 38, 38, 0.2)"
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 select-none"
        >
          404
        </motion.h1>
        
        <div className="relative -top-4 space-y-4">
          <h2 className="text-3xl font-bold text-white">{t('title')}</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            {t('description')}
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
        >
          <Link 
            href="/"
            className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            {t('backHome')}
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="group inline-flex items-center justify-center gap-2 px-8 py-3 border border-zinc-700 text-zinc-300 font-medium rounded-full hover:bg-zinc-900 hover:border-zinc-500 transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {t('backPrevious')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
