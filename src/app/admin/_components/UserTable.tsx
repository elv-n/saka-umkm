"use client";

import { useState, useTransition } from "react";
import { approveUserAction, rejectUserAction } from "@/app/actions/admin";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

type User = {
  id: string;
  namaPemilik: string;
  namaUsaha: string;
  email: string;
  nomorHP: string | null;
  alamat: string | null;
  bidangUsaha: string | null;
  deskripsi: string | null;
  status: string;
  createdAt: string;
  jumlahTransaksi: number;
};

type Filter = "semua" | "PENDING" | "APPROVED" | "REJECTED";

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function UserTable({ users }: { users: User[] }) {
  const [filter, setFilter] = useState<Filter>("semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "semua" ? users : users.filter((u) => u.status === filter);

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.value === "semua"
              ? users.length
              : users.filter((u) => u.status === opt.value).length;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={[
                "rounded-lg px-3.5 py-2 text-sm font-bold transition flex items-center gap-1.5 select-none active:scale-95 shadow-xs border cursor-pointer",
                filter === opt.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/15"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50",
              ].join(" ")}
            >
              {opt.value === "PENDING" && <Clock className="h-3.5 w-3.5" />}
              {opt.value === "APPROVED" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {opt.value === "REJECTED" && <XCircle className="h-3.5 w-3.5" />}
              <span>{opt.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-extrabold ${
                filter === opt.value ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-500"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm font-medium text-slate-400 shadow-2xs">
          Tidak ada data UMKM untuk filter ini.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              isExpanded={expandedId === user.id}
              onToggle={() => setExpandedId(expandedId === user.id ? null : user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  isExpanded,
  onToggle,
}: {
  user: User;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const statusBadge = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-100 border border-amber-200/50",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-100 border border-emerald-200/50",
    REJECTED: "bg-rose-50 text-rose-700 ring-rose-100 border border-rose-200/50",
  }[user.status] ?? "bg-slate-50 text-slate-600 ring-slate-100 border border-slate-200/50";

  function handleApprove() {
    startTransition(() => approveUserAction(user.id));
  }

  function handleReject() {
    startTransition(() => rejectUserAction(user.id));
  }

  const tanggal = new Date(user.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition duration-200 hover:shadow-xs hover:border-blue-200">
      {/* Summary row */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 px-4.5 py-3.5 text-left transition hover:bg-slate-50/70 cursor-pointer"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100/85 text-sm font-extrabold text-slate-700">
          {user.namaPemilik.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900">{user.namaUsaha}</p>
          <p className="truncate text-xs text-slate-500">
            {user.namaPemilik} • <span className="text-slate-400 font-semibold">{user.email}</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ring-1 flex items-center gap-1.5 ${statusBadge}`}>
          {user.status === "PENDING" && <Clock className="h-3.5 w-3.5" />}
          {user.status === "APPROVED" && <CheckCircle2 className="h-3.5 w-3.5" />}
          {user.status === "REJECTED" && <XCircle className="h-3.5 w-3.5" />}
          <span>{user.status === "PENDING" ? "Pending" : user.status === "APPROVED" ? "Approved" : "Ditolak"}</span>
        </span>
        <span className="ml-1 text-slate-400 shrink-0">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-slate-200/60 bg-slate-50/50 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm">
            <Detail label="Nomor HP" value={user.nomorHP} />
            <Detail label="Bidang Usaha" value={user.bidangUsaha} />
            <Detail label="Alamat" value={user.alamat} span2 />
            {user.deskripsi && <Detail label="Deskripsi" value={user.deskripsi} span2 />}
            <Detail label="Terdaftar" value={tanggal} />
            <Detail label="Transaksi" value={`${user.jumlahTransaksi} catatan`} />
          </div>

          {/* Action buttons */}
          {user.status === "PENDING" && (
            <div className="flex gap-2.5 pt-3 border-t border-slate-200/40">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 active:scale-95 shadow-sm shadow-emerald-600/10 cursor-pointer"
              >
                {isPending ? "…" : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Setujui
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending}
                className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5 active:scale-95 shadow-sm shadow-rose-600/10 cursor-pointer"
              >
                {isPending ? "…" : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Tolak
                  </>
                )}
              </button>
            </div>
          )}

          {user.status !== "PENDING" && (
            <div className="flex gap-2.5 pt-3 border-t border-slate-200/40">
              {user.status !== "APPROVED" && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isPending}
                  className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100/70 hover:border-emerald-300 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {isPending ? "…" : "Ubah ke Approved"}
                </button>
              )}
              {user.status !== "REJECTED" && (
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isPending}
                  className="rounded-lg border border-rose-200 bg-rose-50/50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100/70 hover:border-rose-300 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {isPending ? "…" : "Ubah ke Rejected"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  span2,
}: {
  label: string;
  value: string | null;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2 space-y-0.5" : "space-y-0.5"}>
      <span className="text-slate-400 font-bold uppercase tracking-wider text-xs block">{label}</span>
      <span className="text-slate-800 font-semibold text-sm block">{value || "—"}</span>
    </div>
  );
}
