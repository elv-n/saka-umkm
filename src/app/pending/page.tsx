import Link from "next/link";

export default function PendingPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-100 p-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-900">
          ⏳
        </div>
        <h1 className="text-lg font-semibold">Pendaftaran Berhasil!</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Akunmu sedang menunggu persetujuan admin. Kami akan menghubungi kamu
          melalui WhatsApp atau email saat akun sudah aktif.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="inline-block rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}
