"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, CheckCircle, XCircle, Trash2, Filter } from "lucide-react";
import { toggleReviewStatus, deleteReview } from "@/app/admin/(protected)/content/actions";

export default function ReviewManager({ reviews }: { reviews: any[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // 过滤逻辑
  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.isApproved;
    if (filter === 'approved') return r.isApproved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 筛选工具栏 */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === status 
                ? "bg-red-600 text-white" 
                : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {status} ({reviews.filter(r => status === 'all' ? true : status === 'approved' ? r.isApproved : !r.isApproved).length})
          </button>
        ))}
      </div>

      {/* 评论列表 */}
      <div className="grid gap-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-zinc-900/50 border border-white/10 rounded-xl p-5 flex flex-col md:flex-row gap-6 hover:border-white/20 transition-colors">
            {/* 左侧：商品图和用户信息 */}
            <div className="flex items-start gap-4 md:w-1/4 min-w-[200px]">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden relative flex-shrink-0">
                {review.product?.coverImageUrl ? (
                  <Image src={review.product.coverImageUrl} alt="Product" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600">IMG</div>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{review.product?.title}</p>
                <p className="text-xs text-zinc-500 mt-1">by {review.user?.fullName || review.user?.email || 'Anonymous'}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* 中间：评分和内容 */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-zinc-700"}`} 
                  />
                ))}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                {review.content}
              </p>
              
              {/* 评论图片展示 (如果有) */}
              {/* 假设 images 是 string[] 或逗号分隔字符串，视 schema 而定 */}
              {/* <div className="flex gap-2 mt-3">...images...</div> */}
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex md:flex-col items-center gap-3 md:border-l border-white/5 md:pl-6">
              <button
                onClick={async () => {
                  await toggleReviewStatus(review.id, !review.isApproved);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-full justify-center ${
                  review.isApproved 
                    ? "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20" 
                    : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20"
                }`}
              >
                {review.isApproved ? (
                  <><CheckCircle className="w-3.5 h-3.5" /> Approved</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> Pending</>
                )}
              </button>

              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this review?")) {
                    await deleteReview(review.id);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-zinc-700 w-full justify-center transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-white/10">
            No reviews found matching this filter.
          </div>
        )}
      </div>
    </div>
  );
}