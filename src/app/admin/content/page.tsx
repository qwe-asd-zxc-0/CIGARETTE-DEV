import { prisma } from "@/lib/prisma";
import { MessageSquare, HelpCircle } from "lucide-react";
import ReviewManager from "@/components/admin/content/ReviewManager";
import FaqManager from "@/components/admin/content/FaqManager";

export const dynamic = 'force-dynamic';

export default async function ContentPage({
  searchParams,
}: {
  // ✅ 修复 1: 类型定义改为 Promise
  searchParams: Promise<{ tab?: string }>;
}) {
  // ✅ 修复 2: 必须先 await 解包 searchParams
  const { tab } = await searchParams;
  const activeTab = tab || "reviews"; 

  // 1. 获取评论数据
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { fullName: true, email: true, avatarUrl: true } },
      product: { select: { title: true, coverImageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. 获取 FAQ 数据
  const faqs = await prisma.faq.findMany({
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Content Management</h2>
        <p className="text-zinc-400 text-sm">Moderate user reviews and manage website FAQs.</p>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-white/10">
        <div className="flex gap-8">
          <a
            href="?tab=reviews"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "reviews"
                ? "border-red-600 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Product Reviews
            <span className="ml-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-xs">
              {reviews.length}
            </span>
          </a>
          
          <a
            href="?tab=faqs"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "faqs"
                ? "border-red-600 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            FAQs
            <span className="ml-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full text-xs">
              {faqs.length}
            </span>
          </a>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="min-h-[400px]">
        {activeTab === "reviews" ? (
          <ReviewManager reviews={reviews} />
        ) : (
          <FaqManager faqs={faqs} />
        )}
      </div>
    </div>
  );
}