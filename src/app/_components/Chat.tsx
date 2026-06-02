"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { blobKeBase64 } from "@/lib/audio";
import type { TransaksiDTO } from "@/lib/types";
import { useRecorder } from "./useRecorder";
import { deleteTransactionAction } from "@/app/actions/transaction";
import EditTransactionModal from "@/app/_components/EditTransactionModal";
import { logoutAction } from "@/app/actions/auth";
import { Send, Mic, History, X, MessageSquare, Pencil, Trash2, BarChart3, LogOut, User } from "lucide-react";

type Pesan = {
  id: string;
  dari: "user" | "bot";
  teks: string;
  transaksi?: TransaksiDTO[];
  error?: boolean;
  suara?: boolean;
};

const CONTOH = [
  "jual nasi goreng 2 porsi 15rb, es teh 2 gelas 5rb",
  "beli beras 10kg 130rb",
  "laku ayam geprek 3 @18rb",
];

let counter = 0;
function nextId() {
  counter += 1;
  return `m${counter}-${Date.now()}`;
}

function getLocalDateString(dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function getLocalDateKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function ProfileContent({
  user,
}: {
  user: {
    id: string;
    namaPemilik: string;
    namaUsaha: string;
    email: string;
    nomorHP: string | null;
    alamat: string | null;
    bidangUsaha: string | null;
    deskripsi: string | null;
  };
}) {
  return (
    <div className="space-y-5">
      {/* Premium SAKA Mascot & Business Info Header */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-slate-100">
        <div className="relative mb-3.5 select-none active:scale-95 hover:scale-105 transition-all duration-300">
          <div className="h-20 w-20 rounded-full bg-emerald-600 p-0.5 shadow-md shadow-emerald-500/15">
            <img
              src="/SAKA_avatar_compress.png"
              alt="SAKA Mascot"
              className="h-full w-full rounded-full object-cover bg-white"
            />
          </div>
          <span className="absolute bottom-0 right-1 block h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
        </div>
        <h3 className="font-black text-base text-slate-900 tracking-tight">{user.namaUsaha}</h3>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">{user.namaPemilik}</p>
        <span className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Didukung oleh AI SAKA
        </span>
      </div>

      {/* UMKM Info */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Informasi UMKM</h4>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 font-semibold">Nama Usaha</span>
            <span className="font-bold text-slate-800">{user.namaUsaha}</span>
          </div>
          {user.bidangUsaha && (
            <div className="flex justify-between items-center text-sm border-t border-slate-200/40 pt-2.5">
              <span className="text-slate-400 font-semibold">Bidang Usaha</span>
              <span className="font-bold text-slate-800">{user.bidangUsaha}</span>
            </div>
          )}
          {user.nomorHP && (
            <div className="flex justify-between items-center text-sm border-t border-slate-200/40 pt-2.5">
              <span className="text-slate-400 font-semibold">WhatsApp</span>
              <span className="font-bold text-slate-800">{user.nomorHP}</span>
            </div>
          )}
          {user.alamat && (
            <div className="flex justify-between items-start text-sm border-t border-slate-200/40 pt-2.5">
              <span className="text-slate-400 font-semibold shrink-0">Alamat</span>
              <span className="font-bold text-slate-800 text-right ml-4">{user.alamat}</span>
            </div>
          )}
          {user.deskripsi && (
            <div className="flex flex-col text-sm border-t border-slate-200/40 pt-2.5 gap-1">
              <span className="text-slate-400 font-semibold">Deskripsi</span>
              <span className="font-bold text-slate-800 leading-relaxed">{user.deskripsi}</span>
            </div>
          )}
        </div>
      </div>

      {/* Akun Info */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400">Akun Pengguna</h4>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400 font-semibold">Nama Pemilik</span>
            <span className="font-bold text-slate-800">{user.namaPemilik}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-slate-200/40 pt-2.5">
            <span className="text-slate-400 font-semibold">Email</span>
            <span className="font-bold text-slate-800">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="pt-3 border-t border-slate-100">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-700 py-3 text-sm font-bold text-rose-600 transition cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow-xs">
            <LogOut className="h-4 w-4" />
            Keluar dari Akun
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Chat({
  user,
  initialTab,
}: {
  user: {
    id: string;
    namaPemilik: string;
    namaUsaha: string;
    email: string;
    nomorHP: string | null;
    alamat: string | null;
    bidangUsaha: string | null;
    deskripsi: string | null;
  };
  initialTab?: string;
}) {
  const [pesan, setPesan] = useState<Pesan[]>([
    {
      id: "init",
      dari: "bot",
      teks: `Halo! Saya SAKA, asisten pencatatan kas usaha ${user.namaUsaha || "Anda"}. Ucapkan atau ketik transaksimu sekarang.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [historyItems, setHistoryItems] = useState<TransaksiDTO[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingTx, setEditingTx] = useState<TransaksiDTO | null>(null);
  const [isTodayExpanded, setIsTodayExpanded] = useState(false);

  const todayTransactions = useMemo(() => {
    const todayKey = getLocalDateKey();
    return historyItems.filter((item) => getLocalDateString(item.tanggal) === todayKey);
  }, [historyItems]);

  const todayStats = useMemo(() => {
    const count = todayTransactions.length;
    const net = todayTransactions.reduce((sum, item) => {
      if (item.tipe === "PEMASUKAN") {
        return sum + item.total;
      } else {
        return sum - item.total;
      }
    }, 0);
    return { count, net };
  }, [todayTransactions]);

  const updateUrlTab = (tab?: string) => {
    if (typeof window !== "undefined") {
      const url = tab ? `/?tab=${tab}` : "/";
      window.history.replaceState(null, "", url);
    }
  };

  useEffect(() => {
    if (initialTab === "riwayat") {
      setShowHistory(true);
      setShowProfile(false);
      fetchHistory();
    } else if (initialTab === "profil") {
      setShowProfile(true);
      setShowHistory(false);
    }
  }, [initialTab]);

  // Sync recent transaction list on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.transaksi || []);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function tanganiHapus(id: string) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }
    try {
      const res = await deleteTransactionAction(id);
      if (res.success) {
        fetchHistory();
      } else {
        alert(res.error || "Gagal menghapus transaksi.");
      }
    } catch (err) {
      alert("Koneksi gagal. Coba lagi.");
    }
  }

  async function bukaRiwayat() {
    window.dispatchEvent(new Event("loading-start"));
    setShowHistory(true);
    updateUrlTab("riwayat");
    await fetchHistory();
    window.dispatchEvent(new Event("loading-stop"));
  }

  const recorder = useRecorder();

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [pesan, loading, recorder.status]);

  function tampilkanBalasan(res: Response, data: { error?: string; ringkasan?: string; transaksi?: TransaksiDTO[] }) {
    if (!res.ok) {
      setPesan((p) => [
        ...p,
        {
          id: nextId(),
          dari: "bot",
          teks: data.error ?? "Maaf, terjadi kesalahan.",
          error: true,
        },
      ]);
      return;
    }
    setPesan((p) => [
      ...p,
      {
        id: nextId(),
        dari: "bot",
        teks: data.ringkasan ?? "Selesai.",
        transaksi: data.transaksi,
      },
    ]);

    // Sync transaction history sidebar when a new transaction is recorded
    if (data.transaksi && data.transaksi.length > 0) {
      fetchHistory();
    }
  }

  async function kirimKeServer(body: object) {
    setLoading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      const data = await res.json();
      tampilkanBalasan(res, data);
    } catch {
      setPesan((p) => [
        ...p,
        {
          id: nextId(),
          dari: "bot",
          teks: "Gagal terhubung ke server. Cek koneksi lalu coba lagi.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function kirimTeks(teks: string) {
    const isi = teks.trim();
    if (!isi || loading) return;
    setPesan((p) => [...p, { id: nextId(), dari: "user", teks: isi }]);
    setInput("");
    await kirimKeServer({ teks: isi });
  }

  async function mulaiRekam() {
    if (loading) return;
    await recorder.mulai();
  }

  async function selesaiRekam() {
    const hasil = await recorder.selesai();
    if (!hasil) return;

    if (hasil.durasiMs < 700) {
      setPesan((p) => [
        ...p,
        {
          id: nextId(),
          dari: "bot",
          teks: "Rekaman terlalu pendek. Tahan tombol lalu ucapkan transaksimu.",
          error: true,
        },
      ]);
      return;
    }

    setPesan((p) => [...p, { id: nextId(), dari: "user", teks: "🎤 Pesan suara", suara: true }]);

    try {
      const base64 = await blobKeBase64(hasil.blob);
      await kirimKeServer({ audio: base64, mimeType: hasil.mimeType });
    } catch {
      setPesan((p) => [
        ...p,
        {
          id: nextId(),
          dari: "bot",
          teks: "Gagal memproses rekaman. Coba lagi.",
          error: true,
        },
      ]);
    }
  }

  const sedangRekam = recorder.status === "recording";

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-slate-50 font-sans relative">
      {/* 1. Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-80 shrink-0 border-r border-slate-200/80 bg-white">
        {/* User Business Header */}
        <div className="flex flex-col bg-emerald-800 px-5 py-6 text-white shrink-0 shadow-sm relative">
          <span className="font-extrabold text-base tracking-tight text-white truncate leading-tight">
            {user.namaUsaha}
          </span>
          <span className="text-xs text-blue-200/80 font-medium truncate mt-1">Halo, {user.namaPemilik}</span>
        </div>

        {/* Live Transaction list */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/40">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Riwayat Hari Ini</h3>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-extrabold tracking-wide uppercase">
              Live
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col min-h-0 space-y-4">
            {/* Today's Summary Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center shrink-0 shadow-2xs">
              <div>
                <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Total Bersih Hari Ini</p>
                <p
                  className={`text-base font-black tracking-tight mt-0.5 ${todayStats.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {todayStats.net >= 0 ? "+" : ""}
                  {formatRupiah(todayStats.net)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Transaksi</p>
                <p className="text-sm font-extrabold text-slate-700 mt-0.5">{todayStats.count} Kali</p>
              </div>
            </div>

            {loadingHistory && historyItems.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : todayTransactions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 font-medium">
                Belum ada transaksi dicatat hari ini.
              </p>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <ul className="divide-y divide-slate-100 flex-1">
                  {todayTransactions.slice(0, isTodayExpanded ? undefined : 10).map((t) => (
                    <TransactionListItem key={t.id} t={t} onEdit={setEditingTx} onDelete={tanganiHapus} />
                  ))}
                </ul>
                {todayStats.count > 10 && (
                  <button
                    type="button"
                    onClick={() => setIsTodayExpanded(!isTodayExpanded)}
                    className="w-full text-center py-1.5 text-xs font-black text-emerald-600 bg-slate-50 hover:bg-emerald-50/50 hover:text-emerald-700 rounded transition cursor-pointer select-none mt-3">
                    {isTodayExpanded
                      ? "↑ Sembunyikan transaksi"
                      : `↓ Tampilkan ${todayStats.count - 10} transaksi lainnya`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex gap-2.5 shrink-0">
          <Link
            href="/dashboard"
            className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs cursor-pointer select-none">
            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
            Laporan
          </Link>
          <form action={logoutAction} className="flex-1 flex">
            <button
              type="submit"
              className="w-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 select-none">
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* 2. Main Chat Panel */}
      <section className="flex-1 flex flex-col min-h-0 bg-slate-50 relative min-w-0">
        {/* Chat top header */}
        <header className="flex items-center justify-between bg-white border-b border-slate-200/80 px-6 py-4 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 shrink-0 select-none">
              <img
                src="/SAKA_avatar_compress.png"
                alt="SAKA Avatar"
                className="h-full w-full rounded-full border border-slate-200 object-cover bg-white shadow-xs"
              />
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-slate-900 tracking-tight">SAKA</p>
              <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">Sahabat Kas UMKM • online</p>
            </div>
          </div>

          {/* Desktop Profil Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("loading-start"));
                setShowProfile(!showProfile);
                updateUrlTab(!showProfile ? "profil" : undefined);
                setTimeout(() => {
                  window.dispatchEvent(new Event("loading-stop"));
                }, 300);
              }}
              className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition flex items-center gap-2 select-none active:scale-95 shadow-2xs cursor-pointer ${
                showProfile
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}>
              <User className="h-3.5 w-3.5" />
              Profil Usaha
            </button>
          </div>
        </header>

        {/* Message bubble stream area */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-6 py-6">
          {pesan.map((m) => (
            <Gelembung key={m.id} pesan={m} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-400 font-semibold shadow-2xs">
                Memproses<span className="animate-pulse">…</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-5 py-2.5 shrink-0">
          {CONTOH.map((c) => (
            <button
              key={c}
              type="button"
              disabled={loading || sedangRekam}
              onClick={() => kirimTeks(c)}
              className="rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 cursor-pointer active:scale-95 select-none">
              {c}
            </button>
          ))}
        </div>

        {recorder.error && (
          <p className="bg-rose-50 border-t border-rose-100 px-5 py-2 text-center text-xs font-semibold text-rose-700 shrink-0">
            {recorder.error}
          </p>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            kirimTeks(input);
          }}
          className="flex items-center gap-3 bg-white px-5 py-4 border-t border-slate-100 shrink-0">
          {sedangRekam ? (
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-rose-50 border border-rose-100 px-4 py-2 text-sm font-bold text-rose-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" />
              Merekam… lepas untuk kirim
            </div>
          ) : (
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tulis transaksi (contoh: jual beras 2kg 30rb)..."
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all duration-200 disabled:opacity-60 text-slate-800 placeholder:text-slate-400"
            />
          )}

          {input.trim() && !sedangRekam ? (
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 active:scale-95 shadow-sm shadow-emerald-600/15 cursor-pointer"
              aria-label="Kirim">
              <Send className="h-4 w-4 text-white" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading || recorder.status === "unsupported"}
              onPointerDown={(e) => {
                e.preventDefault();
                mulaiRekam();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                if (sedangRekam) selesaiRekam();
              }}
              onPointerLeave={() => {
                if (sedangRekam) selesaiRekam();
              }}
              title={recorder.status === "unsupported" ? "Mikrofon tidak didukung browser ini" : "Tahan untuk merekam"}
              className={[
                "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-lg text-white transition disabled:opacity-50 active:scale-95 cursor-pointer",
                sedangRekam
                  ? "scale-105 bg-rose-600 shadow-sm shadow-rose-600/20"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/15",
              ].join(" ")}
              aria-label="Rekam suara">
              <Mic className="h-4 w-4 text-white" />
            </button>
          )}
        </form>
      </section>

      {/* 3. Mobile Drawer Bottom Sheet */}
      {showHistory && (
        <div className="absolute inset-x-0 top-0 bottom-16 z-40 flex flex-col justify-end bg-black/40 transition-opacity md:hidden">
          <div
            className="absolute inset-0"
            onClick={() => {
              setShowHistory(false);
              updateUrlTab();
            }}
          />

          <div className="relative z-10 flex max-h-[75%] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Riwayat Hari Ini</h3>
              <button
                type="button"
                onClick={() => {
                  setShowHistory(false);
                  updateUrlTab();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col min-h-0 space-y-4">
              {/* Today's Summary Card */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center shrink-0 shadow-2xs">
                <div>
                  <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400">
                    Total Bersih Hari Ini
                  </p>
                  <p
                    className={`text-base font-black tracking-tight mt-0.5 ${todayStats.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {todayStats.net >= 0 ? "+" : ""}
                    {formatRupiah(todayStats.net)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Transaksi</p>
                  <p className="text-sm font-extrabold text-slate-700 mt-0.5">{todayStats.count} Kali</p>
                </div>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : todayTransactions.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400 font-semibold">
                  Belum ada transaksi dicatat hari ini.
                </p>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <ul className="divide-y divide-slate-100 flex-1">
                    {todayTransactions.slice(0, isTodayExpanded ? undefined : 10).map((t) => (
                      <TransactionListItem
                        key={t.id}
                        t={t}
                        onEdit={(tx) => {
                          setShowHistory(false);
                          setEditingTx(tx);
                          updateUrlTab();
                        }}
                        onDelete={tanganiHapus}
                      />
                    ))}
                  </ul>
                  {todayStats.count > 10 && (
                    <button
                      type="button"
                      onClick={() => setIsTodayExpanded(!isTodayExpanded)}
                      className="w-full text-center py-2 text-xs font-black text-emerald-600 bg-slate-50 hover:bg-emerald-50/50 hover:text-emerald-700 rounded transition cursor-pointer select-none mt-3">
                      {isTodayExpanded
                        ? "↑ Sembunyikan transaksi"
                        : `↓ Tampilkan ${todayStats.count - 10} transaksi lainnya`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit transaction modal */}
      <EditTransactionModal
        isOpen={!!editingTx}
        transaksi={editingTx}
        onClose={() => setEditingTx(null)}
        onSuccess={fetchHistory}
      />

      {/* 4. Mobile Profile Drawer Bottom Sheet */}
      {showProfile && (
        <div className="absolute inset-x-0 top-0 bottom-16 z-40 flex flex-col justify-end bg-black/40 transition-opacity md:hidden">
          <div
            className="absolute inset-0"
            onClick={() => {
              setShowProfile(false);
              updateUrlTab();
            }}
          />

          <div className="relative z-10 flex max-h-[85%] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Profil Usaha & Akun</h3>
              <button
                type="button"
                onClick={() => {
                  setShowProfile(false);
                  updateUrlTab();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition flex items-center justify-center cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              <ProfileContent user={user} />
            </div>
          </div>
        </div>
      )}

      {/* 5. Desktop Profile Sidebar Panel */}
      {showProfile && (
        <aside className="hidden md:flex flex-col w-80 shrink-0 border-l border-slate-200/80 bg-white z-40">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-slate-50/40">
            <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">Profil Usaha & Akun</h3>
            <button
              type="button"
              onClick={() => {
                setShowProfile(false);
                updateUrlTab();
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition flex items-center justify-center cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-5 bg-white">
            <ProfileContent user={user} />
          </div>
        </aside>
      )}

      <nav className="md:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md shrink-0 h-16 flex items-center justify-around px-2 select-none z-50">
        <button
          onClick={() => {
            window.dispatchEvent(new Event("loading-start"));
            setShowHistory(false);
            setShowProfile(false);
            updateUrlTab();
            setTimeout(() => {
              window.dispatchEvent(new Event("loading-stop"));
            }, 300);
          }}
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div
            className={`px-4.5 py-1 rounded-full transition-all duration-200 ${
              !showHistory && !showProfile
                ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5"
                : "bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50"
            }`}>
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <span
            className={`text-xs mt-0.5 transition-colors duration-200 ${
              !showHistory && !showProfile
                ? "font-black text-emerald-700"
                : "font-bold text-slate-400 group-hover:text-emerald-600"
            }`}>
            Chat
          </span>
        </button>

        <button
          onClick={async () => {
            window.dispatchEvent(new Event("loading-start"));
            setShowHistory(true);
            setShowProfile(false);
            updateUrlTab("riwayat");
            await fetchHistory();
            window.dispatchEvent(new Event("loading-stop"));
          }}
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div
            className={`px-4.5 py-1 rounded-full transition-all duration-200 ${
              showHistory
                ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5"
                : "bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50"
            }`}>
            <History className="h-4.5 w-4.5" />
          </div>
          <span
            className={`text-xs mt-0.5 transition-colors duration-200 ${
              showHistory ? "font-black text-emerald-700" : "font-bold text-slate-400 group-hover:text-emerald-600"
            }`}>
            Riwayat
          </span>
        </button>

        <Link
          href="/dashboard"
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div className="px-4.5 py-1 rounded-full bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50 transition-all duration-200">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs mt-0.5 font-bold text-slate-400 group-hover:text-emerald-600 transition-colors duration-200">
            Laporan
          </span>
        </Link>

        <button
          onClick={() => {
            window.dispatchEvent(new Event("loading-start"));
            setShowProfile(true);
            setShowHistory(false);
            updateUrlTab("profil");
            setTimeout(() => {
              window.dispatchEvent(new Event("loading-stop"));
            }, 300);
          }}
          className="flex flex-col items-center justify-center flex-1 cursor-pointer select-none py-1 group">
          <div
            className={`px-4.5 py-1 rounded-full transition-all duration-200 ${
              showProfile
                ? "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/5"
                : "bg-transparent text-slate-400 group-hover:text-emerald-600 group-hover:bg-slate-50"
            }`}>
            <User className="h-4.5 w-4.5" />
          </div>
          <span
            className={`text-xs mt-0.5 transition-colors duration-200 ${
              showProfile ? "font-black text-emerald-700" : "font-bold text-slate-400 group-hover:text-emerald-600"
            }`}>
            Profil
          </span>
        </button>
      </nav>
    </div>
  );
}

function Gelembung({ pesan }: { pesan: Pesan }) {
  const dariUser = pesan.dari === "user";
  return (
    <div className={`flex items-start gap-2.5 ${dariUser ? "justify-end" : "justify-start"}`}>
      {!dariUser && (
        <div className="h-8 w-8 shrink-0 rounded-full border border-slate-200 bg-white overflow-hidden shadow-3xs select-none mt-0.5">
          <img src="/SAKA_avatar_compress.png" alt="SAKA" className="h-full w-full object-cover" />
        </div>
      )}
      <div
        className={[
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-2xs leading-relaxed",
          dariUser
            ? "rounded-tr-none bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-600/10"
            : pesan.error
              ? "rounded-tl-none bg-rose-50 text-rose-700 border border-rose-100 font-semibold"
              : "rounded-tl-none bg-white text-slate-800 border border-slate-200/80 font-medium",
        ].join(" ")}>
        <p className="whitespace-pre-wrap">{pesan.teks}</p>

        {pesan.transaksi && pesan.transaksi.length > 0 && (
          <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
            {pesan.transaksi.map((t) => (
              <div key={t.id} className="flex justify-between gap-4 text-xs">
                <span className="font-semibold text-slate-700">
                  {t.item}
                  {t.qty > 1 ? ` ×${t.qty}` : ""}
                </span>
                <span className="font-bold text-slate-900">{formatRupiah(t.total)}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-1.5 text-xs font-extrabold text-slate-900">
              <span>Total Dicatat</span>
              <span className="text-emerald-600 font-extrabold">
                {formatRupiah(pesan.transaksi.reduce((s, t) => s + t.total, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionListItem({
  t,
  onEdit,
  onDelete,
}: {
  t: TransaksiDTO;
  onEdit: (t: TransaksiDTO) => void;
  onDelete: (id: string) => void;
}) {
  const jam = new Date(t.tanggal).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="py-3 text-sm">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800 truncate">{t.item}</p>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            {jam} • {t.qty}x{t.kategori ? ` • ${t.kategori}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={t.tipe === "PEMASUKAN" ? "font-extrabold text-emerald-600" : "font-extrabold text-rose-600"}>
            {t.tipe === "PEMASUKAN" ? "+" : "-"}
            {formatRupiah(t.total)}
          </span>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => onEdit(t)}
              className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5"
              title="Ubah">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(t.id)}
              className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
              title="Hapus">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      {t.rawInput && (
        <p
          className="mt-1.5 bg-slate-50 p-2 rounded text-xs text-slate-500 border border-slate-100 truncate"
          title={t.rawInput}>
          Pesan: "{t.rawInput}"
        </p>
      )}
    </li>
  );
}
