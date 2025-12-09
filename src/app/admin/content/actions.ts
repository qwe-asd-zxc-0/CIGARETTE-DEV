"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ================= 评论管理 =================

// 切换评论审核状态
export async function toggleReviewStatus(reviewId: string, isApproved: boolean) {
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved },
    });
    revalidatePath("/admin/content");
    return { success: true, message: "Review status updated" };
  } catch (error) {
    return { success: false, message: "Failed to update review" };
  }
}

// 删除评论
export async function deleteReview(reviewId: string) {
  try {
    await prisma.review.delete({
      where: { id: reviewId },
    });
    revalidatePath("/admin/content");
    return { success: true, message: "Review deleted" };
  } catch (error) {
    return { success: false, message: "Failed to delete review" };
  }
}

// ================= FAQ 管理 =================

// 新增 FAQ
export async function createFaq(data: { question: string; answer: string; category: string }) {
  try {
    await prisma.faq.create({
      data: {
        ...data,
        displayOrder: 0, // 默认为 0，后续可加排序逻辑
      },
    });
    revalidatePath("/admin/content");
    return { success: true, message: "FAQ created successfully" };
  } catch (error) {
    return { success: false, message: "Failed to create FAQ" };
  }
}

// 更新 FAQ
export async function updateFaq(id: string, data: { question: string; answer: string; category: string }) {
  try {
    await prisma.faq.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/content");
    return { success: true, message: "FAQ updated successfully" };
  } catch (error) {
    return { success: false, message: "Failed to update FAQ" };
  }
}

// 删除 FAQ
export async function deleteFaq(id: string) {
  try {
    await prisma.faq.delete({
      where: { id },
    });
    revalidatePath("/admin/content");
    return { success: true, message: "FAQ deleted" };
  } catch (error) {
    return { success: false, message: "Failed to delete FAQ" };
  }
}