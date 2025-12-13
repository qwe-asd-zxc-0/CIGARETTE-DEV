'use server'

import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getHeaderProfile() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { fullName: true, email: true }
    });
    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}
