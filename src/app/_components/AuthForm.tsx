"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthFormState } from "@/lib/validation";

type Mode = "login" | "signup";

type Action = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

export default function AuthForm({ mode, action }: { mode: Mode; action: Action }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, undefined);

  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="w-full min-h-screen flex flex-col bg-white">
      {isSignup ? (
        /* ── SIGNUP MODE ── */
        <div className="w-full min-h-screen flex flex-col">
          {/* Top Gradient Header */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white pt-10 pb-12 px-6 relative text-center flex flex-col items-center select-none">
            <div className="mb-3 h-14 w-14 rounded-full border-2 border-white/60 p-0.5 bg-white/20 shadow-md shadow-emerald-700/10">
              <img
                src="/SAKA_avatar_compress.png"
                alt="SAKA Avatar"
                className="h-full w-full rounded-full object-cover bg-white"
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Daftar SAKA</h1>
            <p className="text-sm text-emerald-100/90 font-medium mt-1">Sahabat Kas UMKM • Pencatatan Keuangan AI</p>
            
            {/* Wave SVG */}
            <svg className="absolute -bottom-px left-0 w-full h-8 text-white fill-current pointer-events-none" viewBox="0 0 1440 74" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 C240,40 480,80 720,40 C960,0 1200,40 1440,0 L1440,74 L0,74 Z" />
            </svg>
          </div>

          {/* Bottom White Fields Area */}
          <div className="flex-1 bg-white px-6 py-8 pb-14">
            <div className="w-full max-w-md mx-auto space-y-4">
              <Field
                label="Nama pemilik"
                name="namaPemilik"
                type="text"
                placeholder="mis. Bu Sri"
                defaultValue={state?.fields?.namaPemilik}
                required
              />
              <Field
                label="Nama usaha"
                name="namaUsaha"
                type="text"
                placeholder="mis. Warung Bu Sri"
                defaultValue={state?.fields?.namaUsaha}
                required
              />
              <Field
                label="Nomor HP / WhatsApp"
                name="nomorHP"
                type="tel"
                placeholder="mis. 08123456789"
                defaultValue={state?.fields?.nomorHP}
                required
              />
              <Field
                label="Alamat usaha"
                name="alamat"
                type="text"
                placeholder="mis. Jl. Pasar Baru No. 5, Jakarta"
                defaultValue={state?.fields?.alamat}
                required
              />
              <Field
                label="Bidang usaha"
                name="bidangUsaha"
                type="text"
                placeholder="mis. Kuliner, Retail, Jasa"
                defaultValue={state?.fields?.bidangUsaha}
                required
              />
              <label className="block space-y-1.5">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Deskripsi usaha (opsional)
                </span>
                <textarea
                  name="deskripsi"
                  placeholder="Ceritakan sedikit tentang usahamu…"
                  defaultValue={state?.fields?.deskripsi}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
              </label>
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="email@contoh.com"
                defaultValue={state?.fields?.email}
                required
              />
              <Field
                label="Kata sandi"
                name="password"
                type="password"
                placeholder="Minimal 6 karakter"
                required
              />

              {state?.error && (
                <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2.5 text-xs font-bold text-rose-600">
                  {state.error}
                </p>
              )}

              {state?.success && (
                <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-700">
                  {state.success}
                </p>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-full bg-emerald-600 py-3.5 text-base font-extrabold text-white transition hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-xs select-none mt-2">
                {pending ? "Memproses…" : "Daftar"}
              </button>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-sm text-slate-500 font-semibold">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline">
                    Masuk
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── LOGIN MODE ── */
        <div className="w-full min-h-screen flex flex-col justify-between">
          {/* Top Gradient Area with Avatar, Title, and Inputs */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 text-white flex-1 flex flex-col items-center justify-center pt-10 pb-16 px-6 relative select-none">
            <div className="w-full max-w-md mx-auto flex flex-col items-center relative z-10">
              <div className="mb-4 h-16 w-16 rounded-full border-2 border-white/60 p-0.5 bg-white/20 shadow-md shadow-emerald-700/10 active:scale-95 hover:scale-105 transition-all duration-300">
                <img
                  src="/SAKA_avatar_compress.png"
                  alt="SAKA Avatar"
                  className="h-full w-full rounded-full object-cover bg-white"
                />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white text-center">Masuk ke SAKA</h1>
              <p className="text-sm text-emerald-100/95 font-medium mt-1 mb-6 text-center">Sahabat Kas UMKM • Pencatatan Keuangan AI</p>

              {/* Login Fields Inside Gradient */}
              <div className="w-full space-y-4 text-left">
                <FieldOnGradient
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="email@contoh.com"
                  defaultValue={state?.fields?.email}
                  required
                />
                <FieldOnGradient
                  label="Kata sandi"
                  name="password"
                  type="password"
                  placeholder="Kata sandi"
                  required
                />

                {state?.error && (
                  <p className="rounded-full bg-rose-50 border border-rose-200 px-5 py-2.5 text-xs font-bold text-rose-700 text-center shadow-sm">
                    {state.error}
                  </p>
                )}

                {state?.success && (
                  <p className="rounded-full bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-xs font-bold text-emerald-700 text-center shadow-sm">
                    {state.success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-emerald-800 hover:bg-emerald-900 py-3.5 text-base font-extrabold text-white transition hover:shadow-lg active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-xs select-none mt-2">
                  {pending ? "Memproses…" : "Masuk"}
                </button>
              </div>
            </div>

            {/* Wave SVG */}
            <svg className="absolute -bottom-px left-0 w-full h-8 text-white fill-current pointer-events-none" viewBox="0 0 1440 74" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,0 C240,40 480,80 720,40 C960,0 1200,40 1440,0 L1440,74 L0,74 Z" />
            </svg>
          </div>

          {/* Bottom White Area */}
          <div className="bg-white py-8 px-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
              <p className="text-sm text-slate-400 font-semibold mb-4">Belum punya akun?</p>
              <Link 
                href="/signup" 
                className="w-full rounded-full border border-slate-200 hover:bg-slate-50 py-3.5 text-base font-extrabold text-emerald-600 text-center transition active:scale-[0.98] shadow-2xs select-none"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
      />
    </label>
  );
}

function FieldOnGradient({
  label,
  name,
  type,
  placeholder,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-bold uppercase tracking-wider text-emerald-100/90 pl-4">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-full border border-white/10 bg-white/10 px-5 py-3 text-base text-white placeholder:text-emerald-100/50 outline-none focus:bg-white focus:text-slate-800 focus:border-white focus:ring-4 focus:ring-white/10 transition-all duration-200"
      />
    </label>
  );
}
