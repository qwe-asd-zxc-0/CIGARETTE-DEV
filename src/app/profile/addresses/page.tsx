import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import AddressManager from "@/components/AddressManager";

export default async function AddressesPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 查询地址数据 (服务端获取)
  const addresses = await prisma.userAddress.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: 'desc' }
  });

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 将数据传给客户端交互组件 */}
        <AddressManager addresses={addresses} />
      </div>
    </div>
  );
}