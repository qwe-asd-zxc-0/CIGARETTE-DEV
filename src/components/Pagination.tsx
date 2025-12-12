import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: any; // 传入当前的搜索参数对象
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
  // 如果只有1页或没有数据，不显示分页
  if (totalPages <= 1) return null;

  // 辅助函数：生成带有当前所有参数 + 新页码的 URL
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `/product?${params.toString()}`;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8">
      {/* 上一页 */}
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="p-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all hover:-translate-x-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
      ) : (
        <button disabled className="p-2 rounded-full bg-zinc-900/50 border border-white/5 text-zinc-700 cursor-not-allowed">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* 页码显示 (简单模式：只显示当前页和总页数，视情况可扩展为 1 2 3 ... 9) */}
      <div className="flex items-center gap-1 px-4 text-sm font-mono text-zinc-500">
        <span className="text-white font-bold">{currentPage}</span>
        <span className="mx-1">/</span>
        <span>{totalPages}</span>
      </div>

      {/* 下一页 */}
      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="p-2 rounded-full bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all hover:translate-x-1"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      ) : (
        <button disabled className="p-2 rounded-full bg-zinc-900/50 border border-white/5 text-zinc-700 cursor-not-allowed">
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}