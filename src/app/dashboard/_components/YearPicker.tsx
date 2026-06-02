"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";

export default function YearPicker({
  defaultYear,
  years,
}: {
  defaultYear: string;
  years: number[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periode", "tahun");
    if (val) {
      params.set("tahun", val);
    } else {
      params.delete("tahun");
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-extrabold truncate">
            Laporan Tahunan
          </p>
          <p className="text-sm font-bold text-slate-800 truncate">
            Tahun {defaultYear}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <label htmlFor="tahun-pilih" className="hidden sm:inline-block text-xs font-bold text-slate-500">
          Pilih tahun:
        </label>
        <select
          id="tahun-pilih"
          value={defaultYear}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 md:py-1.5 text-base md:text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
