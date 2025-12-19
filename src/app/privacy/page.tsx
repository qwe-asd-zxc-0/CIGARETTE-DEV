export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">隐私政策 (Privacy Policy)</h1>
        
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. 我们收集的信息</h2>
          <p>我们收集您直接提供给我们的信息，例如当您创建账户、进行购买、订阅我们的通讯或联系我们寻求支持时。这可能包括您的姓名、电子邮件地址、送货地址和付款信息。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. 我们如何使用您的信息</h2>
          <p>我们使用收集的信息来处理您的订单、与您沟通、改进我们的服务以及防止欺诈。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. 信息共享</h2>
          <p>我们不会将您的个人信息出售或出租给第三方。我们可能会与代表我们执行服务的服务提供商共享您的信息，例如支付处理和运输。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. 安全性</h2>
          <p>我们采取合理的措施来帮助保护您的信息免受丢失、盗窃、滥用以及未经授权的访问、披露、更改和破坏。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">5. Cookies</h2>
          <p>我们使用 cookies 来帮助我们改进服务和您的体验。您可以将浏览器设置为拒绝所有或部分浏览器 cookies，或者在网站设置或访问 cookies 时提醒您。</p>
        </section>
        
        <p className="text-sm text-zinc-500 pt-8">最后更新: {new Date().toLocaleDateString('zh-CN')}</p>
      </div>
    </div>
  );
}
