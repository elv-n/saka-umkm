"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";

export default function MonthPicker({ defaultMonth }: { defaultMonth: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periode", "bulan");
    if (val) {
      params.set("bulan", val);
    } else {
      params.delete("bulan");
    }
    router.push(`/dashboard?${params.toString()}`);
  }

  // Format month to a friendly Indonesian display format (e.g. "Juni 2026")
  const parts = defaultMonth.split("-");
  let friendlyLabel = "";
  if (parts.length === 2) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const d = new Date(year, month, 1);
    friendlyLabel = d.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
          <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-slate-400 font-extrabold truncate">
            Laporan Bulanan
          </p>
          <p className="text-sm sm:text-base font-bold text-slate-800 truncate">
            {friendlyLabel || defaultMonth}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <label htmlFor="bulan-pilih" className="hidden sm:inline-block text-xs font-bold text-slate-500">
          Pilih bulan:
        </label>
        <input
          id="bulan-pilih"
          type="month"
          value={defaultMonth}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm sm:text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 cursor-pointer"
        />
      </div>
    </div>
  );
}
