"use client";

import { useState, useEffect } from "react";
import { useCartDrawer } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { 
  Lock, ArrowLeft, Loader2, MapPin, Mail, User, Phone, 
  Minus, Plus, BookOpen, X, AlertCircle, Building, Globe, ShoppingBag
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
// ⚠️ 确保您的 actions.ts 中已经按照上一步添加了 getUserAddresses
import { getUserAddresses, createOrder } from "./actions";

// === 📦 组件：数量输入框 (保持不变) ===
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
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCartDrawer();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 表单状态
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA" 
  });

  const [showAddressBook, setShowAddressBook] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal; 

  // 加载地址簿
  useEffect(() => {
    const loadAddresses = async () => {
      setLoadingAddresses(true);
      try {
        const data = await getUserAddresses();
        setSavedAddresses(data || []);
      } catch (error) {
        console.error("Failed to load addresses", error);
      } finally {
        setLoadingAddresses(false);
      }
    };
    loadAddresses();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 填充地址
  const handleSelectAddress = (addr: any) => {
    setFormData(prev => ({
      ...prev,
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      email: addr.email || prev.email,
      phone: addr.phoneNumber || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.zipCode || "",
      country: addr.country || "USA"
    }));
    setShowAddressBook(false);
  };

  // 提交订单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return alert("购物车为空");
    
    setLoading(true);

    try {
      const payload = new FormData();
      
      // 合并姓名
      payload.append("firstName", formData.firstName);
      payload.append("lastName", formData.lastName);
      payload.append("fullName", `${formData.firstName} ${formData.lastName}`.trim());
      
      // 添加其他字段
      payload.append("email", formData.email);
      payload.append("phone", formData.phone);
      payload.append("addressLine1", formData.addressLine1);
      payload.append("addressLine2", formData.addressLine2);
      payload.append("city", formData.city);
      payload.append("state", formData.state);
      payload.append("postalCode", formData.postalCode);
      payload.append("country", formData.country);

      // 商品列表
      const itemsPayload = cartItems.map(item => ({
        productVariantId: item.id,
        quantity: item.quantity
      }));
      payload.append("items", JSON.stringify(itemsPayload));

      const result = await createOrder(payload);

      if (!result.success) {
        throw new Error(result.message);
      }

      if (clearCart) clearCart(); 
      else cartItems.forEach(item => removeFromCart(item.id)); 

      router.push("/profile/orders");

    } catch (error: any) {
      console.error("Order creation failed:", error);
      alert(error.message || "订单创建失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  // 空购物车状态
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-6">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
           <ShoppingBag className="w-8 h-8 text-zinc-600" />
        </div>
        <div className="text-center">
            <h2 className="text-xl font-bold text-white">您的购物车是空的</h2>
            <p className="text-zinc-500 mt-2 text-sm">看起来您还没有添加任何商品。</p>
        </div>
        <Link href="/product" className="px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition shadow-lg shadow-white/10">
          返回商城购物
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 lg:grid-cols-2 relative">
      
      {/* ==================== 📖 地址簿弹窗 ==================== */}
      {showAddressBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" /> 选择收货地址
              </h3>
              <button onClick={() => setShowAddressBook(false)} className="text-zinc-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {loadingAddresses ? (
                <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  加载中...
                </div>
              ) : savedAddresses.length > 0 ? (
                savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className="w-full text-left p-4 rounded-xl border border-zinc-800 hover:border-red-500 hover:bg-zinc-900 transition group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-1.5 relative z-10">
                      <div className="flex items-center gap-2">
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">默认</span>
                        )}
                        <span className="text-sm font-bold text-white">
                          {addr.firstName} {addr.lastName}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">{addr.phoneNumber}</span>
                    </div>
                    <div className="text-xs text-zinc-400 relative z-10 leading-relaxed pr-8">
                      {addr.addressLine1}, {addr.city}, {addr.state} {addr.zipCode}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-bold">暂无保存地址</p>
                    <p className="text-xs text-zinc-500 mt-1">请前往个人中心添加常用地址</p>
                  </div>
                  <Link 
                    href="/profile/addresses" 
                    className="inline-block px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition"
                  >
                    去添加地址
                  </Link>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 text-center">
              <button onClick={() => setShowAddressBook(false)} className="text-xs font-bold text-zinc-500 hover:text-white transition">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 左侧：订单详情 (Summary) ==================== */}
      <div className="relative bg-zinc-900/30 border-r border-white/5 p-6 md:p-12 lg:p-20 order-1 lg:order-1 lg:min-h-screen">
        <div className="max-w-md ml-auto sticky top-12">
            <div className="mb-8">
              <Link href="/cart" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> 返回购物车
              </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">订单摘要 ({cartItems.length})</h2>
            
            {/* 商品列表 */}
            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-4 items-center group bg-black/20 p-3 rounded-xl border border-white/5">
                  <div className="relative w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-200 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{item.flavor} / {item.strength}</p>
                    {item.quantity >= item.stock && <p className="text-[10px] text-red-500 mt-0.5">已达库存上限</p>}
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
            
            {/* 费用明细 */}
            <div className="border-t border-white/10 pt-6 space-y-3">
              <div className="flex justify-between text-sm text-zinc-400"><span>商品小计</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-zinc-400"><span>配送费</span><span className="text-green-500 font-bold">免运费</span></div>
            </div>
            
            {/* 总金额 */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
               <span className="text-lg font-bold text-white">应付总额</span>
               <div className="flex items-end gap-2">
                 <span className="text-sm text-zinc-500 mb-1">USD</span>
                 <span className="text-3xl font-black tracking-tight text-red-500">${total.toFixed(2)}</span>
               </div>
            </div>
        </div>
      </div>

      {/* ==================== 右侧：收货信息表单 (Form) ==================== */}
      <div className="p-6 md:p-12 lg:p-20 order-2 lg:order-2 bg-black">
        <div className="max-w-lg mr-auto">
          
          <div className="flex items-center gap-2 mb-8 text-zinc-500 text-sm">
            <span className="text-white font-bold">收货信息</span>
            <span>/</span>
            <span>支付方式</span>
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">收货详情</h1>
            
            <button 
              type="button"
              onClick={() => setShowAddressBook(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-red-600 hover:text-red-500 rounded-full text-xs font-bold text-zinc-300 transition"
            >
              <BookOpen className="w-3.5 h-3.5" /> 从地址簿导入
            </button>
          </div>
          
          {savedAddresses.length === 0 && !loadingAddresses && (
             <div className="mb-8 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <div>
                   <p className="text-xs text-zinc-200 font-bold">温馨提示</p>
                   <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                     您还没有保存常用地址。本次下单后，系统会自动保存您的地址到地址簿（限5个），方便下次快速结账。
                   </p>
                </div>
             </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 姓名 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">姓氏 (Last Name) *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Last Name" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">名字 (First Name) *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="First Name" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
                </div>
              </div>
            </div>

            {/* 联系方式 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">电子邮箱 (Email) *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input name="email" value={formData.email} onChange={handleInputChange} required placeholder="email@example.com" type="email" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">手机号码 (Phone) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="+1 (555) 000-0000" type="tel" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
              </div>
            </div>

            {/* 地址 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">街道地址 (Street Address) *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} required placeholder="123 Main St" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">门牌/公寓号 (Apt, Suite, Unit) (选填)</label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} placeholder="Apartment, studio, or floor" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">城市 (City) *</label>
                 <input name="city" value={formData.city} onChange={handleInputChange} required placeholder="City" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">州/省 (State) *</label>
                 <input name="state" value={formData.state} onChange={handleInputChange} required placeholder="State" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">邮编 (Zip) *</label>
                 <input name="postalCode" value={formData.postalCode} onChange={handleInputChange} required placeholder="Zip Code" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600" />
               </div>
            </div>

            <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">国家 (Country) *</label>
                 <div className="relative">
                   <Globe className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                   <input
                     name="country"
                     value={formData.country}
                     onChange={handleInputChange}
                     required
                     placeholder="Country"
                     className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition text-sm text-white placeholder:text-zinc-600"
                   />
                 </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? "处理订单中..." : `立即支付 $${total.toFixed(2)}`}
            </button>
          </form>

          <p className="mt-8 text-xs text-zinc-600 leading-relaxed text-center">
            点击支付即表示您同意我们的 <Link href="#" className="underline hover:text-white">服务条款</Link> 和 <Link href="#" className="underline hover:text-white">隐私政策</Link>。<br/>所有交易均经过 SSL 加密保护，安全无忧。
          </p>
        </div>
      </div>

    </div>
  );
}