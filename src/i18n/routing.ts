import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // 支持的语言列表: 英语, 中文, 马来语, 泰语
  locales: ['en', 'zh', 'ms', 'th'],
  
  // 默认语言
  defaultLocale: 'en'
});

export const {Link, redirect, usePathname, useRouter, getPathname} =
  createNavigation(routing);
