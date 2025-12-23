import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { User, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const t = await getTranslations('Profile');
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 获取用户资料
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Link 
          href="/profile" 
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t('backToProfile')}</span>
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">{t('accountSettings')}</h1>

        <div className="space-y-6">
          {/* 个人信息卡片 */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('personalInfo')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('name')}</label>
                <div className="bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white">
                  {profile?.fullName || t('notSet')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('email')}</label>
                <div className="bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  {user.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">{t('userId')}</label>
                <div className="bg-zinc-950 border border-white/10 rounded-lg px-4 py-3 text-zinc-500 font-mono text-sm">
                  {user.id}
                </div>
              </div>
            </div>
          </div>

          {/* 账户状态 */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {t('accountStatus')}
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-white/5">
                <div>
                  <p className="text-white font-medium">{t('ageVerification')}</p>
                  <p className="text-sm text-zinc-500 mt-1">{t('ageConfirm')}</p>
                </div>
                {profile?.isAgeVerified ? (
                  <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-bold border border-green-500/20">
                    {t('verified')}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-zinc-800 text-zinc-500 rounded-full text-xs font-bold">
                    {t('unverified')}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-white/5">
                <div>
                  <p className="text-white font-medium">{t('registrationDate')}</p>
                  <p className="text-sm text-zinc-500 mt-1">{t('accountCreationDate')}</p>
                </div>
                <span className="text-zinc-400 text-sm font-mono">
                  {new Date(user.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              💡 如需修改个人信息，请联系客服。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

