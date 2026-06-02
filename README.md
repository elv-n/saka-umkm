# UMKM Pintar — Asisten Keuangan AI

Asisten keuangan berbasis Generative AI untuk pelaku UMKM Indonesia. Pemilik usaha cukup mengetik (nanti: berbicara) transaksi dengan bahasa sehari-hari, lalu AI mencatatnya otomatis dan menyajikan laporan.

Dibangun untuk **IDCamp Developer Challenge** — kategori asisten keuangan cerdas.

## Status fitur

- [x] **Tahap 1** — Fondasi: Next.js + Prisma + SQLite, UI chat ala WhatsApp.
- [x] **Tahap 2** — Parsing teks → transaksi terstruktur via Gemini, simpan ke DB.
- [x] **Autentikasi & multi-user** — Daftar/masuk/keluar, sesi JWT (cookie httpOnly),
      data terisolasi per pengguna. API menolak akses tanpa login (401).
- [x] **Laporan per periode** — Filter transaksi: hari ini, bulan ini, tahun ini, semua.
- [x] **Tahap 3** — Input suara: rekam voice note, Gemini transkrip + ekstrak transaksi
      dalam satu panggilan (tanpa komponen STT terpisah).
- [x] **Tahap 4** — Narasi insight AI (on-demand via tombol agar hemat kuota):
      statistik dihitung deterministik di kode, AI menarasikannya jadi saran bisnis.
- [x] **Tahap 5** — Dashboard analitik: grafik tren pemasukan vs pengeluaran (harian/bulanan),
      donut untung/rugi, bar produk terlaris & pengeluaran terbesar. SVG murni, tanpa dependensi grafik.
- [ ] **Tahap 6** — Poles demo.

## Teknologi

- **Next.js 16** (App Router, Server Actions) + TypeScript
- **Prisma 7** + SQLite (driver adapter `better-sqlite3`)
- **Autentikasi**: `jose` (JWT sesi) + `bcryptjs` (hash kata sandi)
- **Google Gemini** (`@google/genai`) untuk parsing bahasa natural → JSON terstruktur
- **Tailwind CSS 4**

## Menjalankan

1. Pasang dependensi:
   ```bash
   npm install
   ```
2. Siapkan environment. Salin `.env.example` ke `.env`, lalu isi:
   - `GEMINI_API_KEY` (gratis di https://aistudio.google.com/apikey).
   - `SESSION_SECRET` (string acak; buat dengan `openssl rand -base64 32`).

   Tanpa `GEMINI_API_KEY`, fitur AI mengembalikan pesan konfigurasi dengan rapi;
   sisanya tetap jalan.
3. Siapkan database:
   ```bash
   npx prisma migrate dev
   ```
4. Jalankan dev server:
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000

## Struktur penting

```
src/
  app/
    page.tsx                 # Halaman chat utama (butuh login)
    login/page.tsx           # Halaman masuk
    signup/page.tsx          # Halaman daftar
    dashboard/page.tsx       # Laporan keuangan + filter periode
    _components/
      Chat.tsx               # UI chat + rekam suara (client component)
      AuthForm.tsx           # Form login/daftar (client component)
      InsightCard.tsx        # Kartu narasi insight AI (client component)
      TrenChart.tsx          # Grafik batang tren pemasukan/pengeluaran (SVG)
      ItemBarChart.tsx       # Bar horizontal item terlaris / pengeluaran
      useRecorder.ts         # Hook perekam suara (MediaRecorder)
    actions/auth.ts          # Server Actions: signup/login/logout
    api/
      ingest/route.ts        # POST: teks/suara -> AI parse -> simpan (butuh sesi)
      transactions/route.ts  # GET: daftar transaksi + ?periode= (butuh sesi)
      insight/route.ts       # GET: statistik + narasi insight AI (butuh sesi)
  lib/
    gemini.ts                # Gemini: parseTeks, parseAudio, buatNarasiInsight
    prisma.ts                # Singleton Prisma client + adapter SQLite
    store.ts                 # Akses data per-user (simpan/ambil + filter tanggal)
    stats.ts                 # Agregasi: statistik + seri waktu untuk grafik
    auth.ts                  # Registrasi, verifikasi kredensial, guard sesi
    session.ts               # JWT sesi (jose) + cookie httpOnly
    periode.ts               # Hitung rentang tanggal (hari/bulan/tahun)
    audio.ts                 # Helper rekam & konversi audio ke base64 (klien)
    validation.ts            # Skema validasi form auth (zod)
    types.ts                 # Tipe domain bersama
    format.ts                # Format Rupiah & tanggal
prisma/
  schema.prisma             # Model User (dgn auth) & Transaction
```

## Keamanan

- Kata sandi di-hash dengan bcrypt, tidak pernah disimpan polos.
- Sesi memakai JWT bertanda tangan di cookie `httpOnly` (anti-XSS), `secure` saat produksi.
- Endpoint API memvalidasi sesi dan hanya mengembalikan/menyimpan data milik
  pengguna yang sedang login. Akses tanpa sesi ditolak (HTTP 401).
- `SESSION_SECRET` wajib diisi string acak yang kuat di produksi.
