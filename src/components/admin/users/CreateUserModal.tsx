"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { createUser } from "@/app/admin/(protected)/users/actions";

export default function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    balance: 0,
    isAgeVerified: true, // 默认管理员创建的用户已通过年龄验证
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createUser(formData);
    setLoading(false);
    
    if (res.success) {
      alert("✅ 用户创建成功！");
      onClose();
    } else {
      alert("❌ 创建失败: " + res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-green-500" /> 新建用户
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">电子邮箱 *</label>
              <input 
                required type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-green-500 outline-none"
                placeholder="请输入邮箱..."
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">初始密码 *</label>
              <input 
                required type="text"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-green-500 outline-none"
                placeholder="设置初始密码..."
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">姓名</label>
            <input 
              required
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-green-500 outline-none"
              placeholder="请输入用户姓名..."
            />
          </div>

          <div>
             <label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">初始余额 ($)</label>
             <input 
                type="number" step="0.01"
                value={formData.balance}
                onChange={e => setFormData({...formData, balance: parseFloat(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white focus:border-green-500 outline-none"
             />
          </div>

          <div className="flex items-center gap-2 pt-2 bg-white/5 p-3 rounded-lg border border-white/5">
            <input 
              type="checkbox"
              id="ageCheck"
              checked={formData.isAgeVerified}
              onChange={e => setFormData({...formData, isAgeVerified: e.target.checked})}
              className="w-4 h-4 accent-green-600"
            />
            <label htmlFor="ageCheck" className="text-sm text-zinc-300 cursor-pointer select-none">
              标记为已验证年龄 (允许购买受限商品)
            </label>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all shadow-lg shadow-green-900/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "创建用户"}
          </button>
        </form>
      </div>
    </div>
  );
}