export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">运输政策 (Shipping Policy)</h1>
        
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. 处理时间</h2>
          <p>所有订单将在 1-2 个工作日内处理。周末或节假日不发货或送货。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. 运费和预计送达时间</h2>
          <p>您订单的运费将在结账时计算并显示。偶尔可能会出现交货延迟。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. 交付时的年龄验证</h2>
          <p>所有包含烟草产品的订单在交付时都需要成人签名（21 岁以上）。请确保有法定年龄的人可以签收包裹。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. 国际运输</h2>
          <p>我们目前向选定的国际目的地发货。请注意，您负责支付可能适用的任何海关和进口税。</p>
        </section>
        
        <p className="text-sm text-zinc-500 pt-8">最后更新: {new Date().toLocaleDateString('zh-CN')}</p>
      </div>
    </div>
  );
}
