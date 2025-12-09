"use client";

import { useState } from "react";
import { CheckCircle, Clock, X, Star, User, ShoppingBag, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 定义 Review 类型 (根据 Prisma Schema)
interface ReviewLog {
  id: string;
  content: string;
  rating: number;
  isApproved: boolean;
  createdAt: Date;
  user?: { email: string | null };
  product?: { title: string };
}

export default function AuditLogs({ ageLogs, reviewLogs }: { ageLogs: any[], reviewLogs: any[] }) {
  const [selectedReview, setSelectedReview] = useState<ReviewLog | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* === 左侧：年龄验证记录 (保持不变) === */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Verified Users (Age Check)
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-black/20 text-xs uppercase font-bold sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="p-3 pl-4">User</th>
                  <th className="p-3 text-right pr-4">Verified At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {ageLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 pl-4">
                      <p className="text-white font-medium">{log.fullName || "User"}</p>
                      <p className="text-xs text-zinc-500">{log.email}</p>
                    </td>
                    <td className="p-3 text-right pr-4 font-mono text-xs">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* === 右侧：评论审核日志 (升级版) === */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Review Audit Log
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-black/20 text-xs uppercase font-bold sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="p-3 pl-4">Product & User</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right pr-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reviewLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => setSelectedReview(log)} // ✅ 点击查看详情
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-3 pl-4">
                      <p className="text-white font-medium truncate max-w-[180px] group-hover:text-blue-400 transition-colors">
                        {log.product?.title || "Unknown Product"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate max-w-[180px]">
                        by {log.user?.email || "Anonymous"}
                      </p>
                    </td>
                    <td className="p-3 text-center">
                      {log.isApproved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right pr-4 font-mono text-xs">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === 详情弹窗 === */}
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReview(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* 弹窗内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <h3 className="text-xl font-bold text-white">Review Details</h3>
                <button 
                  onClick={() => setSelectedReview(null)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容区 */}
              <div className="p-6 space-y-6">
                {/* 1. 商品与评分 */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Product
                    </p>
                    <p className="text-white font-medium text-lg">{selectedReview.product?.title}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= selectedReview.rating ? "fill-yellow-500 text-yellow-500" : "text-zinc-800 fill-zinc-800"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500 mt-1 font-mono">
                      {selectedReview.rating}.0 / 5.0
                    </span>
                  </div>
                </div>

                {/* 2. 评论内容 (核心) */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Review Content</p>
                  <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedReview.content || <span className="italic text-zinc-600">No text content provided.</span>}
                  </p>
                </div>

                {/* 3. 用户与时间 */}
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Posted by</p>
                      <p className="text-sm text-white">{selectedReview.user?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </p>
                    <p className="text-sm text-zinc-300 font-mono">
                      {new Date(selectedReview.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 4. 状态标签 */}
                <div className="pt-4 border-t border-white/10 flex justify-end">
                  {selectedReview.isApproved ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-green-400">Review Approved</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-bold text-yellow-400">Pending Approval</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}