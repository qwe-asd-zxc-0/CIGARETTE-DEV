import { useLocale } from 'next-intl';

// 定义翻译字段的类型结构
// Prisma 的 Json 类型在前端通常表现为 any 或 unknown，这里定义得更具体一些
export type TranslatableField = {
  [key: string]: string; // e.g. { en: "Name", zh: "名字" }
} | string | null | any; // 兼容旧数据可能是 string 的情况

/**
 * 获取当前语言的翻译文本
 * @param data 数据库中的多语言字段 (Json)
 * @param locale 当前语言代码 (e.g. 'en', 'zh')
 * @param defaultLocale 默认回退语言
 * @returns 翻译后的字符串
 */
export function getTrans(
  data: TranslatableField | undefined | null, 
  locale: string, 
  defaultLocale: string = 'en'
): string {
  if (!data) return '';

  // 如果数据本身就是字符串（旧数据或未迁移数据），直接返回
  if (typeof data === 'string') return data;

  // 尝试获取当前语言
  if (data[locale]) {
    return data[locale];
  }

  // 尝试获取主要语言代码 (e.g. 'zh-CN' -> 'zh')
  const langPrefix = locale.split('-')[0];
  if (data[langPrefix]) {
    return data[langPrefix];
  }

  // 回退到默认语言
  if (data[defaultLocale]) {
    return data[defaultLocale];
  }

  // 如果都没有，返回第一个可用的值
  if (typeof data === 'object') {
    const values = Object.values(data);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0] as string;
    }
  }

  return '';
}
