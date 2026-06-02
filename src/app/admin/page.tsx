import { redirect } from "next/navigation";
import Link from "next/link";

import { requireAdmin, AdminAuthError } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { adminLogoutAction } from "@/app/actions/admin";
import UserTable from "@/app/admin/_components/UserTable";
import SystemSettings from "@/app/admin/_components/SystemSettings";
import AdminManagement from "@/app/admin/_components/AdminManagement";
import { LogOut, Users, Clock, CheckCircle2, XCircle, Sliders, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  let admin: { id: string; username: string };
  try {
    admin = await requireAdmin();
  } catch (err) {
    if (err instanceof AdminAuthError) redirect("/admin/login");
    throw err;
  }

  const { tab = "umkm" } = await searchParams;

  // Ambil semua user
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      namaPemilik: true,
      namaUsaha: true,
      email: true,
      nomorHP: true,
      alamat: true,
      bidangUsaha: true,
      deskripsi: true,
      status: true,
      createdAt: true,
      _count: { select: { transactions: true } },
    },
  });

  // Ambil semua admin
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      createdAt: true,
    },
  });

  // Ambil system config
  const configs = await prisma.systemConfig.findMany();
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.value;
  }

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    jumlahTransaksi: u._count.transactions,
  }));

  const serializedAdmins = admins.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="h-screen bg-slate-50 text-slate-900 font-sans flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white shrink-0 shadow-xs backdrop-blur-md bg-white/90 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 md:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 shadow-sm shadow-emerald-600/15">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900">SAKA Admin</h1>
              <p className="text-xs font-semibold text-slate-500">Halo, {admin.username}</p>
            </div>
          </div>
          <form action={adminLogoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 select-none active:scale-95 shadow-xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </form>
        </div>
      </header>

      {/* Scrollable Dashboard Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <main className="mx-auto max-w-[1600px] px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Statistik ringkas */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <StatCard label="Total UMKM" value={users.length} icon={Users} />
            <StatCard
              label="Pending"
              value={users.filter((u) => u.status === "PENDING").length}
              highlight="amber"
              icon={Clock}
            />
            <StatCard
              label="Approved"
              value={users.filter((u) => u.status === "APPROVED").length}
              highlight="emerald"
              icon={CheckCircle2}
            />
            <StatCard
              label="Rejected"
              value={users.filter((u) => u.status === "REJECTED").length}
              highlight="red"
              icon={XCircle}
            />
          </div>

          {/* Menus / Tabs Navigation */}
          <div className="flex border-b border-slate-200 gap-6 shrink-0 overflow-x-auto no-scrollbar scroll-smooth">
            <Link
              href="/admin?tab=umkm"
              className={`flex items-center gap-2 pb-3.5 border-b-2 text-xs font-extrabold transition select-none whitespace-nowrap cursor-pointer ${
                tab === "umkm"
                  ? "border-emerald-600 text-emerald-600 font-black"
                  : "border-transparent text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Manajemen UMKM</span>
            </Link>

            <Link
              href="/admin?tab=settings"
              className={`flex items-center gap-2 pb-3.5 border-b-2 text-xs font-extrabold transition select-none whitespace-nowrap cursor-pointer ${
                tab === "settings"
                  ? "border-emerald-600 text-emerald-600 font-black"
                  : "border-transparent text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Setting Sistem</span>
            </Link>

            <Link
              href="/admin?tab=admins"
              className={`flex items-center gap-2 pb-3.5 border-b-2 text-xs font-extrabold transition select-none whitespace-nowrap cursor-pointer ${
                tab === "admins"
                  ? "border-emerald-600 text-emerald-600 font-black"
                  : "border-transparent text-slate-500 hover:text-emerald-600"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Manajemen Akun Admin</span>
            </Link>
          </div>

          {/* Conditionally Rendered Content */}
          <div className="pt-2">
            {tab === "umkm" && (
              <section className="space-y-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Daftar UMKM Terdaftar</h2>
                <UserTable users={serializedUsers} />
              </section>
            )}

            {tab === "settings" && (
              <section className="space-y-4 max-w-2xl">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pengaturan Kunci Sistem</h2>
                <SystemSettings
                  currentApiKey={configMap["GEMINI_API_KEY"] ?? ""}
                  currentModel={configMap["GEMINI_MODEL"] ?? ""}
                />
              </section>
            )}

            {tab === "admins" && (
              <section className="space-y-4">
                <AdminManagement
                  admins={serializedAdmins}
                  currentAdminId={admin.id}
                />
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  icon: Icon,
}: {
  label: string;
  value: number;
  highlight?: "amber" | "emerald" | "red";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colorMap = {
    amber: {
      wrapper: "text-amber-800 bg-amber-50 border-amber-200/50 shadow-xs hover:border-amber-300/85",
      iconBg: "bg-amber-100 text-amber-700",
    },
    emerald: {
      wrapper: "text-emerald-800 bg-emerald-50 border-emerald-200/50 shadow-xs hover:border-emerald-300/85",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    red: {
      wrapper: "text-rose-800 bg-rose-50 border-rose-200/50 shadow-xs hover:border-rose-300",
      iconBg: "bg-rose-100 text-rose-700",
    },
  };

  const cardStyle = highlight
    ? colorMap[highlight].wrapper
    : "text-slate-900 bg-white border-slate-200/60 shadow-xs hover:border-blue-200 hover:text-blue-900";

  const iconBgStyle = highlight
    ? colorMap[highlight].iconBg
    : "bg-slate-50 text-slate-500 border border-slate-100/80";

  return (
    <div className={`rounded-xl border p-4.5 flex items-center justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm ${cardStyle}`}>
      <div className="space-y-0.5">
        <p className={`text-xs uppercase font-bold tracking-wider ${highlight ? "opacity-75" : "text-slate-400"}`}>{label}</p>
        <p className="text-xl md:text-2xl font-black tracking-tight">{value}</p>
      </div>
      <div className={`p-2 rounded-xl shrink-0 ${iconBgStyle}`}>
        <Icon className="h-4.5 w-4.5 md:h-5 md:w-5" />
      </div>
    </div>
  );
}
