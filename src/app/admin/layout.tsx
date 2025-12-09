import AdminSidebar from "@/components/admin/AdminSidebar";

// AdminLayout 是嵌套在 RootLayout 内部的
// 所以它不需要 <html> 或 <body> 标签
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 使用 div 作为容器
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans">
      {/* 左侧：固定侧边栏 */}
      <AdminSidebar />
      
      {/* 右侧：主内容区域 */}
      {/* ml-64 是为了给 fixed 的侧边栏留出空间 */}
      <main className="flex-1 ml-64 p-8 min-h-screen bg-black">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}