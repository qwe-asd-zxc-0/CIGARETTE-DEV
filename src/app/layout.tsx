import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header"; // ✅ 确保引入正确的 Header 组件

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Global Tobacco",
  description: "Premium Vapes & E-Liquids",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* ✅ 这里只放 Header，绝对不要放 ProductPage */}
        <Header />
        
        {/* 页面内容会自动填充到这里 */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}