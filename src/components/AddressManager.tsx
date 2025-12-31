"use client";

import { useState } from "react";
import { ArrowLeft, MapPin, Plus, Star, Trash2, Home, X, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { addAddress, deleteAddress, setDefaultAddress } from "@/app/[locale]/profile/addresses/actions";
import { useTranslations } from 'next-intl';

export default function AddressManager({ addresses }: { addresses: any[] }) {
  const t = useTranslations('Profile');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 处理新增提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const res = await addAddress(formData);
    
    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
    } else {
      alert(t(res.message));
    }
  };

  return (
    <>
      {/* === 顶部导航 & 新增按钮 === */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/profile" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{t('shippingAddresses')}</h1>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-lg shadow-white/10"
        >
          <Plus className="w-4 h-4" /> {t('addNewAddress')}
        </button>
      </div>

      {/* === 地址列表 === */}
      {addresses.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600 border border-zinc-700">
            <MapPin className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{t('noAddresses')}</h3>
          <p className="text-zinc-500 mb-8 text-sm">{t('noAddressesDesc')}</p>
          <button onClick={() => setIsModalOpen(true)} className="px-8 py-3 bg-zinc-800 text-white font-bold rounded-full hover:bg-zinc-700 transition border border-zinc-700">
            {t('addNow')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className={`relative bg-zinc-900 border ${addr.isDefault ? 'border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-zinc-800'} rounded-2xl p-6 hover:border-zinc-600 transition group`}>
              
              {/* 默认标签 */}
              {addr.isDefault && (
                <div className="absolute top-4 right-4 bg-red-600/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded border border-red-600/20 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {t('defaultAddress')}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${addr.isDefault ? 'bg-red-900/20 text-red-500 border-red-900/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{addr.firstName} {addr.lastName}</p>
                    <p className="text-xs text-zinc-500 font-mono tracking-wide">{addr.phoneNumber}</p>
                  </div>
                </div>
                
                <div className="text-sm text-zinc-400 leading-relaxed border-l-2 border-zinc-800 pl-4 ml-5">
                  <p>{addr.addressLine1}</p>
                  {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                  <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                  <p className="text-zinc-500 mt-1 uppercase text-xs font-bold tracking-wider">{addr.country}</p>
                </div>

                {/* 底部操作栏 */}
                <div className="pt-4 border-t border-zinc-800 flex justify-between items-center opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                  {!addr.isDefault ? (
                    <button 
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition py-1 px-2 rounded hover:bg-zinc-800"
                    >
                       <Star className="w-3.5 h-3.5" /> {t('setAsDefault')}
                    </button>
                  ) : (
                    <span className="text-xs text-red-500 font-bold flex items-center gap-1 px-2"><Check className="w-3.5 h-3.5"/> {t('currentDefault')}</span>
                  )}
                  
                  <button 
                    onClick={() => {
                        if(confirm(t('confirmDelete'))) deleteAddress(addr.id)
                    }}
                    className="text-xs text-zinc-500 hover:text-red-500 flex items-center gap-1.5 transition py-1 px-2 rounded hover:bg-red-500/10 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === 🔥 新增地址弹窗 (优化：位于导航栏之下) === */}
      {isModalOpen && (
        <div className="fixed top-24 inset-x-0 bottom-0 z-40 flex items-center justify-center px-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          
          {/* 点击背景关闭 */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsModalOpen(false)}></div>

          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 z-50 flex flex-col max-h-[80vh]">
            
            {/* 弹窗头部 */}
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-red-600" /> {t('addNewAddress')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition p-2 hover:bg-zinc-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单区域 (可滚动) */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              
              {/* 姓名 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('lastNameLabel')}</label>
                  <input name="lastName" required placeholder={t('lastNamePlaceholder')} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('firstNameLabel')}</label>
                  <input name="firstName" required placeholder={t('firstNamePlaceholder')} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('phoneLabel')}</label>
                <input name="phone" required placeholder="+1 (555) 000-0000" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('addressLabel')}</label>
                <input name="addressLine1" required placeholder={t('addressPlaceholder')} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
              </div>
              
              <div className="space-y-1.5">
                 <input name="addressLine2" placeholder={t('address2Placeholder')} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('cityLabel')}</label>
                  <input name="city" required placeholder="City" className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('stateLabel')}</label>
                  <input name="state" required placeholder="State" className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('zipCodeLabel')}</label>
                  <input name="postalCode" required placeholder="Zip Code" className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-zinc-500 font-bold ml-1 tracking-wider">{t('countryLabel')}</label>
                <input name="country" required defaultValue="Singapore" placeholder="Country" className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none placeholder:text-zinc-700 transition-colors" />
              </div>

              <div className="flex items-center gap-3 pt-2 pb-2">
                <div className="relative flex items-center">
                  <input type="checkbox" name="isDefault" id="isDefault" className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-zinc-700 bg-black checked:border-red-600 checked:bg-red-600 transition-all" />
                  <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                </div>
                <label htmlFor="isDefault" className="text-sm text-zinc-300 cursor-pointer select-none hover:text-white transition">{t('setAsDefaultLabel')}</label>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 mt-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isSubmitting ? t('saving') : t('saveAddress')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}