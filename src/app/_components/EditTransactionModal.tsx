"use client";

import { useEffect, useState } from "react";
import type { TransaksiDTO } from "@/lib/types";
import { editTransactionAction } from "@/app/actions/transaction";
import { formatRupiah } from "@/lib/format";
import { TrendingUp, TrendingDown, X } from "lucide-react";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaksi: TransaksiDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTransactionModal({
  isOpen,
  transaksi,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const [tipe, setTipe] = useState<"PEMASUKAN" | "PENGELUARAN">("PEMASUKAN");
  const [item, setItem] = useState("");
  const [kategori, setKategori] = useState("");
  const [qty, setQty] = useState(1);
  const [hargaSatuan, setHargaSatuan] = useState(0);
  const [total, setTotal] = useState(0);
  
  const [isAutoTotal, setIsAutoTotal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync state with selected transaction
  useEffect(() => {
    if (transaksi) {
      setTipe(transaksi.tipe);
      setItem(transaksi.item);
      setKategori(transaksi.kategori || "");
      setQty(transaksi.qty);
      setHargaSatuan(transaksi.hargaSatuan);
      setTotal(transaksi.total);
      setIsAutoTotal(transaksi.total === transaksi.qty * transaksi.hargaSatuan);
      setError("");
    }
  }, [transaksi, isOpen]);

  // Handle auto-calculation of total
  useEffect(() => {
    if (isAutoTotal) {
      setTotal(qty * hargaSatuan);
    }
  }, [qty, hargaSatuan, isAutoTotal]);

  if (!isOpen || !transaksi) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaksi) return;

    if (!item.trim()) {
      setError("Nama barang/jasa tidak boleh kosong.");
      return;
    }
    if (qty <= 0) {
      setError("Jumlah (Qty) harus lebih dari 0.");
      return;
    }
    if (hargaSatuan < 0) {
      setError("Harga satuan tidak boleh negatif.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await editTransactionAction(transaksi.id, {
        tipe,
        item: item.trim(),
        qty,
        hargaSatuan,
        total,
        kategori: kategori.trim() || null,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Gagal memperbarui transaksi.");
      }
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 transition-opacity">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">Ubah Transaksi</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 text-xs font-bold transition flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 p-2.5 text-center text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Tipe Transaksi (Pemasukan / Pengeluaran) */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipe("PEMASUKAN")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                tipe === "PEMASUKAN"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setTipe("PENGELUARAN")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                tipe === "PENGELUARAN"
                  ? "bg-red-500 text-white shadow-xs"
                  : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/40"
              }`}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Pengeluaran
            </button>
          </div>

          {/* Nama Barang/Jasa */}
          <div>
            <label htmlFor="edit-item" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              Nama Barang / Jasa
            </label>
            <input
              id="edit-item"
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-base md:text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Mis. Nasi Goreng"
              disabled={loading}
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label htmlFor="edit-kategori" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
              Kategori
            </label>
            <input
              id="edit-kategori"
              type="text"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-base md:text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Mis. Makanan (Opsional)"
              disabled={loading}
            />
          </div>

          {/* Qty & Harga Satuan */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="edit-qty" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Jumlah (Qty)
              </label>
              <input
                id="edit-qty"
                type="number"
                min="0.01"
                step="any"
                value={qty || ""}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-base md:text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="edit-harga" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Harga Satuan (Rp)
              </label>
              <input
                id="edit-harga"
                type="number"
                min="0"
                step="any"
                value={hargaSatuan || ""}
                onChange={(e) => setHargaSatuan(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-base md:text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Total */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="edit-total" className="block text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Nominal (Rp)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoTotal}
                  onChange={(e) => setIsAutoTotal(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0 w-3 h-3"
                />
                Hitung otomatis
              </label>
            </div>
            <input
              id="edit-total"
              type="number"
              min="0"
              step="any"
              value={total || ""}
              onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-base md:text-xs outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 disabled:opacity-60"
              disabled={isAutoTotal || loading}
              required
            />
            {isAutoTotal && (
              <p className="mt-1 text-xs font-semibold text-zinc-500 text-right">
                {formatRupiah(total)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 py-2.5 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
