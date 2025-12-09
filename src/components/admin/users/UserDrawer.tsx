"use client";

import { X, MapPin, User, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

interface UserDrawerProps {
  user: any; // 这里的类型建议使用 Prisma 生成的 Profile 类型
  onClose: () => void;
}

export default function UserDrawer({ user, onClose }: UserDrawerProps) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* 遮罩层 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* 侧边栏内容 */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-md h-full bg-zinc-900 border-l border-white/10 shadow-2xl overflow-y-auto"
      >
        {/* 头部 */}
        <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">User Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 头像与基础信息 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden relative">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <span className="text-xl font-bold text-zinc-500">
                  {(user.fullName || user.email || "U").substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user.fullName || "Unnamed User"}</h2>
              <p className="text-zinc-400 text-sm">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${user.isAdmin ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {user.isAdmin ? 'Admin' : 'Customer'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${user.isAgeVerified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {user.isAgeVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* 详细数据列表 */}
          <div className="space-y-6">
            <Section title="Account Info">
              <InfoItem icon={User} label="User ID" value={user.id} mono />
              <InfoItem icon={Calendar} label="Registered" value={new Date(user.createdAt).toLocaleString()} />
              <InfoItem icon={Activity} label="Traffic Source" value={user.trafficSource || "Direct"} />
            </Section>

            <Section title="Addresses">
              {user.addresses && user.addresses.length > 0 ? (
                <div className="space-y-3">
                  {user.addresses.map((addr: any, i: number) => (
                    <div key={addr.id} className={`p-3 rounded-lg border ${addr.isDefault ? 'bg-white/5 border-red-500/30' : 'bg-zinc-800/30 border-white/5'}`}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-zinc-500">Address #{i + 1} {addr.isDefault && "(Default)"}</span>
                        <span className="text-xs text-zinc-400">{addr.country}</span>
                      </div>
                      <p className="text-sm text-zinc-300">
                        {addr.addressLine1} {addr.addressLine2}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                      {addr.phoneNumber && (
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                          Phone: {addr.phoneNumber}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">No addresses saved.</p>
              )}
            </Section>

            <Section title="Raw Data (Debug)">
              <pre className="text-[10px] text-zinc-600 bg-black p-3 rounded-lg overflow-x-auto font-mono">
                {JSON.stringify(user, null, 2)}
              </pre>
            </Section>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// 辅助子组件
function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 pb-1 border-b border-white/5">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, mono }: any) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-zinc-600 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={`text-sm text-zinc-300 break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}