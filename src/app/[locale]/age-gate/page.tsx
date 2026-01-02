import { prisma } from '@/lib/prisma';
import AgeGate from '@/components/AgeGate';

// 这是一个“服务端组件”，它直接运行在服务器上，拥有直接访问数据库的权限
export default async function Home() {
  let dbStatus = "正在检测连接...";
  let products: any[] = [];
  let errorMsg = "";

  try {
    // 🔍 动作：尝试连接数据库并读取商品表
    // 这里的 console.log 会显示在 VS Code 的终端里，而不是浏览器的控制台
    console.log("🚀 发起数据库连接请求...");
    
    const count = await prisma.product.count(); // 查数量
    products = await prisma.product.findMany({  // 查具体数据
      include: { brand: true } // 连表查询品牌
    });
    
    console.log(`✅ 数据库连接成功！读取到 ${count} 个商品。`);
    dbStatus = "连接成功 (Connected)";

  } catch (e: unknown) {
    console.error("❌ 数据库连接失败:", e);
    dbStatus = "连接失败 (Connection Failed)";
    errorMsg = e instanceof Error ? e.message : 'Unknown error';
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* 1. 年龄验证弹窗 (保持合规) */}
      <AgeGate />

      {/* 2. 数据库连接状态调试面板 */}
      <div className="max-w-4xl mx-auto mb-10 p-6 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900">
        <h2 className="text-xl font-bold mb-4 text-yellow-500">🔧 数据库连接诊断 (Debug Panel)</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-zinc-400">状态：</span>
            <span className={errorMsg ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
              {dbStatus}
            </span>
          </div>
          <div>
             <span className="text-zinc-400">商品数量：</span>
             <span className="font-mono text-xl">{products.length}</span>
          </div>
        </div>

        {/* 如果报错，显示具体错误信息 */}
        {errorMsg && (
          <div className="bg-red-900/50 p-4 rounded text-red-200 text-sm font-mono whitespace-pre-wrap">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 3. 真实数据显示区域 */}
      <h1 className="text-3xl font-bold text-center mb-8">商品列表</h1>
      
      {products.length === 0 ? (
        <p className="text-center text-gray-500">暂无数据 (请检查 seed 脚本是否运行)</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {products.map((p) => (
            <div key={p.id} className="border border-zinc-800 p-4 rounded bg-zinc-900/50">
              <h3 className="text-lg font-bold text-white">
                {typeof p.title === 'object' ? (p.title?.en || JSON.stringify(p.title)) : p.title}
              </h3>
              <p className="text-red-500">${Number(p.basePrice)}</p>
              <p className="text-xs text-zinc-500 mt-2">
                所属品牌: {typeof p.brand?.name === 'object' ? (p.brand?.name?.en || JSON.stringify(p.brand?.name)) : p.brand?.name}
              </p>
              <p className="text-xs text-zinc-500">ID: {p.id}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}