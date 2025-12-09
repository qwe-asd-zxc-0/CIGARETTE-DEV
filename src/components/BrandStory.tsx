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
    },
    {
      title: "合规跨境直邮",
      description:
        "依托专业的国际物流网络与清关能力，解决烟草跨境运输难、通关慢的痛点。",
    },
    {
      title: "尊享无忧服务",
      description:
        "无论是个人海淘收藏还是批量商业采购，我们提供专业的物流团队。",
    },
  ],
  closing:
    "GLOBAL TOBACCO，不仅是您的烟草采购平台，更是您连接全球烟草文化的桥梁。我们以专业和诚信，守护您的每一次品鉴之旅。",
};

export default function BrandStory() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
      {/* 标题区域 */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 mb-2">
          {storyData.title}
        </h2>
        <p className="text-xl md:text-2xl text-zinc-300 font-light">
          —— {storyData.subtitle}
        </p>
      </div>

      {/* 品牌介绍 */}
      <div className="mb-12 md:mb-16">
        <p className="text-base md:text-lg text-zinc-300 leading-relaxed text-center max-w-3xl mx-auto border-l-4 border-red-500 pl-6">
          {storyData.introduction}
        </p>
      </div>

      {/* 承诺卡片 */}
      <div className="mb-12 md:mb-16">
        <h3 className="text-xl font-bold text-white mb-8 text-center">
          我们的承诺：
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {storyData.promises.map((promise, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-red-500/50 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-500 font-bold text-sm">
                    {index + 1}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {promise.title}
                </h4>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {promise.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 结尾 */}
      <div className="text-center">
        <p className="text-base md:text-lg text-zinc-300 leading-relaxed italic">
          {storyData.closing}
        </p>
      </div>

      {/* 装饰线 */}
      <div className="mt-12 pt-8 border-t border-white/10 flex justify-center">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-orange-600"></div>
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
        </div>
      </div>
    </section>
  );
}
