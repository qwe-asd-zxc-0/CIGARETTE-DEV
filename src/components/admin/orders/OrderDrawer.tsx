"use client";

import { useState } from "react";
import { X, MapPin, Package, Truck, CreditCard, Save, User, Mail, Phone, Ban } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { updateOrderStatus, updateTrackingInfo, cancelOrder } from "@/app/admin/(protected)/orders/actions";

interface OrderDrawerProps {
  order: any; // 包含 user, items 等关联数据
  onClose: () => void;
}

// 🇨🇳 状态汉化映射 (用于下拉菜单显示)
const STATUS_OPTIONS = [
  { value: "pending_payment", label: "待支付 (Pending Payment)" },
  { value: "paid", label: "已支付 (Paid)" },
  { value: "shipped", label: "已发货 (Shipped)" },
  { value: "completed", label: "已完成 (Completed)" },
  { value: "cancelled", label: "已取消 (Cancelled)" },
];

export default function OrderDrawer({ order, onClose }: OrderDrawerProps) {
  const [status, setStatus] = useState(order.status || "pending_payment");
  const [tracking, setTracking] = useState({
    carrierName: order.carrierName || "",
    trackingNumber: order.trackingNumber || "",
    trackingUrl: order.trackingUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // 解析地址 JSON (确保类型安全)
  const address = order.shippingAddress as any || {}; 

  const handleSaveStatus = async () => {
    setIsSaving(true);
    await updateOrderStatus(order.id, status);
    setIsSaving(false);
    alert("订单状态已更新！");
  };

  const handleSaveTracking = async () => {
    setIsSaving(true);
    await updateTrackingInfo(order.id, tracking);
    setIsSaving(false);
    alert("物流信息已保存！");
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans text-zinc-100">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* 抽屉内容 */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl h-full bg-zinc-900 border-l border-white/10 shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              订单号 <span className="font-mono text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              下单时间: {new Date(order.createdAt).toLocaleString('zh-CN', { hour12: false })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. 状态管理区域 */}
          <section className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
              订单状态管理 (Order Status)
            </h4>
            <div className="flex gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button 
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
              >
                更新状态
              </button>
            </div>
            
            {/* 取消订单按钮 */}
            {status !== 'cancelled' && status !== 'completed' && (
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={async () => {
                    if (confirm("确定要取消此订单吗？此操作不可撤销。")) {
                      setIsSaving(true);
                      const res = await cancelOrder(order.id);
                      setIsSaving(false);
                      if (res.success) {
                        setStatus('cancelled');
                        alert("订单已取消");
                      } else {
                        alert(res.message);
                      }
                    }
                  }}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Ban className="w-3 h-3" />
                  取消订单 (Cancel Order)
                </button>
              </div>
            )}
          </section>

          {/* 2. 物流信息 */}
          <section className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> 物流发货信息 (Shipping Info)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-400">物流公司 (Carrier)</label>
                <input 
                  value={tracking.carrierName}
                  onChange={(e) => setTracking({...tracking, carrierName: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="例如: DHL, FedEx,顺丰"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400">运单号 (Tracking No.)</label>
                <input 
                  value={tracking.trackingNumber}
                  onChange={(e) => setTracking({...tracking, trackingNumber: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="输入运单号..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-zinc-400">查询链接 (Tracking URL)</label>
                <div className="flex gap-2">
                  <input 
                    value={tracking.trackingUrl}
                    onChange={(e) => setTracking({...tracking, trackingUrl: e.target.value})}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="https://..."
                  />
                  <button 
                    onClick={handleSaveTracking}
                    disabled={isSaving}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg flex items-center gap-1 text-sm font-bold"
                  >
                    <Save className="w-4 h-4" /> 保存
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 收货地址 & 客户 (🔥 增强版) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 收货信息 */}
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 收货信息 (Shipping To)
              </h4>
              <div className="bg-black/20 p-4 rounded-lg text-sm text-zinc-300 border border-white/5 h-full relative group">
                {/* 复制按钮 (悬浮显示) */}
                <button 
                  onClick={() => {
                    const text = `${address.firstName} ${address.lastName}\n${address.phone || address.phoneNumber}\n${address.addressLine1} ${address.addressLine2 || ''}\n${address.city}, ${address.state} ${address.zipCode}\n${address.country}`;
                    navigator.clipboard.writeText(text);
                    alert("地址已复制到剪贴板！");
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-zinc-800 text-[10px] text-zinc-400 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                >
                  复制地址
                </button>

                {Object.keys(address).length > 0 ? (
                  <div className="space-y-2">
                    <p className="font-bold text-white text-base flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-400" />
                      {address.firstName} {address.lastName}
                    </p>
                    
                    {/* 联系方式 */}
                    <div className="space-y-1 text-xs text-zinc-400 border-b border-white/5 pb-2 mb-2">
                      {(address.phone || address.phoneNumber) && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" /> 
                          <span className="font-mono text-zinc-300">{address.phone || address.phoneNumber}</span>
                        </p>
                      )}
                      {address.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3 h-3" /> 
                          <span className="font-mono text-zinc-300">{address.email}</span>
                        </p>
                      )}
                    </div>

                    {/* 详细地址 */}
                    <div className="text-zinc-300 leading-relaxed">
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p className="text-zinc-400">{address.addressLine2}</p>}
                      <p className="font-medium mt-1">
                        {address.city}, {address.state} <span className="font-mono text-zinc-400">{address.zipCode}</span>
                      </p>
                      <p className="text-white font-bold mt-1">{address.country}</p>
                    </div>
                  </div>
                ) : <span className="text-zinc-600 italic">暂无地址数据</span>}
              </div>
            </div>

            {/* 客户与支付 */}
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> 客户与支付 (Payment)
              </h4>
              <div className="bg-black/20 p-4 rounded-lg text-sm text-zinc-300 border border-white/5 space-y-3 h-full">
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">客户账号 (Account)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-xs">{order.user?.email || order.guestEmail}</span>
                    {/* 简单判断是否注册用户 */}
                    {order.user ? (
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded">注册用户</span>
                    ) : (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded">游客</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block mb-0.5">支付方式 (Method)</span>
                  <span className="text-white capitalize">{order.paymentMethod || "未记录"}</span>
                </div>
                <div className="pt-2 border-t border-white/5 mt-2">
                  <span className="text-zinc-500 text-xs block mb-0.5">订单总额 (Total)</span>
                  <span className="text-green-400 font-bold font-mono text-xl">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 商品明细 */}
          <section>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> 商品明细 (Items: {order.items.length})
              </h4>
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-white/5 text-xs font-bold text-zinc-200">
                    <tr>
                      <th className="p-3 pl-4">商品名称 (Product)</th>
                      <th className="p-3 text-center">数量</th>
                      <th className="p-3 text-right">单价</th>
                      <th className="p-3 text-right pr-4">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items.map((item: any) => (
                      <tr key={item.id} className="bg-black/20 hover:bg-black/40 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-3">
                            {/* 图片 */}
                            <div className="w-10 h-10 bg-zinc-800 rounded-md relative overflow-hidden flex-shrink-0 border border-white/5">
                              {item.product?.coverImageUrl && (
                                <Image 
                                  src={item.product.coverImageUrl} 
                                  alt="img" fill className="object-cover" 
                                />
                              )}
                            </div>
                            {/* 文字信息 */}
                            <div>
                              <p className="text-white font-medium line-clamp-1 text-sm">
                                {item.productTitleSnapshot}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {item.flavorSnapshot}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center text-white font-mono">x{item.quantity}</td>
                        <td className="p-3 text-right text-zinc-500 font-mono">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-3 text-right text-white font-medium font-mono pr-4">
                          ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}