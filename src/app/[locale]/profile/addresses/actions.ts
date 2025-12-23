"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// === 辅助：获取当前用户 ===
async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// === 新增地址 ===
export async function addAddress(formData: FormData) {
  const user = await getUser();
  if (!user) return { success: false, message: "errorNotLoggedIn" };

  const rawData = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
    addressLine1: formData.get("addressLine1") as string,
    addressLine2: (formData.get("addressLine2") as string) || "",
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as string,
    isDefault: formData.get("isDefault") === "on",
  };

  // 简单校验
  if (!rawData.firstName || !rawData.lastName || !rawData.addressLine1 || !rawData.city) {
    return { success: false, message: "errorFillAllFields" };
  }

  try {
    // 检查地址数量限制 (例如最多 10 个)
    const count = await prisma.userAddress.count({ where: { userId: user.id } });
    if (count >= 10) {
      return { success: false, message: "errorAddressLimitReached" };
    }

    // 如果设为默认，先取消其他的默认
    if (rawData.isDefault || count === 0) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      });
    }

    await prisma.userAddress.create({
      data: {
        userId: user.id,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        phoneNumber: rawData.phone,
        addressLine1: rawData.addressLine1,
        addressLine2: rawData.addressLine2,
        city: rawData.city,
        state: rawData.state,
        zipCode: rawData.postalCode,
        country: rawData.country,
        isDefault: rawData.isDefault || count === 0 // 第一个地址强制默认
      }
    });

    revalidatePath("/profile/addresses");
    return { success: true, message: "errorAddressAdded" };
  } catch (error) {
    console.error("Add address error:", error);
    return { success: false, message: "errorAddressAddFailed" };
  }
}

// === 删除地址 ===
export async function deleteAddress(addressId: string) {
  const user = await getUser();
  if (!user) return;

  try {
    await prisma.userAddress.delete({
      where: { id: addressId, userId: user.id }
    });
    revalidatePath("/profile/addresses");
  } catch (error) {
    console.error("Delete address error:", error);
  }
}

// === 设为默认 ===
export async function setDefaultAddress(addressId: string) {
  const user = await getUser();
  if (!user) return;

  try {
    await prisma.$transaction([
      prisma.userAddress.updateMany({
        where: { userId: user.id },
        data: { isDefault: false }
      }),
      prisma.userAddress.update({
        where: { id: addressId, userId: user.id },
        data: { isDefault: true }
      })
    ]);
    revalidatePath("/profile/addresses");
  } catch (error) {
    console.error("Set default error:", error);
  }
}