import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { getOrderConfirmationHtml, getShippingUpdateHtml, getOrderCancellationHtml } from './email-templates';

// 只有在 API Key 存在时才初始化 Resend 实例，防止报错崩溃
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = 'Global Tobacco <orders@globaltobacco.com>'; // 需要在 Resend 后台验证域名，或者先用 'onboarding@resend.dev' 测试

export async function sendEmail(to: string, subject: string, html: string) {
  let status = 'failed';
  let errorMsg = null;
  let data = null;

  if (!resend) {
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

  // 记录到数据库
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        status,
        error: errorMsg,
      },
    });
  } catch (logError) {
    console.error("❌ Failed to log email:", logError);
  }

  if (status === 'sent') {
    return { success: true, data };
  } else {
    return { success: false, error: errorMsg };
  }
}

// --- 🚀 发送函数 ---

export async function sendOrderConfirmationEmail(order: any) {
  const subject = `订单确认 #${order.id.slice(0, 8).toUpperCase()}`;
  const html = getOrderConfirmationHtml(order);
  
  const email = order.guestEmail || order.user?.email;
  if (email) return sendEmail(email, subject, html);
}

export async function sendShippingUpdateEmail(order: any) {
  const subject = `您的订单 #${order.id.slice(0, 8).toUpperCase()} 已发货！`;
  const html = getShippingUpdateHtml(order);

  const email = order.guestEmail || order.user?.email;
  if (email) return sendEmail(email, subject, html);
}

export async function sendOrderCancellationEmail(order: any, reason?: string) {
  const subject = `订单取消 #${order.id.slice(0, 8).toUpperCase()}`;
  const html = getOrderCancellationHtml(order, reason);

  const email = order.guestEmail || order.user?.email;
  if (email) return sendEmail(email, subject, html);
}
