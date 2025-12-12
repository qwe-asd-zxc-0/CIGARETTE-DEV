"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

export async function getUserAddresses() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  return await prisma.userAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  });
}

export async function addUserAddress(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("未登录");

  // 🔥 获取姓名
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  
  const addressLine1 = formData.get("addressLine1") as string;
  const addressLine2 = formData.get("addressLine2") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;
  const country = formData.get("country") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const isDefault = formData.get("isDefault") === "on";

  if (isDefault) {
    await prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false }
    });
  }

  await prisma.userAddress.create({
    data: {
      userId,
      firstName, // 保存
      lastName,  // 保存
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      phoneNumber,
      isDefault
    }
  });

  revalidatePath("/profile/addresses");
  revalidatePath("/checkout");
}

export async function updateUserAddress(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("未登录");

  const id = formData.get("id") as string;
  
  // 🔥 获取姓名
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  const addressLine1 = formData.get("addressLine1") as string;
  const addressLine2 = formData.get("addressLine2") as string;
  const city = formData.get("city") as string;
  const state = formData.get("state") as string;
  const zipCode = formData.get("zipCode") as string;
  const country = formData.get("country") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const isDefault = formData.get("isDefault") === "on";

  await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.userAddress.updateMany({
        where: { userId, id: { not: id } },
        data: { isDefault: false }
      });
    }

    await tx.userAddress.update({
      where: { id, userId },
      data: {
        firstName, // 更新
        lastName,  // 更新
        addressLine1,
        addressLine2,
        city,
        state,
        zipCode,
        country,
        phoneNumber,
        isDefault
      }
    });
  });

  revalidatePath("/profile/addresses");
  revalidatePath("/checkout");
}

export async function deleteUserAddress(addressId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;
  await prisma.userAddress.deleteMany({ where: { id: addressId, userId } });
  revalidatePath("/profile/addresses");
}

export async function setDefaultAddress(addressId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;
  await prisma.$transaction([
    prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.userAddress.update({ where: { id: addressId, userId }, data: { isDefault: true } })
  ]);
  revalidatePath("/profile/addresses");
  revalidatePath("/checkout");
}