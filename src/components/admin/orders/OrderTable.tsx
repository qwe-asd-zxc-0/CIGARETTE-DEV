"use client";

import { useState } from "react";
import { Eye, Search, Filter, Calendar, Download, Upload, CheckSquare, Square, FileDown } from "lucide-react";
import { AnimatePresence } from "framer-motion";
// 注意：确保 OrderDrawer 组件路径正确，且自身无语法错误
import OrderDrawer from "./OrderDrawer";

// 🇨🇳 状态汉化映射表
const STATUS_MAP: Record<string, string> = {
  all: "全部",
  pending_payment: "待支付",
  paid: "已支付",
  shipped: "已发货",
  completed: "已完成",
  cancelled: "已取消",
};

export default function OrderTable({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // ✅ 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const filteredOrders = orders.filter(order => {
    // 状态筛选
    if (statusFilter !== "all" && order.status !== statusFilter) return false;
    
    // 日期筛选
    if (dateFilter) {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      if (orderDate !== dateFilter) return false;
    }

    // 搜索 (ID 或 Email)
    const query = search.toLowerCase();
    const matchId = order.id.toLowerCase().includes(query);
    const email = order.user?.email || order.guestEmail || "";
    const matchEmail = email.toLowerCase().includes(query);
    return matchId || matchEmail;
  });

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // 单选
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发详情弹窗
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // 导出功能
  const handleExport = async () => {
    if (selectedIds.size === 0) {
      alert("请先选择要导出的订单");
      return;
    }
    
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/orders/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds) })
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert("导出失败，请重试");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // 导入发货信息
  const handleImportShipping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/orders/import-shipping', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        if (data.errors && data.errors.length > 0) {
          console.warn("Import warnings:", data.errors);
          alert("部分行处理失败，请查看控制台详情");
        }
        window.location.reload(); // 刷新页面以显示新状态
      } else {
        alert("导入失败: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("网络错误");
    } finally {
      setIsImporting(false);
      e.target.value = ''; // 重置 input
    }
  };

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
      {/* 工具栏 - 修正：闭合外层 div，避免层级错乱 */}
      <div className="flex flex-col gap-4">
        {/* 第一行：操作按钮组 */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
             {/* 导出按钮 */}
             <button
              onClick={handleExport}
              disabled={selectedIds.size === 0 || isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                selectedIds.size > 0 
                  ? "bg-green-600 hover:bg-green-500 text-white" 
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Download className="w-4 h-4" />
              {isExporting ? "导出中..." : `导出选中 (${selectedIds.size})`}
            </button>

            {/* 导入发货按钮 */}
            <div className="flex items-center gap-2">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-colors ${isImporting ? 'opacity-50' : ''}`}>
                <Upload className="w-4 h-4" />
                {isImporting ? "导入中..." : "批量发货 (Import)"}
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleImportShipping} 
                  disabled={isImporting}
                  className="hidden" 
                />
              </label>
              
              {/* 下载模板链接 */}
              <a 
                href="/api/admin/orders/download-shipping-template"
                className="text-zinc-400 hover:text-blue-400 text-xs flex items-center gap-1 underline"
                title="下载发货导入模板"
              >
                <FileDown className="w-3 h-3" /> 模板
              </a>
            </div>
          </div>
        </div>

        {/* 第二行：筛选器 */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* 状态筛选按钮组 */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full no-scrollbar">
            {['all', 'pending_payment', 'paid', 'shipped', 'completed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  statusFilter === s 
                    ? "bg-zinc-800 text-white shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {STATUS_MAP[s] || s}
              </button>
            ))}
          </div>

          {/* 搜索框和日期筛选 */}
          <div className="flex gap-4 w-full md:w-auto">
            {/* 日期筛选 */}
            <div className="relative group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600 [&::-webkit-calendar-picker-indicator]:invert cursor-pointer"
              />
            </div>

            {/* 搜索框 */}
            <div className="relative group w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                placeholder="搜索订单号 / 客户邮箱..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* 每日订单统计摘要 */}
        {dateFilter && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-wrap items-center gap-6 text-blue-200 text-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="font-bold">{dateFilter} 统计:</span>
            </div>
            <div>
              总订单数: <span className="font-mono font-bold text-white ml-2">{filteredOrders.length}</span>
            </div>
            <div>
              总金额: <span className="font-mono font-bold text-white ml-2">${filteredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div> {/* 修正：在这里闭合工具栏外层 div，解决层级错乱问题 */}

      {/* 表格 - 修正：移出工具栏外层 div，作为独立节点 */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/5 font-bold text-xs text-zinc-200">
              <tr>
                <th className="p-4 pl-6 w-10">
                  <button 
                    onClick={handleSelectAll}
                    className="flex items-center justify-center text-zinc-400 hover:text-white"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredOrders.length ? (
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="p-4 whitespace-nowrap">订单号 (Order ID)</th>
                <th className="p-4 whitespace-nowrap">客户信息</th>
                <th className="p-4 text-center whitespace-nowrap">当前状态</th>
                <th className="p-4 text-right whitespace-nowrap">总金额</th>
                <th className="p-4 text-right whitespace-nowrap">下单时间</th>
                <th className="p-4 text-right pr-6 whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  className={`hover:bg-white/5 transition-colors cursor-pointer group ${selectedIds.has(order.id) ? 'bg-blue-500/5' : ''}`}
                >
                  <td className="p-4 pl-6" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => toggleSelect(order.id, e)}
                      className="flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      {selectedIds.has(order.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="p-4 font-mono text-white group-hover:text-blue-400 transition-colors">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="p-4">
                    <p className="text-white font-medium">{order.user?.fullName || "游客用户"}</p>
                    <p className="text-xs text-zinc-500">{order.user?.email || order.guestEmail}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded border text-[11px] font-bold ${getStatusColor(order.status || "")}`}>
                      {STATUS_MAP[order.status || ""] || order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-white">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="p-4 text-right text-xs">
                    {new Date(order.createdAt).toLocaleString('zh-CN', { hour12: false })}
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button className="p-2 bg-zinc-800 rounded-lg hover:bg-white/10 hover:text-white transition-colors" title="查看详情">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  {/* 修正：colSpan 从 6 改为 7，匹配表格列数 */}
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center gap-2">
                      <Filter className="w-8 h-8 opacity-20" />
                      <p>暂无符合条件的订单数据</p>
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