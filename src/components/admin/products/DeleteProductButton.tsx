"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/(protected)/products/actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个商品吗？此操作无法撤销。")) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productId);
      if (result.success) {
        // 成功后页面会自动刷新 (revalidatePath)
        // 可以加个 toast 提示
      } else {
        alert(result.message);
      }
    } catch (e) {
      alert("删除出错");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all disabled:opacity-50" 
      title="删除"
    >
      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
