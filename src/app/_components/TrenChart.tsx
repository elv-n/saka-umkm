import { formatRupiah } from "@/lib/format";
import type { TitikSeri } from "@/lib/stats";

// Grafik batang berdampingan (pemasukan vs pengeluaran) berbasis SVG murni.
// Tanpa dependensi eksternal → ringan, bebas masalah hidrasi.
export default function TrenChart({ seri }: { seri: TitikSeri[] }) {
  if (seri.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
        Belum ada data untuk grafik.
      </p>
    );
  }

  const maks = Math.max(
    1,
    ...seri.map((s) => Math.max(s.pemasukan, s.pengeluaran)),
  );

  // Tampilkan maksimal 12 titik terakhir agar tetap rapi.
  const data = seri.slice(-12);
  const tinggiArea = 140;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Pemasukan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-400" /> Pengeluaran
        </span>
      </div>

      <div
        className="flex items-end gap-2 overflow-x-auto"
        style={{ height: tinggiArea }}
      >
        {data.map((titik, i) => {
          const tinggiMasuk = Math.round((titik.pemasukan / maks) * (tinggiArea - 24));
          const tinggiKeluar = Math.round((titik.pengeluaran / maks) * (tinggiArea - 24));
          return (
            <div
              key={`${titik.label}-${i}`}
              className="flex min-w-[28px] flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex items-end gap-0.5" style={{ height: tinggiArea - 20 }}>
                <div
                  className="w-2.5 rounded-t bg-emerald-500 transition-all"
                  style={{ height: Math.max(2, tinggiMasuk) }}
                  title={`Pemasukan: ${formatRupiah(titik.pemasukan)}`}
                />
                <div
                  className="w-2.5 rounded-t bg-red-400 transition-all"
                  style={{ height: Math.max(2, tinggiKeluar) }}
                  title={`Pengeluaran: ${formatRupiah(titik.pengeluaran)}`}
                />
              </div>
              <span className="whitespace-nowrap text-xs text-zinc-500">
                {titik.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
