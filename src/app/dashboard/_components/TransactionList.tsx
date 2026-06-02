"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TransaksiDTO } from "@/lib/types";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { deleteTransactionAction } from "@/app/actions/transaction";
import EditTransactionModal from "@/app/_components/EditTransactionModal";
import { Pencil, Trash2 } from "lucide-react";

interface TransactionListProps {
  transaksi: TransaksiDTO[];
}

export default function TransactionList({ transaksi }: TransactionListProps) {
  const router = useRouter();
  const [editingTx, setEditingTx] = useState<TransaksiDTO | null>(null);

  async function tanganiHapus(id: string) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }
    try {
      const res = await deleteTransactionAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Gagal menghapus transaksi.");
      }
    } catch {
      alert("Koneksi gagal. Coba lagi.");
    }
  }

  if (transaksi.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Belum ada transaksi pada periode ini.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
        {transaksi.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between px-3.5 py-2.5 hover:bg-zinc-50/55 dark:hover:bg-zinc-800/30 transition"
          >
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-sm font-semibold truncate text-zinc-800 dark:text-zinc-300">
                {t.item}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                {formatTanggal(t.tanggal)}
                {t.kategori ? ` • ${t.kategori}` : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={
                  t.tipe === "PEMASUKAN"
                    ? "text-sm font-bold text-emerald-600 dark:text-emerald-400"
                    : "text-sm font-bold text-red-500 dark:text-red-400"
                }
              >
                {t.tipe === "PEMASUKAN" ? "+" : "-"}
                {formatRupiah(t.total)}
              </span>
              <div className="flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setEditingTx(t)}
                  className="text-zinc-400 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 transition"
                  title="Ubah"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => tanganiHapus(t.id)}
                  className="text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition"
                  title="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <EditTransactionModal
        isOpen={!!editingTx}
        transaksi={editingTx}
        onClose={() => setEditingTx(null)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
