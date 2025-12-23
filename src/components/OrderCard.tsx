"use client";

import { useState } from "react";
import Image from "next/image";
import { Clock, Truck, ChevronRight, ChevronUp, Package, MapPin, Edit2, Check, X, History } from "lucide-react";
import { updateOrderAddress, ShippingAddress } from "@/app/[locale]/profile/orders/actions"; // 引入 Server Action
import { useTranslations } from 'next-intl';

export default function OrderCard({ order }: { order: any }) {
  const t = useTranslations('Profile');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // === 编辑地址相关状态 ===
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // 初始化表单数据 (从 order.shippingAddress 读取)
  const [addressForm, setAddressForm] = useState<ShippingAddress>(order.shippingAddress as ShippingAddress);

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending_payment: { label: t('statusPendingPayment'), color: "text-yellow-500 bg-yellow-500/10" },
    paid: { label: t('statusPaid'), color: "text-green-500 bg-green-500/10" },
    shipped: { label: t('statusShipped'), color: "text-blue-500 bg-blue-500/10" },
    completed: { label: t('statusCompleted'), color: "text-zinc-400 bg-zinc-500/10" },
    cancelled: { label: t('statusCancelled'), color: "text-red-500 bg-red-500/10" },
  };

  const status = STATUS_MAP[order.status || "pending_payment"] || STATUS_MAP["pending_payment"];
  
  // 判断是否允许修改地址 (只有 未发货 且 未取消 的订单可以改)
  const canEditAddress = ["pending_payment", "paid"].includes(order.status || "");

  // 处理保存地址
  const handleSaveAddress = async () => {
    setIsSaving(true);
    const res = await updateOrderAddress(order.id, addressForm);
    setIsSaving(false);
    
    if (res.success) {
      alert("✅ " + t('addressUpdateSuccess'));
      setIsEditingAddress(false);
    } else {
      alert(`❌ ${t('addressUpdateFailed')}: ${t(res.message)}`);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition">
      
      {/* === 头部 (点击展开) === */}
      <div 
        className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">
              {t('orderNo')}: <span className="font-mono text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</span>
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-white/5 ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t('orderTime')}: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">{t('orderAmount')}</p>
          <p className="text-lg font-bold text-white font-mono">${Number(order.totalAmount).toFixed(2)}</p>
        </div>
      </div>

      {/* === 展开的详情区域 === */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
          
          {/* 0. 取消原因 (如果已取消) */}
          {order.status === 'cancelled' && order.cancelReason && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
                {t('cancellationReason')}
              </h4>
              <p className="text-sm text-red-200">
                {order.cancelReason}
              </p>
            </div>
          )}

          {/* 1. 商品列表 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-3 h-3" /> {t('itemsList')}
            </h4>
            {order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 items-center bg-zinc-800/30 p-3 rounded-lg border border-white/5">
                <div className="relative w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                  {item.product?.coverImageUrl ? (
                    <Image src={item.product.coverImageUrl} alt="product" fill className="object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600"><Package className="w-4 h-4"/></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-200 line-clamp-1">{item.productTitleSnapshot}</p>
                  <p className="text-[10px] text-zinc-500">{item.flavorSnapshot}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-300 font-mono">x{item.quantity}</p>
                  <p className="text-sm font-bold text-white font-mono">${Number(item.unitPrice).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-[1px] bg-zinc-800 w-full"></div>

          {/* 2. 收货地址与状态追踪 (两列布局) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 左侧：收货地址 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> {t('shippingAddress')}
                </h4>
                {/* 只有允许修改且当前不在编辑模式时，显示编辑按钮 */}
                {canEditAddress && !isEditingAddress && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditingAddress(true); }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded"
                  >
                    <Edit2 className="w-3 h-3" /> {t('edit')}
                  </button>
                )}
              </div>

              {isEditingAddress ? (
                // === 编辑模式表单 ===
                <div className="bg-zinc-800/50 p-4 rounded-xl border border-blue-500/30 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      placeholder={t('namePlaceholder')}
                      value={addressForm.fullName || ""}
                      onChange={e => setAddressForm({...addressForm, fullName: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white w-full"
                    />
                    <input 
                      placeholder={t('phonePlaceholder')}
                      value={addressForm.phone || ""}
                      onChange={e => setAddressForm({...addressForm, phone: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white w-full"
                    />
                  </div>
                  <input 
                    placeholder={t('addressLine1Placeholder')}
                    value={addressForm.addressLine1 || ""}
                    onChange={e => setAddressForm({...addressForm, addressLine1: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white w-full"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input 
                      placeholder={t('cityPlaceholder')}
                      value={addressForm.city || ""}
                      onChange={e => setAddressForm({...addressForm, city: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white w-full"
                    />
                    <input 
                      placeholder={t('statePlaceholder')}
                      value={addressForm.state || ""}
                      onChange={e => setAddressForm({...addressForm, state: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white w-full"
                    />
                    <input 
                      placeholder={t('zipCodePlaceholder')}
                      value={addressForm.postalCode || ""}
                      onChange={e => setAddressForm({...addressForm, postalCode: e.target.value})}
                      className="bg-black/50 border border-white/10 rounded px-3 py-2 text-xs text-white w-full"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={handleSaveAddress}
                      disabled={isSaving}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs py-2 rounded flex items-center justify-center gap-1"
                    >
                      {isSaving ? t('saving') : <><Check className="w-3 h-3" /> {t('save')}</>}
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditingAddress(false);
                        setAddressForm(order.shippingAddress); // 还原数据
                      }}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs py-2 rounded flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" /> {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                // === 展示模式 ===
                <div className="text-sm text-zinc-300 bg-zinc-800/30 p-3 rounded-lg border border-white/5 space-y-1">
                  <p className="font-bold text-white">{order.shippingAddress?.fullName} <span className="text-zinc-500 font-normal">({order.shippingAddress?.phone})</span></p>
                  <p>{order.shippingAddress?.addressLine1}</p>
                  {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}</p>
                  <p>{order.shippingAddress?.country}</p>
                </div>
              )}
            </div>

            {/* 右侧：状态变更时间 */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <History className="w-3 h-3" /> {t('statusTracking')}
              </h4>
              <div className="bg-zinc-800/30 p-3 rounded-lg border border-white/5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  <div>
                    <p className="text-sm font-bold text-blue-400">{t('currentStatus')}: {status.label}</p>
                    {order.updatedAt ? (
                      <p className="text-xs text-zinc-400">{t('updatedAt')}: {new Date(order.updatedAt).toLocaleString()}</p>
                    ) : (
                      <p className="text-xs text-zinc-500">{t('updatedAt')}: {new Date(order.createdAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                {/* 运单号信息 */}
                {order.trackingNumber && (
                  <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                    <Truck className="w-4 h-4 text-zinc-400" />
                    <div>
                      <p className="text-xs text-zinc-400">{t('trackingNumber')}</p>
                      <p className="text-sm font-mono text-white select-all">{order.trackingNumber}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* === 底部操作栏 === */}
      <div className="px-6 py-4 bg-black/20 border-t border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Truck className="w-4 h-4" />
          {order.trackingNumber ? `${t('trackingNo')}: ${order.trackingNumber}` : t('awaitingShipment')}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-sm font-bold text-white hover:text-red-500 transition flex items-center gap-1 select-none"
        >
          {isExpanded ? t('collapseDetails') : t('viewDetails')} 
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}