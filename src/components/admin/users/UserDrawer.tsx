"use client";

import { useState } from "react";
import { X, Save, Trash2, Key, Shield, User, Wallet, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { updateUserProfile, resetUserPassword, deleteUser, sendPasswordResetEmail } from "@/app/admin/(protected)/users/actions";

interface UserDrawerProps {
  user: any;
  onClose: () => void;
}

export default function UserDrawer({ user, onClose }: UserDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  
  // 表单状态
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    balance: user.balance ? Number(user.balance) : 0,
    isAgeVerified: user.isAgeVerified || false,
    isAdmin: user.isAdmin || false,
  });

  const [newPassword, setNewPassword] = useState("");

  // 保存资料
  const handleSaveProfile = async () => {
    setLoading(true);
    const res = await updateUserProfile(user.id, formData);
    setLoading(false);
    if (res.success) alert("✅ 资料已保存");
    else alert("❌ 保存失败");
  };

  // 强制重置密码
  const handleResetPassword = async () => {
    if (!newPassword) return alert("请输入新密码");
    setLoading(true);
    const res = await resetUserPassword(user.id, newPassword);
    setLoading(false);
    if (res.success) {
      alert("✅ 密码修改成功，请通知用户。");
      setNewPassword("");
    } else {
      alert("❌ 修改失败: " + res.message);
    }
  };

  // 发送重置邮件
  const handleSendEmail = async () => {
    if(!confirm(`确定向 ${user.email} 发送重置邮件吗？`)) return;
    setLoading(true);
    const res = await sendPasswordResetEmail(user.email);
    setLoading(false);
    if (res.success) alert("📧 邮件已发送");
    else alert("❌ 发送失败: " + res.message);
  }

  // 删除用户
  const handleDelete = async () => {
    if (!confirm(`⚠️ 危险操作！\n确定要删除用户 ${user.email} 吗？\n此操作将清除所有订单和关联数据，且不可恢复！`)) return;
    
    setLoading(true);
    const res = await deleteUser(user.id);
    if (res.success) {
      alert("✅ 用户已删除");
      onClose();
    } else {
      alert("❌ 删除失败: " + res.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/10 shadow-2xl overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-900/95 border-b border-white/10 p-6 flex justify-between items-center backdrop-blur-md">
          <div>
            <h3 className="text-xl font-bold text-white">编辑用户</h3>
            <p className="text-xs text-zinc-500 font-mono mt-1">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`pb-3 pt-4 text-sm font-bold mr-6 border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            基本资料
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`pb-3 pt-4 text-sm font-bold border-b-2 transition-colors ${activeTab === "security" ? "border-red-500 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            安全与权限
          </button>
        </div>

        <div className="p-6 space-y-8">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* 1. 基础信息 */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Full Name</label>
                  <input 
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-green-500" /> Account Balance ($)
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: parseFloat(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white font-mono text-lg focus:border-green-500 outline-none transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">正数表示余额，可用于抵扣订单。</p>
                </div>
              </div>

              {/* 2. 权限开关 */}
              <div className="bg-white/5 rounded-xl p-4 space-y-4 border border-white/5">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400" /> 年龄验证
                    </h4>
                    <p className="text-xs text-zinc-500">允许购买受限商品</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.isAgeVerified}
                    onChange={(e) => setFormData({...formData, isAgeVerified: e.target.checked})}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="w-full h-px bg-white/10" />
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" /> 管理员权限
                    </h4>
                    <p className="text-xs text-zinc-500">允许访问后台 (慎用!)</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={formData.isAdmin}
                    onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})}
                    className="w-5 h-5 accent-red-600 cursor-pointer"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
              >
                {loading ? "Saving..." : <><Save className="w-4 h-4" /> 保存修改</>}
              </button>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* 重置密码 */}
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-white/5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-500" /> 密码管理
                </h4>
                
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="输入新密码..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <button 
                    onClick={handleResetPassword}
                    disabled={loading || !newPassword}
                    className="px-4 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold rounded-lg whitespace-nowrap"
                  >
                    强制修改
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-zinc-500">或发送重置邮件给用户</span>
                  <button 
                    onClick={handleSendEmail}
                    disabled={loading}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> 发送邮件
                  </button>
                </div>
              </div>

              {/* 危险区域 */}
              <div className="bg-red-900/10 p-5 rounded-xl border border-red-900/30">
                <h4 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Danger Zone
                </h4>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  删除账号是不可逆的操作。该用户的所有关联数据（订单、评论、地址）将被清除，可能导致报表数据不一致。
                </p>
                <button 
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> 彻底删除该用户
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}