import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import PaymentClient from "./PaymentClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id: id, userId: user.id }
  });

  if (!order) notFound();

  if (order.status === 'paid') {
    redirect("/profile/orders");
  }

  return <PaymentClient order={order as any} />;
}
