'use client';

import { useState } from 'react';

// 定义支持的社交平台类型
type SocialType = 'wechat' | 'whatsapp' | 'telegram';

export default function ContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SocialType>('wechat');

  // 配置各个平台的信息
  const socialData = {
    wechat: {
      name: 'WeChat',
      label: '微信',
      bgColor: 'bg-[#07c160]/10',
      qrCode: '/20251208233100_91_173.jpg'
    },
    whatsapp: {
      name: 'WhatsApp',
      label: 'WhatsApp',
      bgColor: 'bg-[#25d366]/10',
      qrCode: '/20251208233100_91_173.jpg' // 帮您补全了路径
    },
    telegram: {
      name: 'Telegram',
      label: 'Telegram',
      bgColor: 'bg-[#0088cc]/10',
      qrCode: '/20251208233100_91_173.jpg' // 帮您补全了路径
    }
  };

  return (
    // 🚩 修复 1: 外层容器添加 pointer-events-none，让点击能穿透空白区域
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans pointer-events-none">
      
      {/* 弹出的面板 */}
      <div 
        // 🚩 修复 2: 面板打开时需要 pointer-events-auto，否则无法操作面板内的选项
        // 关闭时保持 pointer-events-none，避免误触
        className={`mb-4 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ width: '280px' }}
      >
        {/* 顶部选项卡 */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/50">
          {(Object.keys(socialData) as SocialType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex-1 py-3 text-xs font-medium transition-colors relative ${
                activeTab === type ? 'text-zinc-900 bg-white' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {socialData[type].name}
              {/* 选中时的底部红条 */}
              {activeTab === type && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 mx-3 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        {/* 二维码展示区域 */}
        <div className="p-6 flex flex-col items-center">
          <div className={`w-40 h-40 rounded-xl flex items-center justify-center mb-4 ${socialData[activeTab].bgColor} border border-zinc-100 p-2`}>
             {/* 二维码图片 */}
             <img 
               src={socialData[activeTab].qrCode} 
               alt={`${socialData[activeTab].name} QR`}
               className="w-full h-full object-contain mix-blend-multiply opacity-90"
             />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-zinc-800 mb-1">
              扫码添加 {socialData[activeTab].label}
            </p>
            <p className="text-xs text-zinc-400">
              Scan to chat with us
            </p>
          </div>
        </div>
      </div>

      {/* 悬浮按钮 (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // 🚩 修复 3: 按钮必须添加 pointer-events-auto，否则也无法点击
        className={`group w-14 h-14 rounded-full shadow-lg shadow-red-900/20 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 pointer-events-auto ${
          isOpen ? 'bg-zinc-900' : 'bg-gradient-to-br from-red-600 to-red-700'
        }`}
        aria-label="Contact Us"
      >
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          {isOpen ? (
            // 关闭图标 (X)
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            // 聊天图标 (Chat Bubble)
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}