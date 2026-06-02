import { formatRupiah } from "@/lib/format";

// Donut chart SVG murni untuk proporsi pemasukan vs pengeluaran.
// Sisa (pemasukan - pengeluaran) ditampilkan sebagai laba/rugi di tengah.
export default function PieChart({
  pemasukan,
  pengeluaran,
}: {
  pemasukan: number;
  pengeluaran: number;
}) {
  const total = pemasukan + pengeluaran;
  const laba = pemasukan - pengeluaran;

  // Geometri donut.
  const ukuran = 140;
  const stroke = 24;
  const radius = (ukuran - stroke) / 2;
  const keliling = 2 * Math.PI * radius;
  const cx = ukuran / 2;
  const cy = ukuran / 2;

  const porsiMasuk = total > 0 ? pemasukan / total : 0;
  const panjangMasuk = porsiMasuk * keliling;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">Untung / Rugi</h3>

      {total === 0 ? (
        <p className="text-xs text-zinc-500">Belum ada data.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }}>
            <svg
              width={ukuran}
              height={ukuran}
              viewBox={`0 0 ${ukuran} ${ukuran}`}
              className="-rotate-90"
            >
              {/* Lapisan dasar = pengeluaran (merah) */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-red-400"
              />
              {/* Lapisan pemasukan (hijau) menutupi sebagian */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeDasharray={`${panjangMasuk} ${keliling - panjangMasuk}`}
                strokeLinecap="butt"
                className="text-emerald-500"
              />
            </svg>
            {/* Label tengah: laba/rugi */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                {laba >= 0 ? "Laba" : "Rugi"}
              </span>
              <span
                className={
                  laba >= 0
                    ? "text-sm font-bold text-emerald-600"
                    : "text-sm font-bold text-red-600"
                }
              >
                {formatRupiah(Math.abs(laba))}
              </span>
            </div>
          </div>

          {/* Legenda + angka */}
          <dl className="min-w-[160px] flex-1 space-y-2 text-sm">
            <Baris
              warna="bg-emerald-500"
              label="Pemasukan"
              nilai={pemasukan}
              persen={total > 0 ? (pemasukan / total) * 100 : 0}
            />
            <Baris
              warna="bg-red-400"
              label="Pengeluaran"
              nilai={pengeluaran}
              persen={total > 0 ? (pengeluaran / total) * 100 : 0}
            />
          </dl>
        </div>
      )}
    </div>
  );
}

function Baris({
  warna,
  label,
  nilai,
  persen,
}: {
  warna: string;
  label: string;
  nilai: number;
  persen: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <dt className="flex min-w-0 items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${warna}`} />
          <span className="truncate">{label}</span>
        </dt>
        <dd className="shrink-0 whitespace-nowrap font-semibold tabular-nums">
          {formatRupiah(nilai)}
        </dd>
      </div>
      <p className="pl-4 text-xs text-zinc-400">{persen.toFixed(0)}%</p>
    </div>
  );
}
