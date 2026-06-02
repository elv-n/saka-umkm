import { formatRupiah } from "@/lib/format";
import type { ItemRingkas } from "@/lib/stats";

// Bar horizontal untuk item terlaris / pengeluaran teratas.
export default function ItemBarChart({
  judul,
  data,
  warna,
  metric = "nilai",
}: {
  judul: string;
  data: ItemRingkas[];
  warna: "emerald" | "red" | "amber" | "blue" | "yellow" | "rose";
  metric?: "nilai" | "qty";
}) {
  const kelasBar =
    warna === "emerald"
      ? "bg-emerald-500"
      : warna === "amber" || warna === "yellow"
        ? "bg-amber-500"
        : warna === "blue"
          ? "bg-blue-500"
          : warna === "rose"
            ? "bg-rose-500"
            : "bg-red-500";

  const maks = Math.max(
    1,
    ...data.map((d) => (metric === "qty" ? d.totalQty : d.totalNilai)),
  );

  return (
    <div className="w-full flex flex-col">
      <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">{judul}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada data.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((d) => {
            const val = metric === "qty" ? d.totalQty : d.totalNilai;
            return (
              <li key={d.nama}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate pr-2 text-slate-600 font-semibold">{d.nama}</span>
                  <span className="font-extrabold text-slate-800 tabular-nums">
                    {metric === "qty" ? `${d.totalQty} unit` : formatRupiah(d.totalNilai)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${kelasBar}`}
                    style={{ width: `${Math.max(4, (val / maks) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
