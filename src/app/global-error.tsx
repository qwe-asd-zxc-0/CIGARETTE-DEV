'use client';

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased overflow-hidden`}>
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative">
          
          {/* 简单的 CSS 动画背景 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80" />
          
          <div className="relative z-10 max-w-md w-full animate-in fade-in zoom-in duration-500">
            <div className="mb-8">
              <h1 className="text-6xl font-black text-red-600 mb-2 tracking-tighter">OOPS!</h1>
              <h2 className="text-2xl font-bold text-white">Critical System Error</h2>
            </div>
            
            <div className="bg-zinc-900/50 border border-red-900/30 p-6 rounded-xl backdrop-blur-sm mb-8">
              <p className="text-zinc-400 text-sm font-mono break-all">
                {error.message || "An unexpected error has occurred."}
              </p>
            </div>

            <button
              onClick={() => reset()}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-transform hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
            >
              Refresh Application
            </button>
          </div>
          
          <div className="absolute bottom-8 text-zinc-600 text-xs">
            Global Tobacco System Protection
          </div>
        </div>
      </body>
    </html>
  );
}
