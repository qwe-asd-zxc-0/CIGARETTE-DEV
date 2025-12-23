"use client";

import { usePathname } from "@/i18n/routing";
import AgeGate from "@/components/AgeGate";
import ContactWidget from "@/components/ContactWidget";

export default function GlobalOverlay() {
  const pathname = usePathname();

  // 判断当前路径是否以 /admin 开头
  const isAdminPage = pathname?.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/sign-up";

  // 如果是后台页面或登录/注册页，什么都不渲染 (返回 null)
  if (isAdminPage || isAuthPage) {
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