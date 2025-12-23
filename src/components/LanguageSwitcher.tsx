'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useTransition, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', label: 'English', flagCode: 'us' },
  { code: 'zh', label: '中文', flagCode: 'cn' },
  { code: 'ms', label: 'Malay', flagCode: 'my' },
  { code: 'th', label: 'Thai', flagCode: 'th' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nextLocale: string) => {
    setIsOpen(false);
    if (nextLocale === locale) return;
    
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/50 hover:bg-zinc-800 border border-white/10 transition-all text-sm text-zinc-300 hover:text-white group"
      >
        <img
          src={`https://flagcdn.com/w40/${currentLang.flagCode}.png`}
          srcSet={`https://flagcdn.com/w80/${currentLang.flagCode}.png 2x`}
          width="20"
          height="15"
          alt={currentLang.label}
          className="rounded-[2px] object-cover shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
        />
        <span className="font-medium">{currentLang.label}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-40 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 ring-1 ring-black/5"
          >
            <div className="py-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${
                    locale === lang.code 
                      ? 'bg-white/10 text-white font-medium' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://flagcdn.com/w40/${lang.flagCode}.png`}
                      srcSet={`https://flagcdn.com/w80/${lang.flagCode}.png 2x`}
                      width="20"
                      height="15"
                      alt={lang.label}
                      className="rounded-[2px] object-cover shadow-sm"
                    />
                    <span>{lang.label}</span>
                  </div>
                  {locale === lang.code && (
                    <Check className="w-3.5 h-3.5 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
