import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUserId, AuthError } from "@/lib/auth";
import { ambilTransaksi, ambilTahunTransaksi } from "@/lib/store";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { hitungStatistik, bangunSeriWaktu } from "@/lib/stats";
import InsightCard from "@/app/_components/InsightCard";
import TrenChart from "@/app/_components/TrenChart";
import ItemBarChart from "@/app/_components/ItemBarChart";
import PieChart from "@/app/_components/PieChart";
import { PERIODE_LABEL, isPeriode, rentangUntukPeriode, type Periode } from "@/lib/periode";
import DailyDatePicker from "./_components/DailyDatePicker";
import MonthPicker from "./_components/MonthPicker";
import YearPicker from "./_components/YearPicker";
import MonthlyRecapTable from "./_components/MonthlyRecapTable";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/app/actions/auth";
import TransactionList from "./_components/TransactionList";
import DownloadPDFButton from "./_components/DownloadPDFButton";
import { MessageSquare, LogOut, BarChart3, History, User } from "lucide-react";

export const dynamic = "force-dynamic";

const URUTAN_PERIODE: Periode[] = ["hari", "bulan", "tahun", "semua"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    periode?: string;
    tanggal?: string;
    bulan?: string;
    tahun?: string;
  }>;
}) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof AuthError) redirect("/login");
    throw err;
  }

  // Get user details to render consistent top navigation bar
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { namaPemilik: true, namaUsaha: true },
  });
  const namaPemilik = user?.namaPemilik || "Pengguna";
  const namaUsaha = user?.namaUsaha || "Usaha Saya";

  const { periode: periodeParam, tanggal: tanggalParam, bulan: bulanParam, tahun: tahunParam } = await searchParams;
  const periode: Periode = isPeriode(periodeParam) ? periodeParam : "bulan";

  let acuan = new Date();
  if (periode === "hari" && tanggalParam) {
    const parsedDate = new Date(tanggalParam);
    if (!isNaN(parsedDate.getTime())) {
      acuan = parsedDate;
    }
  } else if (periode === "bulan" && bulanParam) {
    const parts = bulanParam.split("-");
    if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        acuan = new Date(y, m, 1);
      }
    }
  } else if (periode === "tahun" && tahunParam) {
    const y = parseInt(tahunParam, 10);
    if (!isNaN(y)) {
      acuan = new Date(y, 0, 1);
    }
  }

  const yearString = String(acuan.getFullYear());
  const monthString = `${acuan.getFullYear()}-${String(acuan.getMonth() + 1).padStart(2, "0")}`;
  const dateString = `${acuan.getFullYear()}-${String(acuan.getMonth() + 1).padStart(2, "0")}-${String(acuan.getDate()).padStart(2, "0")}`;

  const rentang = rentangUntukPeriode(periode, acuan);

  // Fetch transactions and available transaction years in parallel
  const [transaksi, daftarTahun] = await Promise.all([
    ambilTransaksi(userId, { rentang, limit: 500 }),
    ambilTahunTransaksi(userId),
  ]);

  const statistik = hitungStatistik(transaksi);
  const pemasukan = statistik.totalPemasukan;
  const pengeluaran = statistik.totalPengeluaran;

  const granularitas = periode === "tahun" || periode === "semua" ? "bulanan" : "harian";
  const seri = bangunSeriWaktu(transaksi, granularitas);

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Header Navigation */}
      <header className="border-b border-slate-200/80 bg-white shrink-0 shadow-xs backdrop-blur-md bg-white/90 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0 select-none">
              <img
                src="/SAKA_avatar_compress.png"
                alt="SAKA Avatar"
                className="h-full w-full rounded-full border border-slate-200 object-cover bg-white shadow-xs"
              />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900">SAKA Laporan</h1>
              <p className="text-xs font-semibold text-slate-500">
                {namaUsaha} • Halo, {namaPemilik}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden md:flex rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 items-center gap-2 select-none active:scale-95 shadow-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </Link>
            <form action={logoutAction} className="hidden md:block">
              <button
                type="submit"
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 select-none active:scale-95 shadow-xs cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Scrollable Dashboard Space */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-5 space-y-4 w-full">
          {/* Floating Rounded Sticky Period Switcher Tabs */}
          <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md py-3 border-b border-slate-200/40 -mx-4 md:-mx-6 px-4 md:px-6 !mt-0 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200/80 shadow-2xs shrink-0">
              {URUTAN_PERIODE.map((p) => {
                const aktif = p === periode;
                return (
                  <Link
                    key={p}
                    href={`/dashboard?periode=${p}`}
                    className={[
                      "rounded-full px-3 sm:px-4.5 py-1 sm:py-1.5 text-xs sm:text-sm font-extrabold transition cursor-pointer select-none whitespace-nowrap",
                      aktif
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
                        : "text-slate-500 hover:text-emerald-600 hover:bg-slate-100/80",
                    ].join(" ")}>
                    {PERIODE_LABEL[p]}
                  </Link>
                );
              })}
            </div>
            <DownloadPDFButton
              periode={periode}
              dateString={dateString}
              monthString={monthString}
              yearString={yearString}
            />
          </div>

          {/* Date / Month / Year Picker Widgets */}
          {(periode === "hari" || periode === "bulan" || periode === "tahun") && (
            <div className="max-w-3xl !mt-3">
              {periode === "hari" && <DailyDatePicker defaultDate={dateString} />}
              {periode === "bulan" && <MonthPicker defaultMonth={monthString} />}
              {periode === "tahun" && <YearPicker defaultYear={yearString} years={daftarTahun} />}
            </div>
          )}

          {/* Stats Overview — Horizontal Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Kartu
              label="Total Pemasukan"
              nilai={pemasukan}
              warna="text-emerald-700 font-extrabold"
              highlight="emerald"
            />
            <Kartu
              label="Total Pengeluaran"
              nilai={pengeluaran}
              warna="text-rose-700 font-extrabold"
              highlight="rose"
            />
            <Kartu
              label="Laba / Rugi"
              nilai={pemasukan - pengeluaran}
              warna={pemasukan - pengeluaran >= 0 ? "text-emerald-700 font-extrabold" : "text-rose-800 font-extrabold"}
              highlight={pemasukan - pengeluaran >= 0 ? "blue" : "rose-light"}
            />
          </div>

          {/* AI Insight — full width */}
          <InsightCard
            periode={periode}
            tanggal={
              periode === "hari"
                ? dateString
                : periode === "bulan"
                  ? monthString
                  : periode === "tahun"
                    ? yearString
                    : undefined
            }
          />

          {/* Charts Row: Trend (2/3) + Pie (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col">
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Tren Keuangan ({granularitas === "bulanan" ? "Bulanan" : "Harian"})
              </h2>
              <div className="flex-1 min-h-[220px]">
                <TrenChart seri={seri} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col">
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">Proporsi Kas</h2>
              <div className="flex-1 flex items-center justify-center min-h-[220px]">
                <PieChart pemasukan={pemasukan} pengeluaran={pengeluaran} />
              </div>
            </div>
          </div>

          {/* Product Analysis Row (3 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <ItemBarChart
                judul="Produk terlaris (Kuantitas)"
                data={statistik.itemTerlaris}
                warna="emerald"
                metric="qty"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <ItemBarChart
                judul="Produk paling tidak laris"
                data={statistik.itemKurangLaris}
                warna="amber"
                metric="qty"
              />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <ItemBarChart
                judul="Pengeluaran terbesar"
                data={statistik.pengeluaranTeratas}
                warna="red"
                metric="nilai"
              />
            </div>
          </div>

          {/* Transaction Data Listing */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            {periode === "semua" ? (
              <>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Rekapitulasi Bulanan ({transaksi.length} Transaksi)
                </h2>
                <MonthlyRecapTable transaksi={transaksi} />
              </>
            ) : (
              <>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Transaksi •{" "}
                  {periode === "hari"
                    ? `Hari ini (${acuan.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`
                    : PERIODE_LABEL[periode]}{" "}
                  ({transaksi.length})
                </h2>
                <TransactionList transaksi={transaksi} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Tab Bar Navigation (mobile only) */}
      <nav className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 h-16 flex items-center justify-around px-2 select-none z-50">
        <Link
          href="/"
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div className="px-4.5 py-1 rounded-full bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50 transition-all duration-200">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs mt-0.5 font-bold text-slate-400 group-hover:text-emerald-600 transition-colors duration-200">
            Chat
          </span>
        </Link>

        <Link
          href="/?tab=riwayat"
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div className="px-4.5 py-1 rounded-full bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50 transition-all duration-200">
            <History className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs mt-0.5 font-bold text-slate-400 group-hover:text-emerald-600 transition-colors duration-200">
            Riwayat
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div className="px-4.5 py-1 rounded-full bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-500/5 transition-all duration-200">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs mt-0.5 font-black text-emerald-600 transition-colors duration-200">Laporan</span>
        </Link>

        <Link
          href="/?tab=profil"
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div className="px-4.5 py-1 rounded-full bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50 transition-all duration-200">
            <User className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs mt-0.5 font-bold text-slate-400 group-hover:text-emerald-600 transition-colors duration-200">
            Profil
          </span>
        </Link>
      </nav>
    </div>
  );
}

function Kartu({
  label,
  nilai,
  warna,
  highlight,
}: {
  label: string;
  nilai: number;
  warna: string;
  highlight: "emerald" | "rose" | "blue" | "rose-light";
}) {
  const colorMap = {
    emerald: "bg-emerald-50 border-emerald-200/60 shadow-xs shadow-emerald-500/5 text-emerald-800",
    rose: "bg-rose-50 border-rose-200/60 shadow-xs shadow-rose-500/5 text-rose-800",
    blue: "bg-emerald-50 border-emerald-200/60 shadow-xs shadow-emerald-500/5 text-emerald-800",
    "rose-light": "bg-rose-50/70 border-rose-200/70 shadow-xs text-rose-800",
  };

  return (
    <div
      className={`rounded-xl border px-3 py-3 sm:px-4 sm:py-4 flex flex-col transition-all duration-300 hover:shadow-xs ${colorMap[highlight]}`}>
      <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider opacity-70 truncate">{label}</p>
      <p className={`mt-0.5 text-xl sm:text-2xl md:text-3xl font-black tracking-tight ${warna} truncate`}>{formatRupiah(nilai)}</p>
    </div>
  );
}
