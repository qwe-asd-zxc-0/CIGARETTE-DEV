import Link from "next/link";
import { ArrowRight, Sparkles, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ActivityBanner() {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "promo_activity" }
  });

  const config = setting?.value as any;

  if (!config || !config.isActive) return null;

  return (
    // ⬇️ 调整1：减小上下外边距 (my-12)
    <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 my-12 group">
      
      {/* 背景光晕：减小模糊半径 */}
      <div className="absolute inset-0 bg-red-600/20 blur-[40px] opacity-30 group-hover:opacity-50 transition-opacity duration-700 rounded-[1.5rem] z-0" />

      {/* ⬇️ 调整2：高度减至 320px，圆角减小至 2xl */}
      <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-xl transition-all duration-500 min-h-[320px] flex items-center">
        
        {/* 背景图层 */}
        {config.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img 
              src={config.imageUrl} 
              alt={config.title} 
              className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-110 transition-transform duration-1000 ease-in-out" 
            />
            {/* 加深遮罩，确保文字清晰 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* ⬇️ 调整3：内边距减小 (p-8 md:p-10) */}
        <div className="relative z-20 p-8 md:p-10 max-w-2xl flex flex-col items-start">
          
          {/* ⬇️ 调整4：标签改为中文，字号极小 (text-[10px]) */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-red-400 text-[10px] font-bold uppercase tracking-wider mb-4 animate-bounce-slow shadow-lg shadow-red-900/20">
            <Flame className="w-3 h-3" />
            限时特惠
          </div>
          
          {/* ⬇️ 调整5：标题字号缩小 (text-3xl md:text-4xl) */}
          <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-400 mb-3 leading-tight drop-shadow-xl">
            {config.title}
          </h2>
          
          {/* ⬇️ 调整6：副标题更细腻 (text-sm md:text-base) */}
          <p className="text-sm md:text-base text-zinc-400 mb-6 leading-relaxed max-w-lg font-normal">
            {config.subtitle}
          </p>

          {/* ⬇️ 调整7：按钮更紧凑 (px-6 py-2.5) */}
          <Link 
            href={config.linkUrl || "/product"}
            className="group/btn relative inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black font-bold rounded-full overflow-hidden shadow-lg transition-all hover:scale-105 hover:shadow-white/20"
          >
            {/* 按钮流光特效保留 */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 ease-in-out z-0" />
            
            <span className="relative z-10 text-xs md:text-sm tracking-wide">{config.buttonText}</span>
            <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 装饰元素：大幅缩小 */}
        <div className="absolute right-6 bottom-6 z-10 opacity-10 group-hover:opacity-30 transition-opacity duration-700 hidden md:block">
          <Sparkles className="w-32 h-32 text-red-500 blur-[2px]" />
        </div>

      </div>
    </section>
  );
}