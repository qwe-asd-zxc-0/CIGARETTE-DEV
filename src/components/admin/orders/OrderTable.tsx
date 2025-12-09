"use client";

import { useState } from "react";
import { Eye, Search, Filter } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import OrderDrawer from "./OrderDrawer";

export default function OrderTable({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filteredOrders = orders.filter(order => {
    // 状态筛选
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    // 搜索 (ID 或 Email)
    const query = search.toLowerCase();
    const matchId = order.id.toLowerCase().includes(query);
    const email = order.user?.email || order.guestEmail || "";
    const matchEmail = email.toLowerCase().includes(query);
    return matchId || matchEmail;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case 'shipped': return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case 'completed': return "bg-green-500/10 text-green-400 border-green-500/20";
      case 'cancelled': return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"; // pending
    }
  };

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
          {['all', 'pending_payment', 'paid', 'shipped', 'completed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-all ${
                statusFilter === s 
                  ? "bg-zinc-800 text-white shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            type="text"
            placeholder="Search Order ID / Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/5 uppercase font-bold text-xs tracking-wider text-zinc-200">
              <tr>
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4 text-right">Date</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="p-4 pl-6 font-mono text-white group-hover:text-blue-400 transition-colors">
                    #{order.id.slice(0, 8)}...
                  </td>
                  <td className="p-4">
                    <p className="text-white font-medium">{order.user?.fullName || "Guest"}</p>
                    <p className="text-xs text-zinc-500">{order.user?.email || order.guestEmail}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded border text-[10px] uppercase font-bold ${getStatusColor(order.status || "")}`}>
                      {order.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-white">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-xs">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button className="p-2 bg-zinc-800 rounded-lg hover:bg-white/10 hover:text-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8 opacity-20" />
                      <p>No orders found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}