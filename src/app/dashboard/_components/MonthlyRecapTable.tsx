"use client";

import { formatRupiah } from "@/lib/format";
import type { TransaksiDTO } from "@/lib/types";

export default function MonthlyRecapTable({ transaksi }: { transaksi: TransaksiDTO[] }) {
  // Group transactions by Year-Month
  const groups: Record<
    string,
    {
      label: string;
      pemasukan: number;
      pengeluaran: number;
      count: number;
      sortKey: number;
    }
  > = {};

  const NAMA_BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  for (const t of transaksi) {
    const d = new Date(t.tanggal);
    if (isNaN(d.getTime())) continue;

    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (!groups[key]) {
      groups[key] = {
        label: `${NAMA_BULAN[month]} ${year}`,
        pemasukan: 0,
        pengeluaran: 0,
        count: 0,
        sortKey: year * 12 + month,
      };
    }

    groups[key].count += 1;
    if (t.tipe === "PEMASUKAN") {
      groups[key].pemasukan += t.total;
    } else {
      groups[key].pengeluaran += t.total;
    }
  }

  // Sort groups descending by date (newest month first)
  const sortedRecap = Object.values(groups).sort((a, b) => b.sortKey - a.sortKey);

  if (sortedRecap.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
        Belum ada data transaksi untuk direkap.
      </p>
    );
  }

  // Totals for the footer
  const totalPemasukan = sortedRecap.reduce((s, r) => s + r.pemasukan, 0);
  const totalPengeluaran = sortedRecap.reduce((s, r) => s + r.pengeluaran, 0);
  const totalLaba = totalPemasukan - totalPengeluaran;
  const totalCount = sortedRecap.reduce((s, r) => s + r.count, 0);

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <th className="px-4 py-3">Periode</th>
            <th className="px-4 py-3 text-right">Pemasukan</th>
            <th className="px-4 py-3 text-right">Pengeluaran</th>
            <th className="px-4 py-3 text-right">Laba / Rugi</th>
            <th className="px-4 py-3 text-center">Transaksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {sortedRecap.map((row) => {
            const laba = row.pemasukan - row.pengeluaran;
            return (
              <tr key={row.label} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">{row.label}</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                  {formatRupiah(row.pemasukan)}
                </td>
                <td className="px-4 py-3 text-right text-red-600 font-medium">
                  {formatRupiah(row.pengeluaran)}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${laba >= 0 ? "text-zinc-950 dark:text-zinc-50" : "text-red-600"}`}>
                  {formatRupiah(laba)}
                </td>
                <td className="px-4 py-3 text-center text-zinc-500 dark:text-zinc-400">{row.count}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-200 text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100">
            <td className="px-4 py-3">Total Rekap</td>
            <td className="px-4 py-3 text-right text-emerald-600">{formatRupiah(totalPemasukan)}</td>
            <td className="px-4 py-3 text-right text-red-600">{formatRupiah(totalPengeluaran)}</td>
            <td className={`px-4 py-3 text-right ${totalLaba >= 0 ? "text-zinc-950 dark:text-zinc-50" : "text-red-600"}`}>
              {formatRupiah(totalLaba)}
            </td>
            <td className="px-4 py-3 text-center">{totalCount}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
