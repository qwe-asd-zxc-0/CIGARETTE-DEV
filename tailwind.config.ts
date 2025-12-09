import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 在这里可以定义您的品牌颜色，例如：
        // brand: {
        //   red: '#ef4444',
        //   dark: '#18181b',
        // }
      },
      fontFamily: {
        // 自定义字体配置
      },
      // 👇👇👇 新增动画配置 👇👇👇
      animation: {
        // 背景流光动画（慢速、循环）
        'smoke-flow-1': 'smoke-flow-1 25s ease-in-out infinite alternate',
        'smoke-flow-2': 'smoke-flow-2 30s ease-in-out infinite alternate-reverse',
        'smoke-flow-3': 'smoke-flow-3 28s ease-in-out infinite alternate',
        // 元素进入动画（一次性）
        'fade-in-up': 'fade-in-up 1s ease-out forwards',
      },
      keyframes: {
        // 关键帧定义
        'smoke-flow-1': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: '0.3' },
          '100%': { transform: 'translate(10%, 15%) scale(1.2) rotate(10deg)', opacity: '0.6' },
        },
        'smoke-flow-2': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: '0.4' },
          '100%': { transform: 'translate(-15%, -10%) scale(1.1) rotate(-15deg)', opacity: '0.2' },
        },
        'smoke-flow-3': {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: '0.3' },
          '50%': { transform: 'translate(5%, -5%) scale(1.3)', opacity: '0.5' },
          '100%': { transform: 'translate(-5%, 10%) scale(1)', opacity: '0.3' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // 👆👆👆 新增结束 👆👆👆
    },
  },
  plugins: [],
};

export default config;