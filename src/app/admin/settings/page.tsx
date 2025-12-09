import { prisma } from "@/lib/prisma";
import { Settings as SettingsIcon, Shield, FileText } from "lucide-react";
import AdminManager from "@/components/admin/settings/AdminManager";
import AuditLogs from "@/components/admin/settings/AuditLogs";
import { getAgeVerificationLogs, getReviewAuditLogs } from "./actions";

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "admins";

  // 并行获取数据
  const [admins, ageLogs, reviewLogs] = await Promise.all([
    // 获取所有管理员
    prisma.profile.findMany({
      where: { isAdmin: true },
      orderBy: { createdAt: 'desc' }
    }),
    getAgeVerificationLogs(),
    getReviewAuditLogs()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-zinc-400" />
          System Configuration
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Manage system access and view audit logs.</p>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-white/10">
        <div className="flex gap-8">
          <a
            href="?tab=admins"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "admins"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Permissions
          </a>
          <a
            href="?tab=audit"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors ${
              activeTab === "audit"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            Compliance Audit
          </a>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="min-h-[400px]">
        {activeTab === "admins" ? (
          <AdminManager admins={admins} />
        ) : (
          <AuditLogs ageLogs={ageLogs} reviewLogs={reviewLogs} />
        )}
      </div>
    </div>
  );
}