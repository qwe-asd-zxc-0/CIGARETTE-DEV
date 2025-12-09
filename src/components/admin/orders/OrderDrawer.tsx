"use client";

import { useState } from "react";
import { X, MapPin, Package, Truck, CreditCard, Save, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { updateOrderStatus, updateTrackingInfo } from "@/app/admin/orders/actions";

interface OrderDrawerProps {
  order: any; // 包含 user, items 等关联数据
  onClose: () => void;
}

export default function OrderDrawer({ order, onClose }: OrderDrawerProps) {
  const [status, setStatus] = useState(order.status || "pending_payment");
  const [tracking, setTracking] = useState({
    carrierName: order.carrierName || "",
    trackingNumber: order.trackingNumber || "",
    trackingUrl: order.trackingUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // 解析地址 JSON
  const address = order.shippingAddress as any; 

  const handleSaveStatus = async () => {
    setIsSaving(true);
    await updateOrderStatus(order.id, status);
    setIsSaving(false);
    alert("Status updated!");
  };

  const handleSaveTracking = async () => {
    setIsSaving(true);
    await updateTrackingInfo(order.id, tracking);
    setIsSaving(false);
    alert("Tracking info saved!");
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans text-zinc-100">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

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
            <h3 className="text-xl font-bold text-white">Order #{order.id.slice(0, 8)}</h3>
            <p className="text-xs text-zinc-500">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 1. 状态管理区域 */}
          <section className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Order Status</h4>
            <div className="flex gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="pending_payment">Pending Payment</option>
                <option value="paid">Paid (Processing)</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button 
                onClick={handleSaveStatus}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors"
              >
                Update
              </button>
            </div>
          </section>

          {/* 2. 物流信息 */}
          <section className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" /> Shipping & Tracking
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-400">Carrier Name</label>
                <input 
                  value={tracking.carrierName}
                  onChange={(e) => setTracking({...tracking, carrierName: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. DHL, FedEx"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400">Tracking Number</label>
                <input 
                  value={tracking.trackingNumber}
                  onChange={(e) => setTracking({...tracking, trackingNumber: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Tracking #"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] text-zinc-400">Tracking URL</label>
                <div className="flex gap-2">
                  <input 
                    value={tracking.trackingUrl}
                    onChange={(e) => setTracking({...tracking, trackingUrl: e.target.value})}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="https://..."
                  />
                  <button 
                    onClick={handleSaveTracking}
                    disabled={isSaving}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. 收货地址 & 客户 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping To
              </h4>
              <div className="bg-black/20 p-3 rounded-lg text-sm text-zinc-300 border border-white/5">
                {address ? (
                  <>
                    <p className="font-bold text-white mb-1">{address.firstName} {address.lastName}</p>
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p className="text-zinc-500 mt-1">{address.country}</p>
                    <p className="text-zinc-500">{address.phoneNumber}</p>
                  </>
                ) : <span className="text-zinc-600">No address data</span>}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Customer & Payment
              </h4>
              <div className="bg-black/20 p-3 rounded-lg text-sm text-zinc-300 border border-white/5 space-y-2">
                <div>
                  <span className="text-zinc-500 text-xs block">Customer</span>
                  <span className="text-white">{order.user?.email || order.guestEmail}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block">Payment Method</span>
                  <span className="text-white capitalize">{order.paymentMethod || "Unknown"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-xs block">Total Amount</span>
                  <span className="text-green-400 font-bold font-mono text-lg">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. 商品明细 */}
          <section>
             <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" /> Order Items ({order.items.length})
              </h4>
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-white/5 text-xs font-bold text-zinc-200">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items.map((item: any) => (
                      <tr key={item.id} className="bg-black/20">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-md relative overflow-hidden flex-shrink-0">
                              {/* 优先使用变体图，其次商品封面图 */}
                              {item.productVariant?.variantImageUrl || item.productVariant?.product?.coverImageUrl ? (
                                <Image 
                                  src={item.productVariant.variantImageUrl || item.productVariant.product.coverImageUrl} 
                                  alt="img" fill className="object-cover" 
                                />
                              ) : null}
                            </div>
                            <div>
                              <p className="text-white font-medium line-clamp-1">
                                {item.productTitleSnapshot}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {item.flavorSnapshot}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center text-white">x{item.quantity}</td>
                        <td className="p-3 text-right text-zinc-500">${Number(item.unitPrice).toFixed(2)}</td>
                        <td className="p-3 text-right text-white font-medium">
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