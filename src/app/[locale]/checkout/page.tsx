"use client";

import { useState, useEffect } from "react";
import { useCartDrawer } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { 
  Lock, ArrowLeft, Loader2, MapPin, User, Phone, 
  Minus, Plus, ShoppingBag, Globe, Building, Mail 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from 'next-intl';
import { getTrans } from '@/lib/i18n-utils';
import { createOrder } from "./actions";

// === 📦 组件：数量输入框 ===
function QuantityInput({ 
  item, 
  updateQuantity, 
  removeFromCart 
}: { 
  item: any, 
  updateQuantity: (id: string, delta: number) => void, 
  removeFromCart: (id: string) => void 
}) {
  const [val, setVal] = useState(item.quantity.toString());

  useEffect(() => {
    setVal(item.quantity.toString());
  }, [item.quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setVal(inputVal); 
    if (inputVal === "") return;
    const num = parseInt(inputVal);
    if (isNaN(num)) return;
    if (num === 0) {
      removeFromCart(item.id);
    } else {
      let target = num;
      if (target > item.stock) {
        target = item.stock;
        setVal(target.toString());
      }
      const delta = target - item.quantity;
      if (delta !== 0) updateQuantity(item.id, delta);
    }
  };

  const handleBlur = () => {
    if (val === "" || isNaN(parseInt(val))) {
      setVal(item.quantity.toString());
    }
  };

  return (
    <input
      type="number"
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
      className="text-xs text-white font-mono font-bold w-8 text-center bg-transparent focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

export default function CheckoutPage() {
  const t = useTranslations('Checkout');
  const locale = useLocale();
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCartDrawer();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 表单状态
  const [formData, setFormData] = useState({
    email: "", 
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Singapore" // 默认值保持英文 Key，方便后端处理
  });

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; 

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 提交订单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert(t('cartEmptyAlert'));
    
    setLoading(true);

    try {
      const payload = new FormData();
      
      payload.append("email", formData.email);

      // 自动拆分全名
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || "-";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ".";

      payload.append("firstName", firstName);
      payload.append("lastName", lastName);
      payload.append("fullName", formData.fullName);
      
      payload.append("phone", formData.phone);
      payload.append("addressLine1", formData.addressLine1);
      payload.append("addressLine2", formData.addressLine2);
      payload.append("city", formData.city);
      payload.append("state", formData.state);
      payload.append("postalCode", formData.postalCode);
      payload.append("country", formData.country);

      const itemsPayload = cartItems.map(item => ({
        productVariantId: item.id,
        quantity: item.quantity
      }));
      payload.append("items", JSON.stringify(itemsPayload));

      const result = await createOrder(payload);

      if (!result) {
         throw new Error("Order creation failed"); 
      }

      if (result && result.orderId) {
          if (clearCart) clearCart(); 
          else cartItems.forEach(item => removeFromCart(item.id)); 
          router.push(`/checkout/payment/${result.orderId}`);
      }

    } catch (error: any) {
      console.error("Order creation failed:", error);
      if (error.message !== "NEXT_REDIRECT") {
          alert(error.message || t('orderFailedAlert'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-6 relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-zinc-900/80 backdrop-blur-md rounded-full flex items-center justify-center border border-zinc-800 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
             <ShoppingBag className="w-8 h-8 text-zinc-600" />
          </div>
          <div className="text-center mt-6">
              <h2 className="text-xl font-bold text-white">{t('cartEmptyTitle')}</h2>
              <p className="text-zinc-500 mt-2 text-sm">{t('cartEmptyDesc')}</p>
          </div>
          <Link href="/product" className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition shadow-lg shadow-white/10">
            {t('returnToShop')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 lg:grid-cols-2 relative pt-28 overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>
      
      {/* ==================== 左侧：订单详情 ==================== */}
      <div className="relative bg-zinc-900/30 backdrop-blur-sm border-b lg:border-b-0 lg:border-r border-white/5 p-6 md:p-12 lg:p-20 order-1 lg:order-1 lg:min-h-screen z-10">
        <div className="max-w-md mx-auto lg:ml-auto sticky top-12">
            <div className="mb-8">
              <Link href="/cart" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> {t('backToCart')}
              </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">{t('orderSummary')} ({cartItems.length})</h2>
            
            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-4 items-center group bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="relative w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    {item.image && <Image src={item.image} alt={getTrans(item.titleJson || item.title, locale)} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-200 line-clamp-1">{getTrans(item.titleJson || item.title, locale)}</p>
                    <p className="text-xs text-zinc-500 truncate">{getTrans(item.flavorJson || item.flavor, locale)} / {item.strength}</p>
                    {item.quantity >= item.stock && <p className="text-[10px] text-red-500 mt-0.5">{t('stockLimitReached')}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-sm text-white font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                    <div className="flex items-center bg-black border border-zinc-700 rounded px-1 py-0.5 scale-90 origin-right">
                        <button onClick={() => updateQuantity(item.id, -1)} className="text-zinc-400 hover:text-white disabled:opacity-30 p-1" disabled={item.quantity <= 1}><Minus className="w-3 h-3" /></button>
                        <QuantityInput item={item} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
                        <button onClick={() => updateQuantity(item.id, 1)} className="text-zinc-400 hover:text-white disabled:opacity-30 p-1" disabled={item.quantity >= item.stock}><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-6 space-y-3">
              <div className="flex justify-between text-sm text-zinc-400"><span>{t('subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-zinc-400"><span>{t('shippingFee')}</span><span className="text-green-500 font-bold">{t('freeShipping')}</span></div>
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
               <span className="text-lg font-bold text-white">{t('totalPayable')}</span>
               <div className="flex items-end gap-2">
                 <span className="text-sm text-zinc-500 mb-1">USD</span>
                 <span className="text-3xl font-black tracking-tight text-red-500">${total.toFixed(2)}</span>
               </div>
            </div>
        </div>
      </div>

      {/* ==================== 右侧：收货信息表单 (Form) ==================== */}
      <div className="p-6 md:p-12 lg:p-20 order-2 lg:order-2 bg-transparent relative z-10">
        <div className="max-w-lg mx-auto lg:mr-auto">
          
          <div className="flex items-center gap-2 mb-8 text-zinc-500 text-sm">
            <span className="text-white font-bold text-lg">{t('step1')}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-600">{t('step2')}</span>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">{t('shippingDetails')}</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. 联系信息板块 (Email + Phone) */}
            <section className="bg-zinc-900/30 p-4 rounded-xl border border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-red-500" />
                    {t('contactInfo')}
                </h3>
                
                {/* 邮箱 */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase ml-1">
                        {t('emailLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            required 
                            placeholder={t('emailPlaceholder')}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" 
                        />
                    </div>
                    <p className="text-[10px] text-zinc-500 ml-1">
                        {t('emailHelp')}
                    </p>
                </div>

                {/* 手机号 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('phone')} *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      required 
                      placeholder="+1 (555) 000-0000" 
                      type="tel" 
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" 
                    />
                  </div>
                </div>
            </section>

            {/* 2. 收货地址板块 */}
            <div className="space-y-4 pt-2">
                
                {/* 全名 */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('fullNameLabel')} *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                    <input 
                      name="fullName" 
                      value={formData.fullName} 
                      onChange={handleInputChange} 
                      required 
                      placeholder={t('fullNamePlaceholder')} 
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" 
                    />
                  </div>
                </div>

                {/* 地址行合并 (方案B：街道地址占2/3, 公寓占1/3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 街道地址 */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('streetAddress')} *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                        <input 
                          name="addressLine1" 
                          value={formData.addressLine1} 
                          onChange={handleInputChange} 
                          required 
                          placeholder={t('addressPlaceholder')} 
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" 
                        />
                      </div>
                    </div>

                    {/* 公寓/单元 */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('aptSuite')}</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                        <input 
                          name="addressLine2" 
                          value={formData.addressLine2} 
                          onChange={handleInputChange} 
                          placeholder={t('address2Placeholder')} 
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" 
                        />
                      </div>
                    </div>
                </div>

                {/* 城市/州/邮编 */}
                <div className="grid grid-cols-3 gap-3">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('city')} *</label>
                     <input name="city" value={formData.city} onChange={handleInputChange} required placeholder={t('city')} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('state')} *</label>
                     <input name="state" value={formData.state} onChange={handleInputChange} required placeholder={t('state')} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('zip')} *</label>
                     <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} required placeholder={t('zip')} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
                   </div>
                </div>

                {/* 国家 (选项已国际化) */}
                <div className="space-y-2">
                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">{t('country')} *</label>
                     <div className="relative">
                       <Globe className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                       <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white appearance-none"
                       >
                          <option value="Singapore">{t('countries.Singapore')}</option>
                          <option value="Malaysia">{t('countries.Malaysia')}</option>
                          <option value="USA">{t('countries.USA')}</option>
                          <option value="UK">{t('countries.UK')}</option>
                          <option value="Australia">{t('countries.Australia')}</option>
                       </select>
                     </div>
                </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || cartItems.length === 0}
              className="w-full py-4 mt-8 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('processingPayment')}</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t('securePayment')}</span>
                  <span>${total.toFixed(2)}</span>
                </>
              )}
            </button>

            {/* 支付保障信息 */}
            <div className="mt-6 p-4 bg-zinc-900/50 border border-green-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-400 font-bold">{t('securityGuarantee')}</p>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {t('securityDesc')}
                  </p>
                </div>
              </div>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}