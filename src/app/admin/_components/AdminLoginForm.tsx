"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminLoginAction, type AdminLoginState } from "@/app/actions/admin";

export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(
    adminLoginAction,
    undefined,
  );

  return (
    <form action={formAction} className="w-full min-h-screen flex flex-col bg-white">
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
            <h1 className="text-2xl font-black tracking-tight text-white text-center">SAKA Admin</h1>
            <p className="text-sm text-emerald-100/95 font-medium mt-1 mb-6 text-center">Masuk ke panel administrasi</p>

            {/* Admin Login Fields Inside Gradient */}
            <div className="w-full space-y-4 text-left">
              <FieldOnGradient
                label="Username"
                name="username"
                type="text"
                placeholder="Username"
                defaultValue={state?.fields?.username}
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
            <p className="text-sm text-slate-400 font-semibold mb-4">Kembali ke halaman utama?</p>
            <Link 
              href="/" 
              className="w-full rounded-full border border-slate-200 hover:bg-slate-50 py-3.5 text-base font-extrabold text-emerald-600 text-center transition active:scale-[0.98] shadow-2xs select-none"
            >
              Beranda SAKA
            </Link>
          </div>
        </div>
      </div>
    </form>
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
