"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Plane, HeartHandshake, Globe, Sparkles } from "lucide-react";

// 品牌故事数据
const storyData = {
  title: "全球甄选，醇正体验",
  subtitle: "GLOBAL TOBACCO",
  introduction:
    "作为领先的国际烟草供应链平台，GLOBAL TOBACCO 致力于打破地域限制，将世界各地的优质烟草产品呈现在您面前。无论是古巴的醇厚、欧洲的精致，还是美洲的经典，我们坚持为您甄选全球地道好烟。",
  promises: [
    {
      title: "百分百原装正品",
      description:
        "拒绝假冒伪劣，直连品牌源头，确保您品尝到的每一口都是纯正风味。",
      icon: <ShieldCheck className="w-6 h-6" />,
    },
    {
      title: "合规跨境直邮",
      description:
        "依托专业的国际物流网络与清关能力，解决烟草跨境运输难、通关慢的痛点。",
      icon: <Plane className="w-6 h-6" />,
    },
    {
      title: "尊享无忧服务",
      description:
        "无论是个人海淘收藏还是批量商业采购，我们提供专业的税务指引与风险管理。",
      icon: <HeartHandshake className="w-6 h-6" />,
    },
  ],
  closing:
    "GLOBAL TOBACCO，不仅是您的烟草采购平台，更是您连接全球烟草文化的桥梁。我们以专业和诚信，守护您的每一次品鉴之旅。",
};

// 动画配置
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

export default function BrandStory() {
  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden bg-zinc-950">
      
      {/* 1. 背景氛围光 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full opacity-20 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-red-600 rounded-full blur-[128px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-orange-700 rounded-full blur-[128px]" />
      </div>

      <motion.div
        className="max-w-6xl mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* 2. 头部标题 */}
        <motion.div variants={itemVariants} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-8 backdrop-blur-sm">
            <Globe className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-red-400 tracking-widest uppercase">
              Premium Selection
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
            {storyData.title}
          </h2>
          
          <div className="flex items-center justify-center gap-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-500/60"></div>
            <p className="text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-serif italic tracking-wide">
              {storyData.subtitle}
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-500/60"></div>
          </div>
        </motion.div>

        {/* 3. 核心介绍文案 (已添加后引号) */}
        <motion.div variants={itemVariants} className="mb-24">
          <div className="max-w-3xl mx-auto text-center relative">
            <Sparkles className="absolute -top-8 -left-8 w-8 h-8 text-white/10" />
            
            <p className="text-lg md:text-xl text-zinc-300 leading-loose font-light px-4">
              <span className="text-red-500 text-4xl float-left mr-2 leading-none font-serif transform -translate-y-2">“</span>
              {storyData.introduction}
              <span className="text-red-500 text-4xl inline-block ml-2 leading-none font-serif transform translate-y-2">”</span>
            </p>

            <Sparkles className="absolute -bottom-8 -right-8 w-8 h-8 text-white/10" />
          </div>
        </motion.div>

        {/* 4. 承诺卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {storyData.promises.map((promise, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group relative bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-8 hover:bg-zinc-800/60 hover:border-red-500/30 transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-red-500/30 group-hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)] transition-all duration-300">
                  <div className="text-red-500">
                    {promise.icon}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-red-400 transition-colors">
                  {promise.title}
                </h3>
                
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {promise.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 5. 底部结语 */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="max-w-2xl mx-auto relative py-10 border-t border-white/5">
            <p className="text-lg text-zinc-400 font-light italic">
              {storyData.closing}
            </p>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}