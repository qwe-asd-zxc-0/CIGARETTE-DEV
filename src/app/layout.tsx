import type { Metadata } from "next";
import "./globals.css";
// 👇 1. 引入 GlobalOverlay 组件 (它包含了联系按钮、优惠券弹窗和年龄验证)
import GlobalOverlay from "@/components/GlobalOverlay";

export const metadata: Metadata = {
  title: "GLOBAL TOBACCO",
  description: "Global Tobacco & International Logistics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* 👇 2. 在这里渲染全局悬浮层，确保它覆盖在页面内容之上 */}
        <GlobalOverlay />
      </body>
    </html>
  );
}