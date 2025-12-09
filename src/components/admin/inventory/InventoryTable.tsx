"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Search, Save, Bell, Loader2, Filter 
} from "lucide-react";
import { updateStock, notifySubscribers } from "@/app/admin/inventory/actions";
import { useRouter } from "next/navigation";

// 定义 props 类型
interface VariantWithProduct {
  id: string;
  skuCode: string | null;
  flavor: string;
  nicotineStrength: string;
  price: number | null; 
  stockQuantity: number | null;
  variantImageUrl: string | null;
  product: {
    title: string;
    coverImageUrl: string | null;
  } | null;
  _count: {
    // ✅ 修复：这里也要同步改为 restockSubs
    restockSubs: number; 
  };
}

export default function InventoryTable({ variants }: { variants: VariantWithProduct[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null); 
  const [editingStock, setEditingStock] = useState<{ [key: string]: string }>({}); 

  // 本地过滤逻辑
  const filteredVariants = variants.filter((v) => {
    const stock = v.stockQuantity || 0;
    
    if (filter === 'low' && stock >= 10) return false;
    if (filter === 'out' && stock > 0) return false;
    
    const query = search.toLowerCase();
    const matchTitle = v.product?.title.toLowerCase().includes(query);
    const matchSku = v.skuCode?.toLowerCase().includes(query);
    const matchFlavor = v.flavor.toLowerCase().includes(query);
    
    return matchTitle || matchSku || matchFlavor;
  });

  const handleStockChange = (id: string, value: string) => {
    setEditingStock(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveStock = async (id: string, currentStock: number) => {
    const newValStr = editingStock[id];
    if (newValStr === undefined) return; 

    const newVal = parseInt(newValStr);
    if (isNaN(newVal) || newVal < 0) {
      alert("Please enter a valid stock number");
      return;
    }

    if (newVal === currentStock) {
      const newState = { ...editingStock };
      delete newState[id];
      setEditingStock(newState);
      return;
    }

    setLoadingId(id);
    const res = await updateStock(id, newVal);
    setLoadingId(null);

    if (res.success) {
      const newState = { ...editingStock };
      delete newState[id];
      setEditingStock(newState);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  const handleNotify = async (id: string) => {
    if (!confirm("Send restock notification emails to subscribers?")) return;
    
    setLoadingId(id);
    const res = await notifySubscribers(id);
    setLoadingId(null);
    
    if (res.success) {
      alert(res.message);
      router.refresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
          {(['all', 'low', 'out'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === type 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {type === 'all' && 'All Items'}
              {type === 'low' && 'Low Stock (<10)'}
              {type === 'out' && 'Out of Stock (0)'}
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search SKU, Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-all"
          />
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/5 uppercase font-bold text-xs tracking-wider text-zinc-200">
              <tr>
                <th className="p-4 pl-6">Product & Variant</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock Level</th>
                <th className="p-4 text-center">Waitlist</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredVariants.map((variant) => {
                const stock = variant.stockQuantity || 0;
                const isEditing = editingStock[variant.id] !== undefined;
                const displayStock = isEditing ? editingStock[variant.id] : stock;
                const isLowStock = stock < 10 && stock > 0;
                const isOutOfStock = stock === 0;
                // ✅ 修复：取值使用 restockSubs
                const subscriptionCount = variant._count.restockSubs; 

                return (
                  <tr key={variant.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden relative border border-white/10 flex-shrink-0">
                          {(variant.variantImageUrl || variant.product?.coverImageUrl) ? (
                            <Image 
                              src={variant.variantImageUrl || variant.product?.coverImageUrl || ""} 
                              alt="img" 
                              fill 
                              className="object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">IMG</div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white line-clamp-1">{variant.product?.title || "Unknown Product"}</p>
                          <p className="text-xs text-zinc-500">
                            {variant.flavor} · {variant.nicotineStrength}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-xs">{variant.skuCode || '-'}</td>
                    <td className="p-4 font-mono text-zinc-300">${Number(variant.price).toFixed(2)}</td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={displayStock}
                          onChange={(e) => handleStockChange(variant.id, e.target.value)}
                          className={`w-20 bg-black/40 border rounded-lg px-2 py-1 text-center font-mono text-sm focus:outline-none transition-all ${
                            isEditing 
                              ? "border-blue-500 text-white" 
                              : isOutOfStock 
                                ? "border-red-900/50 text-red-500 bg-red-900/10" 
                                : isLowStock 
                                  ? "border-orange-900/50 text-orange-500 bg-orange-900/10"
                                  : "border-white/10 text-zinc-300"
                          }`}
                        />
                        {isEditing && (
                          <button
                            onClick={() => handleSaveStock(variant.id, stock)}
                            disabled={loadingId === variant.id}
                            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                            title="Save Stock"
                          >
                            {loadingId === variant.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 补货订阅数展示 */}
                    <td className="p-4 text-center">
                      {subscriptionCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                          <Bell className="w-3 h-3" />
                          {subscriptionCount}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => handleNotify(variant.id)}
                        disabled={subscriptionCount === 0 || stock === 0 || loadingId === variant.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          subscriptionCount > 0 && stock > 0
                            ? "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
                        }`}
                      >
                        {loadingId === variant.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                        Notify
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredVariants.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                    <Filter className="w-8 h-8 opacity-20" />
                    <p>No inventory items match your filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}