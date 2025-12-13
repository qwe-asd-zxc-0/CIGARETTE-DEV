"use client";

import { usePathname } from "next/navigation";
import AgeGate from "@/components/AgeGate";
import ContactWidget from "@/components/ContactWidget";

export default function GlobalOverlay() {
  const pathname = usePathname();

  // 判断当前路径是否以 /admin 开头
  const isAdminPage = pathname?.startsWith("/admin");

  // 如果是后台页面，什么都不渲染 (返回 null)
  // 你也可以在这里排除登录页，例如: || pathname === "/sign-in"
  if (isAdminPage) {
    return null;
  }

  // 如果是前台页面，正常渲染这些组件
  return (
    <>
      <AgeGate />
      <ContactWidget />
    </>
  );
}