import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Global Tobacco <orders@globaltobacco.com>'; // 需要在 Resend 后台验证域名，或者先用 'onboarding@resend.dev' 测试

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is missing. Email not sent.");
    return { success: false, error: "Missing API Key" };
  }

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      html: html,
    });
    console.log(`📧 Email sent to ${to}: ${data.id}`);
    return { success: true, data };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    return { success: false, error };
  }
}

export async function sendOrderConfirmationEmail(order: any) {
  const subject = `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Thank you for your order!</h1>
      <p>Hi ${order.shippingAddress?.firstName || 'Customer'},</p>
      <p>We have received your order and are getting it ready.</p>
      
      <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Summary</h3>
        <p><strong>Order ID:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>Total:</strong> $${Number(order.totalAmount).toFixed(2)}</p>
      </div>

      <h3>Items:</h3>
      <ul>
        ${order.items.map((item: any) => `
          <li>
            ${item.productTitleSnapshot} (${item.flavorSnapshot}) x ${item.quantity} - $${(Number(item.unitPrice) * item.quantity).toFixed(2)}
          </li>
        `).join('')}
      </ul>

      <p>We will notify you when your order ships.</p>
      <p>Best regards,<br>Global Tobacco Team</p>
    </div>
  `;
  
  // 优先使用 guestEmail，如果没有则尝试 user.email (需要传入 user 对象或在 order 中 include user)
  const email = order.guestEmail || order.user?.email;
  if (email) {
    return sendEmail(email, subject, html);
  }
}

export async function sendShippingUpdateEmail(order: any) {
  const subject = `Your Order #${order.id.slice(0, 8).toUpperCase()} has Shipped!`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Good news! Your order is on the way.</h1>
      <p>Hi ${order.shippingAddress?.firstName || 'Customer'},</p>
      <p>Your order has been shipped via <strong>${order.carrierName}</strong>.</p>
      
      <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
        ${order.trackingUrl ? `<p><a href="${order.trackingUrl}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Track Your Package</a></p>` : ''}
      </div>

      <p>Best regards,<br>Global Tobacco Team</p>
    </div>
  `;

  const email = order.guestEmail || order.user?.email;
  if (email) {
    return sendEmail(email, subject, html);
  }
}

export async function sendOrderCancellationEmail(order: any, reason?: string) {
  const subject = `Order Cancelled #${order.id.slice(0, 8).toUpperCase()}`;
  const html = `
    <div style="font-family: sans-serif; color: #333;">
      <h1>Order Cancelled</h1>
      <p>Hi ${order.shippingAddress?.firstName || 'Customer'},</p>
      <p>Your order #${order.id.slice(0, 8).toUpperCase()} has been cancelled.</p>
      
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      
      <p>If you have already paid, a refund has been initiated to your account balance.</p>
      
      <p>If you have any questions, please reply to this email.</p>
      <p>Best regards,<br>Global Tobacco Team</p>
    </div>
  `;

  const email = order.guestEmail || order.user?.email;
  if (email) {
    return sendEmail(email, subject, html);
  }
}
