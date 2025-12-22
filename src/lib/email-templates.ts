// --- 🎨 邮件样式常量 ---
export const EMAIL_STYLES = {
  container: 'font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;',
  header: 'background-color: #000000; padding: 24px; text-align: center;',
  headerTitle: 'color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;',
  body: 'padding: 32px 24px; color: #333333; line-height: 1.6;',
  h1: 'margin-top: 0; color: #111111; font-size: 22px; font-weight: bold;',
  p: 'margin-bottom: 16px; font-size: 16px;',
  highlightBox: 'background-color: #f9f9f9; border: 1px solid #eeeeee; border-radius: 8px; padding: 20px; margin: 24px 0;',
  button: 'display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 8px;',
  footer: 'background-color: #f4f4f5; padding: 24px; text-align: center; font-size: 12px; color: #666666;',
  itemRow: 'display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eeeeee;',
  totalRow: 'display: flex; justify-content: space-between; padding-top: 16px; font-weight: bold; font-size: 18px; border-top: 2px solid #111111; margin-top: 16px;'
};

// --- 📧 HTML 生成函数 (导出用于预览) ---

export function getOrderConfirmationHtml(order: any) {
  const itemsHtml = order.items.map((item: any) => `
    <div style="${EMAIL_STYLES.itemRow}">
      <span>${item.productTitleSnapshot} <span style="color: #666; font-size: 14px;">(${item.flavorSnapshot})</span> x ${item.quantity}</span>
      <span>$${(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
    </div>
  `).join('');

  return `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="${EMAIL_STYLES.headerTitle}">GLOBAL TOBACCO</h1>
      </div>
      
      <div style="${EMAIL_STYLES.body}">
        <h1 style="${EMAIL_STYLES.h1}">感谢您的订单！</h1>
        <p style="${EMAIL_STYLES.p}">您好 ${order.shippingAddress?.firstName || '顾客'},</p>
        <p style="${EMAIL_STYLES.p}">我们已收到您的订单，正在为您准备发货。</p>
        
        <div style="${EMAIL_STYLES.highlightBox}">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px;">订单摘要</h3>
          <p style="margin: 4px 0; color: #666;">订单号: <strong>#${order.id.slice(0, 8).toUpperCase()}</strong></p>
          <p style="margin: 4px 0; color: #666;">日期: ${new Date().toLocaleDateString('zh-CN')}</p>
          
          <div style="margin-top: 20px;">
            ${itemsHtml}
          </div>
          
          <div style="${EMAIL_STYLES.totalRow}">
            <span>总计</span>
            <span>$${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </div>

        <p style="${EMAIL_STYLES.p}">包裹发货后，我们会第一时间通过邮件通知您。</p>
      </div>

      <div style="${EMAIL_STYLES.footer}">
        <p>&copy; ${new Date().getFullYear()} Global Tobacco. 保留所有权利。</p>
        <p>如果您有任何问题，请直接回复此邮件。</p>
      </div>
    </div>
  `;
}

export function getShippingUpdateHtml(order: any) {
  return `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="${EMAIL_STYLES.headerTitle}">GLOBAL TOBACCO</h1>
      </div>
      
      <div style="${EMAIL_STYLES.body}">
        <h1 style="${EMAIL_STYLES.h1}">好消息！您的订单已发货。</h1>
        <p style="${EMAIL_STYLES.p}">您好 ${order.shippingAddress?.firstName || '顾客'},</p>
        <p style="${EMAIL_STYLES.p}">您的订单已通过 <strong>${order.carrierName}</strong> 发出。</p>
        
        <div style="${EMAIL_STYLES.highlightBox}">
          <p style="margin-bottom: 8px; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">物流追踪号</p>
          <p style="font-size: 24px; font-weight: bold; margin: 0 0 24px 0; font-family: monospace;">${order.trackingNumber}</p>
          
          ${order.trackingUrl ? `
            <div style="text-align: center;">
              <a href="${order.trackingUrl}" style="${EMAIL_STYLES.button}">追踪您的包裹</a>
            </div>
          ` : ''}
        </div>

        <p style="${EMAIL_STYLES.p}">物流信息更新可能需要 24 小时，请耐心等待。</p>
      </div>

      <div style="${EMAIL_STYLES.footer}">
        <p>&copy; ${new Date().getFullYear()} Global Tobacco. 保留所有权利。</p>
      </div>
    </div>
  `;
}

export function getOrderCancellationHtml(order: any, reason?: string) {
  return `
    <div style="${EMAIL_STYLES.container}">
      <div style="${EMAIL_STYLES.header}">
        <h1 style="${EMAIL_STYLES.headerTitle}">GLOBAL TOBACCO</h1>
      </div>
      
      <div style="${EMAIL_STYLES.body}">
        <h1 style="${EMAIL_STYLES.h1}">订单已取消</h1>
        <p style="${EMAIL_STYLES.p}">您好 ${order.shippingAddress?.firstName || '顾客'},</p>
        <p style="${EMAIL_STYLES.p}">您的订单 <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> 已被取消。</p>
        
        ${reason ? `
          <div style="background-color: #fff1f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0; color: #991b1b;">
            <strong>取消原因:</strong> ${reason}
          </div>
        ` : ''}
        
        <p style="${EMAIL_STYLES.p}">如果您已经付款，退款已立即退回到您的账户余额中。</p>
        <p style="${EMAIL_STYLES.p}">对于给您带来的不便，我们深表歉意。</p>
      </div>

      <div style="${EMAIL_STYLES.footer}">
        <p>&copy; ${new Date().getFullYear()} Global Tobacco. 保留所有权利。</p>
      </div>
    </div>
  `;
}
