'use server';

import { prisma } from '@/lib/prisma';
import { sendOtpEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
// ✅ 新增：引入服务端翻译函数
import { getTranslations } from 'next-intl/server';

// 1. 发送验证码 Action
export async function sendOtp(formData: FormData) {
  // ✅ 获取翻译器 (自动识别当前请求的语言)
  const t = await getTranslations('AuthActions');

  const email = formData.get('email') as string;
  
  if (!email || !email.includes('@')) {
    return { success: false, message: t('invalidEmail') };
  }

  // 生成 6 位随机数字
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // 15分钟后过期
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

  try {
    // 1. 存入数据库
    await prisma.verificationCode.create({
      data: { email, code, expiresAt }
    });

    // 2. 发送邮件
    const result = await sendOtpEmail(email, code);
    
    if (!result || !result.success) {
        // 开发环境特殊处理
        if (process.env.NODE_ENV === 'development') {
            return { success: true, message: t('devMode') };
        }
        return { success: false, message: t('sendFailed') };
    }

    return { success: true, message: t('sendSuccess') };

  } catch (error) {
    console.error("Send OTP Error:", error);
    return { success: false, message: t('systemError') };
  }
}

// 2. 验证登录 Action
export async function verifyOtp(prevState: any, formData: FormData) {
  // ✅ 获取翻译器
  const t = await getTranslations('AuthActions');

  const email = formData.get('email') as string;
  const code = formData.get('code') as string;

  if (!code || code.length !== 6) {
    return { success: false, message: t('invalidFormat') };
  }

  try {
    // 1. 查找有效验证码
    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() } // 必须未过期
      }
    });

    if (!record) {
      return { success: false, message: t('invalidCode') };
    }

    // 2. 验证成功：删除该邮箱的所有旧验证码
    await prisma.verificationCode.deleteMany({ where: { email } });

    // 3. 设置 Cookie
    const cookieStore = await cookies();
    
    cookieStore.set('guest_email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 Days
      path: '/',
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return { success: false, message: t('verifyFailed') };
  }

  // 4. 跳转 (Redirect 必须在 try-catch 之外)
  redirect('/profile/orders');
}