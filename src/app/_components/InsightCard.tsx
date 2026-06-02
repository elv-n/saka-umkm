"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import type { Periode } from "@/lib/periode";

type Status = "kosong" | "loading" | "ok" | "error" | "config";

export default function InsightCard({ periode, tanggal }: { periode: Periode; tanggal?: string }) {
  const [status, setStatus] = useState<Status>("kosong");
  const [narasi, setNarasi] = useState("");
  const [pesanError, setPesanError] = useState("");
  const [terbuka, setTerbuka] = useState(true);
  // Periode & tanggal yang narasinya sudah dimuat — untuk menandai bila perlu refresh.
  const [periodeDimuat, setPeriodeDimuat] = useState<Periode | null>(null);
  const [tanggalDimuat, setTanggalDimuat] = useState<string | null>(null);

  async function buatInsight() {
    setStatus("loading");
    setTerbuka(true);
    try {
      const query = new URLSearchParams({ periode });
      if (tanggal) query.append("tanggal", tanggal);
      const res = await fetch(`/api/insight?${query.toString()}`);
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (res.status === 503) {
        setPesanError(data.error ?? "AI belum dikonfigurasi.");
        setStatus("config");
        return;
      }
      if (!res.ok) {
        setPesanError(data.error ?? "Gagal memuat insight.");
        setStatus("error");
        return;
      }
      setNarasi(data.narasi ?? "");
      setPeriodeDimuat(periode);
      setTanggalDimuat(tanggal || "");
      setStatus("ok");
    } catch {
      setPesanError("Gagal terhubung ke server.");
      setStatus("error");
    }
  }

  const sudahPunya = status === "ok" && narasi;
  const periodeBerubah =
    (periodeDimuat !== null && periodeDimuat !== periode) ||
    (tanggalDimuat !== null && tanggalDimuat !== (tanggal || ""));

  return (
    <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-sm shadow-emerald-600/5 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between px-4.5 py-3.5 border-b border-emerald-200/60 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              Insight AI SAKA
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sudahPunya && (
            <button
              type="button"
              onClick={() => setTerbuka((v) => !v)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer select-none">
              {terbuka ? "Sembunyikan" : "Tampilkan"}
            </button>
          )}
          <button
            type="button"
            onClick={buatInsight}
            disabled={status === "loading"}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer shadow-sm shadow-emerald-600/10 active:scale-95 select-none">
            {status === "loading" ? "Membuat…" : sudahPunya ? "Buat ulang" : "Buat insight"}
          </button>
        </div>
      </div>

      {/* Isi */}
      {status !== "kosong" && terbuka && (
        <div className="px-5 py-4 relative z-10">
          {status === "loading" && (
            <div className="space-y-2.5">
              <div className="h-3 w-full animate-pulse rounded bg-emerald-200/40" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-emerald-200/40" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-emerald-200/40" />
            </div>
          )}

          {status === "ok" && (
            <>
              <p className="text-sm leading-relaxed text-slate-700 font-semibold whitespace-pre-wrap">{narasi}</p>
              {periodeBerubah && (
                <p className="mt-3 text-xs font-bold text-emerald-700/90 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Periode berubah. Klik &quot;Buat ulang&quot; untuk insight periode ini.
                </p>
              )}
            </>
          )}

          {status === "config" && <p className="text-sm font-bold text-emerald-700">{pesanError}</p>}

          {status === "error" && <p className="text-sm font-bold text-rose-600">{pesanError}</p>}
        </div>
      )}

      {/* Petunjuk saat belum dibuat */}
      {status === "kosong" && (
        <p className="px-5 py-3.5 text-sm font-semibold text-slate-500 relative z-10">
          Tekan &quot;Buat insight&quot; untuk analisis & saran AI dari data periode ini.
        </p>
      )}
    </div>
  );
}
