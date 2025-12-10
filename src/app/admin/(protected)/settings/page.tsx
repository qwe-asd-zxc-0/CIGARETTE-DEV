import { prisma } from "@/lib/prisma";
import { Settings as SettingsIcon, Shield, FileText, Megaphone } from "lucide-react";
import AdminManager from "@/components/admin/settings/AdminManager";
import AuditLogs from "@/components/admin/settings/AuditLogs";
import ActivityConfig from "@/components/admin/settings/ActivityConfig";
import { 
  getAgeVerificationLogs, 
  getReviewAuditLogs, 
  getSystemSetting, 
  getCampaignHistory 
} from "./actions"; // ✅ 引入所有需要的 actions

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Next.js 15+ 需要 await searchParams
  const { tab } = await searchParams;
  const activeTab = tab || "admins";

  // ✅ 并行获取所有所需数据
  // 包含：管理员列表、审计日志、当前活动配置、活动历史记录
  const [admins, ageLogs, reviewLogs, activityConfig, campaignHistory] = await Promise.all([
    // 1. 获取管理员
    prisma.profile.findMany({
      where: { isAdmin: true },
      orderBy: { createdAt: 'desc' }
    }),
    // 2. 获取年龄验证日志
    getAgeVerificationLogs(),
    // 3. 获取评论审核日志
    getReviewAuditLogs(),
    // 4. 获取当前活动配置 (key="promo_activity")
    getSystemSetting("promo_activity"),
    // 5. 获取活动历史归档
    getCampaignHistory() 
  ]);

  return (
    <div className="space-y-8">
      {/* 头部标题区域 */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <SettingsIcon className="w-6 h-6 text-zinc-400" />
          System Configuration
        </h2>
        <p className="text-zinc-400 text-sm mt-1">Manage system access, audit logs, and homepage content.</p>
      </div>

      {/* Tab 导航栏 */}
      <div className="border-b border-white/10">
        <div className="flex gap-8 overflow-x-auto">
          {/* Tab 1: 管理员权限 */}
          <a
            href="?tab=admins"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "admins"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Permissions
          </a>

          {/* Tab 2: 合规审计 */}
          <a
            href="?tab=audit"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "audit"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileText className="w-4 h-4" />
            Compliance Audit
          </a>

          {/* Tab 3: 活动配置 (新增) */}
          <a
            href="?tab=activity"
            className={`pb-4 flex items-center gap-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "activity"
                ? "border-red-600 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Activity & Promo
          </a>
        </div>
      </div>

      {/* 内容显示区域 */}
      <div className="min-h-[400px]">
        {activeTab === "admins" && (
          <AdminManager admins={admins} />
        )}
        
        {activeTab === "audit" && (
          <AuditLogs ageLogs={ageLogs} reviewLogs={reviewLogs} />
        )}
        
        {activeTab === "activity" && (
          // ✅ 传递配置数据和历史记录给组件
          <ActivityConfig 
            initialData={activityConfig} 
            historyData={campaignHistory} 
          />
        )}
      </div>
    </div>
  );
}