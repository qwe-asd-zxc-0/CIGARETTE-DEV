export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">退款政策 (Refund Policy)</h1>
        
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. 退货</h2>
          <p>由于我们产品的性质，我们通常不接受电子烟油或已开封硬件的退货。但是，如果您收到有缺陷或错误的商品，请在交货后 48 小时内联系我们。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. 退款</h2>
          <p>收到并检查您的退货后，我们将向您发送一封电子邮件，通知您我们已收到您退回的商品。我们还将通知您退款的批准或拒绝情况。如果获得批准，您的退款将被处理，并且信用额度将自动应用到您的原始付款方式。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. 换货</h2>
          <p>我们仅在商品有缺陷或损坏时才进行更换。如果您需要将其换成相同的商品，请发送电子邮件至 support@globaltobacco.com。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. 退货运费</h2>
          <p>您将负责支付退回商品的运费。运费不予退还。</p>
        </section>
        
        <p className="text-sm text-zinc-500 pt-8">最后更新: {new Date().toLocaleDateString('zh-CN')}</p>
      </div>
    </div>
  );
}
