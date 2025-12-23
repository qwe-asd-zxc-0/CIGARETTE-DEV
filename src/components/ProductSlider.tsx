'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useTranslations, useLocale } from 'next-intl';
import { getTrans } from '@/lib/i18n-utils';

type Product = {
  id: string | number;
  coverImageUrl?: string | null;
  title: any; // Changed to any to support Json
  basePrice: number | string;
  brand?: { name?: any | null } | null; // Changed to any
};

const Slider = dynamic(() => import('react-slick'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-white/5 animate-pulse rounded-xl"></div>
});

// 定义 Slider 的配置
const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
      }
    },
    {
      breakpoint: 640,
      settings: {
        slidesToShow: 1,
      }
    }
  ]
};

export default function ProductSlider({ products }: { products: Product[] }) {
  const t = useTranslations('ProductPage');
  const locale = useLocale();
  if (!products || products.length === 0) return null;

  return (
    <div className="product-slider-container px-4">
      <Slider {...settings}>
        {products.map((product) => (
          <div key={product.id} className="px-3 py-2 h-full">
            <Link href={`/product/${product.id}`} className="group block h-full">
              <div className="bg-zinc-900/40 rounded-xl overflow-hidden hover:bg-zinc-900 transition-all duration-300 h-full flex flex-col ring-1 ring-white/5 hover:ring-white/10 hover:shadow-2xl">
                
                {/* 图片区域 */}
                <div className="aspect-[4/5] bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                  {product.coverImageUrl ? (
                    <img 
                      src={product.coverImageUrl} 
                      alt={getTrans(product.title, locale)} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                      <span className="text-4xl">📷</span>
                      <span className="text-xs">{t('noPreview')}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                    {t('hot')}
                  </div>
                </div>
                
                {/* 信息区域 */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xs text-red-500 font-bold mb-1 uppercase tracking-wider">
                    {getTrans(product.brand?.name, locale) || t('brand')}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200 mb-2 line-clamp-2 group-hover:text-white">
                    {getTrans(product.title, locale)}
                  </h3>
                  <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-lg font-mono text-zinc-100">
                      ${Number(product.basePrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </Slider>
    </div>
  );
}