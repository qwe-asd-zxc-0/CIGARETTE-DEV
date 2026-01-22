import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { 
  getOrderConfirmationHtml, 
  getShippingUpdateHtml, 
  getOrderCancellationHtml 
} from './email-templates';

// 1. 初始化 Resend
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

// ⚠️ 确保你的发件人域名已在 Resend 验证，或者是 onboarding@resend.dev
const FROM_EMAIL = 'Yankegou <orders@yankegou.com>'; 

/**
 * 📨 基础邮件发送函数 (核心逻辑)
 */
export async function sendEmail(to: string, subject: string, html: string) {
  let status = 'failed';
  let errorMsg = null;
  let data = null;

  // 🛡️ 开发环境优化：如果没有 API Key，直接在控制台打印内容，模拟发送成功
  if (!resend) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n============== [DEV EMAIL MOCK] ==============`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML Preview: ${html.substring(0, 100)}...`);
      console.log(`==============================================\n`);
      return { success: true, data: { id: 'dev-mock-id' } };
    }
    
    console.warn("⚠️ RESEND_API_KEY is missing. Email not sent.");
    errorMsg = "Missing API Key";
  } else {
    try {
      const response = await resend.emails.send({
        from: FROM_EMAIL,
        to: to,
        subject: subject,
        html: html,
      });
      
      if (response.error) {
        errorMsg = response.error.message;
      } else {
        status = 'sent';
        data = response.data;
        console.log(`📧 Email sent to ${to}: ${data?.id}`);
      }
    } catch (error: any) {
      console.error("❌ Failed to send email:", error);
      errorMsg = error.message || String(error);
    }
  }

  // 📝 记录到数据库 (EmailLog)
  // 使用 Promise.allSettled 或不等待它，防止日志写入失败阻塞主流程
  prisma.emailLog.create({
    data: {
      to,
      subject,
      status,
      error: errorMsg,
    },
  }).catch(e => console.error("❌ Failed to log email:", e));

  if (status === 'sent' || (!resend && process.env.NODE_ENV === 'development')) {
    return { success: true, data };
  } else {
    return { success: false, error: errorMsg };
  }
}

// --- 🚀 业务发送函数 ---

/**
 * ✅ 新增：发送验证码 (OTP)
 * 用于游客查单或无密码登录
 */
export async function sendOtpEmail(email: string, code: string) {
  const subject = `Your Login Code: ${code} - Yankegou`;
  
  // 这里直接内联简单的 HTML，不需要单独的模板文件
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Login Verification</h2>
      <p style="color: #666; font-size: 14px;">You requested to sign in or track your order at Yankegou.</p>
      <div style="background: #f4f4f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${code}</span>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">This code will expire in 15 minutes. If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

export async function sendOrderConfirmationEmail(order: any) {
  const orderId = order.id?.slice(0, 8).toUpperCase() || 'UNKNOWN';
  const subject = `Order Confirmation #${orderId}`; // 建议统一用英文或根据用户 locale 传参
  const html = getOrderConfirmationHtml(order);
  
  // 优先取游客邮箱，其次取关联用户的邮箱
  const email = order.guestEmail || order.user?.email;
  
  if (email) return sendEmail(email, subject, html);
  console.warn(`⚠️ No email found for order ${order.id}`);
}

export async function sendShippingUpdateEmail(order: any) {
  const orderId = order.id?.slice(0, 8).toUpperCase() || 'UNKNOWN';
  const subject = `Order #${orderId} Has Shipped!`;
  const html = getShippingUpdateHtml(order);

  const email = order.guestEmail || order.user?.email;
  
  if (email) return sendEmail(email, subject, html);
}

export async function sendOrderCancellationEmail(order: any, reason?: string) {
  const orderId = order.id?.slice(0, 8).toUpperCase() || 'UNKNOWN';
  const subject = `Order Cancelled #${orderId}`;
  const html = getOrderCancellationHtml(order, reason);

  const email = order.guestEmail || order.user?.email;
  
  if (email) return sendEmail(email, subject, html);
}