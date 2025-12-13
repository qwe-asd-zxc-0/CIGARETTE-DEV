"use client";

import { useState, useTransition } from "react";
import { updateProductStatus } from "@/app/admin/(protected)/products/actions";
import { Loader2 } from "lucide-react";

export default function ProductStatusBadge({ productId, status }: { productId: string, status: string }) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status || 'active');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setCurrentStatus(newStatus); // Optimistic update
    
    startTransition(async () => {
      const res = await updateProductStatus(productId, newStatus);
      if (!res.success) {
        setCurrentStatus(status); // Revert on failure
        alert(res.message);
      }
    });
  };

  const getStyle = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="relative inline-block group">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className={`appearance-none cursor-pointer px-2 py-1 rounded text-xs font-bold border ${getStyle(currentStatus)} focus:outline-none focus:ring-2 focus:ring-white/20 pr-6`}
        style={{ textAlignLast: 'center' }}
      >
        <option value="active" className="bg-zinc-900 text-green-400">上架 (Active)</option>
        <option value="draft" className="bg-zinc-900 text-yellow-400">草稿 (Draft)</option>
        <option value="archived" className="bg-zinc-900 text-red-400">下架 (Archived)</option>
      </select>
      
      {/* Custom Arrow */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
          <Loader2 className="w-3 h-3 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
