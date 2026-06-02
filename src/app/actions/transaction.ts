"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { hapusTransaksi, ubahTransaksi } from "@/lib/store";

export async function deleteTransactionAction(id: string) {
  try {
    const userId = await requireUserId();
    const success = await hapusTransaksi(userId, id);
    if (success) {
      revalidatePath("/dashboard");
    }
    return { success };
  } catch (err) {
    console.error("[deleteTransactionAction] gagal:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus transaksi" };
  }
}

export async function editTransactionAction(
  id: string,
  data: {
    tipe: "PEMASUKAN" | "PENGELUARAN";
    item: string;
    qty: number;
    hargaSatuan: number;
    total: number;
    kategori?: string | null;
  },
) {
  try {
    const userId = await requireUserId();
    const updated = await ubahTransaksi(userId, id, data);
    if (updated) {
      revalidatePath("/dashboard");
      return { success: true, transaksi: updated };
    }
    return { success: false, error: "Transaksi tidak ditemukan atau bukan milik Anda" };
  } catch (err) {
    console.error("[editTransactionAction] gagal:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengedit transaksi" };
  }
}
