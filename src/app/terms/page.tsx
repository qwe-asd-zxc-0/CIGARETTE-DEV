export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-zinc-300 space-y-8">
        <h1 className="text-4xl font-bold text-white mb-8">服务条款 (Terms of Service)</h1>
        
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. 简介</h2>
          <p>欢迎来到 Global Tobacco。访问我们的网站即表示您同意受这些服务条款、所有适用法律和法规的约束，并同意您有责任遵守任何适用的当地法律。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. 年龄限制</h2>
          <p>您必须年满 21 岁（或您所在司法管辖区的法定吸烟年龄）才能访问本网站并购买产品。同意这些服务条款，即表示您声明您至少已达到您居住的州或省的法定成年年龄。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. 产品与服务</h2>
          <p>所有产品视供应情况而定。我们保留随时停产任何产品的权利。我们产品的价格如有更改，恕不另行通知。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">4. 用户账户</h2>
          <p>如果您在我们的网站上创建账户，您有责任维护您账户的安全，并对该账户下发生的所有活动负全部责任。</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">5. 适用法律</h2>
          <p>这些条款应受美国法律管辖并据其解释，不考虑其法律冲突规定。</p>
        </section>
        
        <p className="text-sm text-zinc-500 pt-8">最后更新: {new Date().toLocaleDateString('zh-CN')}</p>
      </div>
    </div>
  );
}
