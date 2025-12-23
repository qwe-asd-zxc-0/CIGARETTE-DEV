"use client";

import { useState } from "react";
import { 
  Save, Image as ImageIcon, Link as LinkIcon, Type, Eye, EyeOff, 
  Loader2, UploadCloud, History, Trash2, ArrowUpCircle, X 
} from "lucide-react";
import { saveSystemSetting, saveCampaignToHistory, deleteCampaign } from "@/app/[locale]/admin/(protected)/settings/actions";
import ImageUploader from "@/components/ImageUploader";
import Image from "next/image";

// 定义配置类型
interface ConfigType {
  isActive: boolean;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  linkUrl: string;
}

export default function ActivityConfig({ 
  initialData, 
  historyData = [] // 接收历史数据
}: { 
  initialData: any, 
  historyData?: any[] 
}) {
  const [loading, setLoading] = useState(false);
  
  const [config, setConfig] = useState<ConfigType>({
    isActive: initialData?.isActive ?? false,
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    imageUrl: initialData?.imageUrl || "",
    buttonText: initialData?.buttonText || "查看详情",
    linkUrl: initialData?.linkUrl || "/product",
  });

  // 保存并发布到首页
  const handlePublish = async () => {
    setLoading(true);
    const res = await saveSystemSetting("promo_activity", config);
    setLoading(false);
    if (res.success) alert("✅ 活动已发布到首页！");
    else alert("❌ 发布失败");
  };

  // 另存为历史记录
  const handleSaveHistory = async () => {
    if (!config.title) return alert("请至少填写标题");
    if (!confirm("确定将当前内容保存到历史记录吗？")) return;
    
    setLoading(true);
    const res = await saveCampaignToHistory(config);
    setLoading(false);
    if (res.success) alert("✅ 已归档到历史记录");
  };

  // 删除历史
  const handleDeleteHistory = async (id: string) => {
    if (!confirm("确定删除这条记录吗？")) return;
    await deleteCampaign(id);
  };

  // 加载历史
  const handleLoadHistory = (record: any) => {
    setConfig({
      ...config, // 保留当前的 isActive 状态
      title: record.title,
      subtitle: record.subtitle || "",
      imageUrl: record.imageUrl || "",
      buttonText: record.buttonText || "查看详情",
      linkUrl: record.linkUrl || "/product",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 滚回顶部
  };

  return (
    <div className="space-y-10">
      
      {/* === 主配置区域 === */}
      <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-500" />
              当前活动配置
            </h3>
            <p className="text-zinc-400 text-sm mt-1">编辑并发布首页顶部的营销活动。</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setConfig({ ...config, isActive: !config.isActive })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                config.isActive 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-zinc-800 text-zinc-500 border-zinc-700"
              }`}
            >
              {config.isActive ? "🟢 已展示" : "⚫ 已隐藏"}
            </button>
            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              发布上线
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* 左侧表单 */}
          <div className="space-y-6">
            
            {/* 图片上传 (优化版) */}
            <div className="bg-black/20 border border-dashed border-white/20 rounded-xl p-4 transition-colors hover:border-blue-500/50">
              <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-3">
                <ImageIcon className="w-4 h-4 text-blue-400" /> 
                背景图片
              </label>
              
              {config.imageUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-white/10">
                  <div className="relative h-40 w-full">
                    <Image src={config.imageUrl} alt="Banner" fill className="object-cover" />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={() => setConfig({ ...config, imageUrl: "" })}
                      className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-500 flex items-center gap-2"
                    >
                      <X className="w-3 h-3" /> 移除图片
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <ImageUploader onUploadComplete={(url) => setConfig({ ...config, imageUrl: url })} />
                  <p className="text-xs text-zinc-500 mt-3">支持拖拽上传，建议尺寸 1920x600</p>
                </div>
              )}
            </div>

            {/* 文本输入 */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">主标题</label>
                <input
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none font-bold tracking-wide"
                  placeholder="例如：夏季狂欢节"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">副标题 / 描述</label>
                <textarea
                  value={config.subtitle}
                  onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white resize-none focus:border-blue-500 outline-none text-sm"
                  placeholder="输入活动详情..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">按钮文字</label>
                  <input
                    value={config.buttonText}
                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase mb-1.5 block">跳转链接</label>
                  <input
                    value={config.linkUrl}
                    onChange={(e) => setConfig({ ...config, linkUrl: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 另存为历史按钮 */}
            <div className="pt-2">
              <button
                onClick={handleSaveHistory}
                disabled={loading}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <History className="w-3 h-3" />
                将当前内容归档到历史记录
              </button>
            </div>
          </div>

          {/* 右侧预览 */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase mb-3 block flex justify-between">
              <span>实时效果预览</span>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Preview</span>
            </label>
            <div className="relative rounded-2xl overflow-hidden bg-zinc-800 aspect-[16/9] flex items-center justify-center border border-white/10 shadow-2xl group">
              {config.imageUrl ? (
                <img src={config.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-zinc-800/50">
                  <UploadCloud className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-sm">暂无背景图</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />
              
              <div className="relative z-10 text-left p-8 w-full">
                <span className="inline-block px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold mb-3">
                  限时特惠
                </span>
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{config.title || "活动标题"}</h3>
                <p className="text-xs text-zinc-300 mb-6 max-w-[80%] line-clamp-2">{config.subtitle || "活动描述..."}</p>
                <span className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full shadow-lg">
                  {config.buttonText}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 历史记录区域 === */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-orange-500" />
          历史活动记录 ({historyData.length})
        </h3>
        
        {historyData.length === 0 ? (
          <div className="text-center py-10 bg-zinc-900/30 rounded-xl border border-dashed border-white/10 text-zinc-500 text-sm">
            暂无历史记录。编辑上方内容后点击“归档”即可保存模板。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyData.map((record) => (
              <div key={record.id} className="group bg-zinc-900 border border-white/5 hover:border-white/20 rounded-xl overflow-hidden transition-all flex flex-col">
                {/* 缩略图 */}
                <div className="h-24 bg-zinc-800 relative overflow-hidden">
                  {record.imageUrl ? (
                    <Image src={record.imageUrl} alt={record.title} fill className="object-cover opacity-50" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">无图片</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white font-bold truncate text-sm">{record.title}</p>
                    <p className="text-zinc-500 text-[10px]">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* 操作栏 */}
                <div className="p-3 flex gap-2 mt-auto bg-black/20">
                  <button 
                    onClick={() => handleLoadHistory(record)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs py-1.5 rounded transition-colors border border-white/5"
                  >
                    <ArrowUpCircle className="w-3 h-3" /> 应用此模板
                  </button>
                  <button 
                    onClick={() => handleDeleteHistory(record.id)}
                    className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded transition-colors border border-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}