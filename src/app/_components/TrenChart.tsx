import { formatRupiah } from "@/lib/format";
import type { TitikSeri } from "@/lib/stats";

// Grafik batang berdampingan (pemasukan vs pengeluaran) berbasis SVG murni.
// Tanpa dependensi eksternal → ringan, bebas masalah hidrasi.
export default function TrenChart({ seri }: { seri: TitikSeri[] }) {
  if (seri.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
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
  const tinggiArea = 160;

  return (
    <div className="w-full flex flex-col h-full justify-between">
      <div className="mb-3 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Pemasukan
        </span>
        <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Pengeluaran
        </span>
      </div>

      <div
        className="flex items-end justify-between gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar"
        style={{ height: tinggiArea }}
      >
        {data.map((titik, i) => {
          const tinggiMasuk = Math.round((titik.pemasukan / maks) * (tinggiArea - 20));
          const tinggiKeluar = Math.round((titik.pengeluaran / maks) * (tinggiArea - 20));
          return (
            <div
              key={`${titik.label}-${i}`}
              className="flex min-w-[20px] sm:min-w-[36px] flex-1 flex-col items-center justify-end gap-1.5"
            >
              <div className="flex items-end gap-0.5 sm:gap-1" style={{ height: tinggiArea - 18 }}>
                <div
                  className="w-1.5 sm:w-3 rounded-t bg-blue-500 transition-all"
                  style={{ height: Math.max(2, tinggiMasuk) }}
                  title={`Pemasukan: ${formatRupiah(titik.pemasukan)}`}
                />
                <div
                  className="w-1.5 sm:w-3 rounded-t bg-amber-500 transition-all"
                  style={{ height: Math.max(2, tinggiKeluar) }}
                  title={`Pengeluaran: ${formatRupiah(titik.pengeluaran)}`}
                />
              </div>
              <span className="whitespace-nowrap text-[9px] sm:text-xs font-bold text-slate-400">
                {titik.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
