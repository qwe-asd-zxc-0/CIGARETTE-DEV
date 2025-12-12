// src/components/SearchInput.tsx
"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // 初始化时从 URL 获取搜索词
  const [term, setTerm] = useState(searchParams.get("q") || "");

  function handleSearch() {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    // 重置页码或其他参数视情况而定，这里保留 origin 用于在特定产地下搜索，或者您可以选择 params.delete('origin') 来进行全局搜索
    // 这里我们选择：搜索是全局的，重置产地筛选，这样逻辑更直观
    // params.delete("origin"); 
    
    startTransition(() => {
      router.push(`/product?${params.toString()}`);
    });
  }

  function handleClear() {
    setTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    startTransition(() => {
      router.push(`/product?${params.toString()}`);
    });
  }

  return (
    <div className="relative max-w-md mx-auto w-full group">
      <div className={`absolute inset-0 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded-full blur-md transition-opacity duration-300 ${term ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
      <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full overflow-hidden shadow-2xl focus-within:border-white/30 focus-within:bg-white/10 transition-all">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search collections..."
          className="w-full bg-transparent border-none px-6 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
        />
        
        {term && (
          <button 
            onClick={handleClear}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleSearch}
          disabled={isPending}
          className="pr-4 pl-2 text-zinc-400 hover:text-red-500 transition-colors"
        >
           {isPending ? (
             <div className="w-5 h-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
           ) : (
             <Search className="w-5 h-5" />
           )}
        </button>
      </div>
    </div>
  );
}