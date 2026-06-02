"use client";

import { useState, useTransition } from "react";
import { updateConfigAction } from "@/app/actions/admin";

const MODEL_OPTIONS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
];

export default function SystemSettings({
  currentApiKey,
  currentModel,
}: {
  currentApiKey: string;
  currentModel: string;
}) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [model, setModel] = useState(currentModel);
  const [showKey, setShowKey] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const results = await Promise.all([
        apiKey.trim() ? updateConfigAction("GEMINI_API_KEY", apiKey.trim()) : { success: true },
        model.trim() ? updateConfigAction("GEMINI_MODEL", model.trim()) : { success: true },
      ]);
      const failed = results.find((r) => !r.success);
      if (failed) {
        const errorText = "error" in failed && typeof failed.error === "string" ? failed.error : "Gagal menyimpan.";
        setMessage({ type: "error", text: errorText });
      } else {
        setMessage({ type: "success", text: "Pengaturan berhasil disimpan." });
      }
    });
  }

  const maskedKey = apiKey
    ? apiKey.slice(0, 6) + "•".repeat(Math.max(0, apiKey.length - 10)) + apiKey.slice(-4)
    : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-2xs hover:shadow-sm transition-all duration-300">
      {/* API Key */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          API Key Gemini
        </label>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          Override API key dari .env. Kosongkan untuk menggunakan default dari .env.
        </p>
        <div className="flex gap-2 pt-1">
          <input
            type={showKey ? "text" : "password"}
            value={showKey ? apiKey : maskedKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (!showKey) setShowKey(true);
            }}
            onFocus={() => setShowKey(true)}
            placeholder="AIza..."
            className="flex-1 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 hover:bg-slate-50 cursor-pointer active:scale-95 select-none shadow-xs"
          >
            {showKey ? "Sembunyikan" : "Tampilkan"}
          </button>
        </div>
      </div>

      {/* Model */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Model Gemini
        </label>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          Override model dari .env. Kosongkan untuk menggunakan default.
        </p>
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-2.5-flash"
            list="model-options"
            className="flex-1 rounded-lg border border-slate-200 bg-white/80 px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
          />
          <datalist id="model-options">
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Save button + message */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-slate-200/50">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-emerald-600 px-5 py-3 text-base md:text-sm font-extrabold text-white transition hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/10 disabled:opacity-50 shadow-sm cursor-pointer active:scale-95 select-none"
        >
          {isPending ? "Menyimpan…" : "Simpan Pengaturan"}
        </button>
        {message && (
          <span
            className={`text-xs font-extrabold ${message.type === "success" ? "text-emerald-700" : "text-rose-600"}`}
          >
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
