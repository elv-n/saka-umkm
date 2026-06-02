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
  warna: "emerald" | "red" | "amber";
  metric?: "nilai" | "qty";
}) {
  const kelasBar =
    warna === "emerald"
      ? "bg-emerald-500"
      : warna === "amber"
        ? "bg-amber-500"
        : "bg-red-400";

  const maks = Math.max(
    1,
    ...data.map((d) => (metric === "qty" ? d.totalQty : d.totalNilai)),
  );

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold">{judul}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada data.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.map((d) => {
            const val = metric === "qty" ? d.totalQty : d.totalNilai;
            return (
              <li key={d.nama}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="truncate pr-2">{d.nama}</span>
                  <span className="font-semibold tabular-nums">
                    {metric === "qty" ? `${d.totalQty} unit` : formatRupiah(d.totalNilai)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
