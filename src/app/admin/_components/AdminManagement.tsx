"use client";

import { useState, useTransition } from "react";
import { addAdminAction, deleteAdminAction } from "@/app/actions/admin";
import { UserPlus, Trash2, Calendar, Shield, AlertCircle, CheckCircle } from "lucide-react";

type AdminInfo = {
  id: string;
  username: string;
  createdAt: string;
};

export default function AdminManagement({
  admins,
  currentAdminId,
}: {
  admins: AdminInfo[];
  currentAdminId: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!username.trim() || !password) {
      setMessage({ type: "error", text: "Username dan password wajib diisi." });
      return;
    }

    startTransition(async () => {
      const res = await addAdminAction(username.trim(), password);
      if (res.success) {
        setMessage({ type: "success", text: `Admin "${username}" berhasil ditambahkan.` });
        setUsername("");
        setPassword("");
      } else {
        setMessage({ type: "error", text: res.error || "Gagal menambahkan admin." });
      }
    });
  }

  function handleDeleteAdmin(id: string, name: string) {
    if (id === currentAdminId) {
      alert("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun admin "${name}"?`)) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const res = await deleteAdminAction(id);
      if (res.success) {
        setMessage({ type: "success", text: `Admin "${name}" berhasil dihapus.` });
      } else {
        setMessage({ type: "error", text: res.error || "Gagal menghapus admin." });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* 1. Form Tambah Admin */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Tambah Akun Admin Baru</h3>
        
        <form onSubmit={handleAddAdmin} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4.5 shadow-2xs hover:shadow-sm transition-all duration-300">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username admin..."
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password admin..."
              className="w-full rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-base md:text-sm font-extrabold text-white transition hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/10 disabled:opacity-50 shadow-sm cursor-pointer active:scale-95 select-none flex items-center justify-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              {isPending ? "Proses..." : "Tambah Admin"}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg flex items-start gap-2 text-xs font-semibold ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
            }`}>
              {message.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>

      {/* 2. Daftar Admin */}
      <div className="lg:col-span-2 space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Daftar Pengelola Sistem</h3>
        
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          {admins.length === 0 ? (
            <p className="p-10 text-center text-xs text-slate-400 font-bold">Tidak ada data admin.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {admins.map((admin) => {
                const self = admin.id === currentAdminId;
                const formatTanggal = new Date(admin.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div key={admin.id} className="flex items-center justify-between p-4.5 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                        self ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50" : "bg-slate-100 text-slate-700"
                      }`}>
                        <Shield className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-slate-900">{admin.username}</p>
                          {self && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase tracking-wide">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Terdaftar: {formatTanggal}</span>
                        </p>
                      </div>
                    </div>

                    {!self && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(admin.id, admin.username)}
                        disabled={isPending}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Hapus akun admin"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
