import "server-only";

import { GoogleGenAI, Type } from "@google/genai";
import {
  HasilParsing,
  ItemTransaksi,
  TIPE_PEMASUKAN,
  TIPE_PENGELUARAN,
  TipeTransaksi,
} from "@/lib/types";
import type { StatistikKeuangan } from "@/lib/stats";
import { formatRupiah } from "@/lib/format";

const PLACEHOLDER = "PLACEHOLDER_GEMINI_API_KEY";

/** Error khusus ketika API key Gemini belum dikonfigurasi. */
export class GeminiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiConfigError";
  }
}

/** Error khusus ketika kuota / rate limit Gemini terlampaui (HTTP 429). */
export class GeminiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

/** Ambil kode status HTTP dari error SDK Gemini, jika ada. */
function getStatusFromError(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: unknown }).status;
    if (typeof s === "number") return s;
  }
  // Beberapa error menyertakan kode di pesan, mis. "got status: 429".
  if (err instanceof Error) {
    const m = err.message.match(/\b(429|500|503)\b/);
    if (m) return Number(m[1]);
  }
  return undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Jalankan panggilan ke Gemini dengan retry-backoff untuk error sementara
 * (429 rate limit, 503 overloaded). Setelah percobaan habis, lempar error
 * yang sudah dipetakan agar route bisa membalas pesan yang ramah.
 */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = getStatusFromError(err);
      const bisaRetry = status === 429 || status === 503 || status === 500;
      if (!bisaRetry || attempt === maxAttempts) break;
      // Backoff: 0.8s, 1.6s, ...
      await sleep(800 * 2 ** (attempt - 1));
    }
  }

  const status = getStatusFromError(lastErr);
  if (status === 429) {
    throw new GeminiRateLimitError(
      "Kuota Gemini sedang penuh (rate limit). Tunggu sebentar lalu coba lagi, " +
        "atau cek kuota di Google AI Studio.",
    );
  }
  throw lastErr;
}

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key !== PLACEHOLDER && key.trim().length > 0);
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === PLACEHOLDER) {
    throw new GeminiConfigError(
      "GEMINI_API_KEY belum diisi. Tambahkan key dari https://aistudio.google.com/apikey ke file .env.",
    );
  }
  return new GoogleGenAI({ apiKey });
}

function getModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

// Skema output terstruktur yang diminta dari Gemini.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    tipe: {
      type: Type.STRING,
      enum: [TIPE_PEMASUKAN, TIPE_PENGELUARAN],
      description:
        "PEMASUKAN bila uang masuk (penjualan), PENGELUARAN bila uang keluar (belanja/biaya).",
    },
    kosong: {
      type: Type.BOOLEAN,
      description:
        "true jika tidak ada transaksi keuangan yang bisa dicatat dari input.",
    },
    ringkasan: {
      type: Type.STRING,
      description:
        "Ringkasan singkat 1 kalimat dalam Bahasa Indonesia untuk konfirmasi ke pengguna.",
    },
    items: {
      type: Type.ARRAY,
      description: "Daftar item dalam transaksi.",
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING, description: "Nama barang/jasa." },
          qty: { type: Type.NUMBER, description: "Jumlah unit, default 1." },
          hargaSatuan: {
            type: Type.NUMBER,
            description: "Harga per unit dalam Rupiah (angka penuh, mis. 15000).",
          },
          total: {
            type: Type.NUMBER,
            description: "qty x hargaSatuan dalam Rupiah.",
          },
          kategori: {
            type: Type.STRING,
            description:
              "Kategori singkat, mis. Makanan, Minuman, Bahan Baku, Operasional.",
          },
        },
        required: ["item", "qty", "hargaSatuan", "total"],
      },
    },
  },
  required: ["tipe", "kosong", "ringkasan", "items"],
};

const SYSTEM_INSTRUCTION = `Kamu adalah asisten pencatat keuangan untuk pelaku UMKM Indonesia.
Tugasmu mengubah kalimat sehari-hari (bisa tidak baku, pakai singkatan, atau bahasa daerah ringan) menjadi data transaksi terstruktur.

Aturan:
- Pahami angka informal Indonesia: "rb"/"ribu" = x1000, "jt"/"juta" = x1000000. Contoh "15rb" = 15000, "1,5jt" = 1500000.
- Jika harga satuan disebut dan ada jumlah, hitung total = qty x hargaSatuan.
- Jika hanya total yang disebut tanpa rincian, set qty=1 dan hargaSatuan=total.
- Tentukan tipe: penjualan/laku/dapat uang = PEMASUKAN; beli/bayar/belanja/biaya = PENGELUARAN.
- Jika kalimat tidak mengandung transaksi keuangan sama sekali, set kosong=true dan items=[].
- Selalu balas ringkasan dalam Bahasa Indonesia yang ramah dan singkat.`;

function normalisasiHasil(raw: unknown, rawInput: string): HasilParsing {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const tipe: TipeTransaksi =
    obj.tipe === TIPE_PENGELUARAN ? TIPE_PENGELUARAN : TIPE_PEMASUKAN;

  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  const items: ItemTransaksi[] = itemsRaw.map((it) => {
    const i = (it ?? {}) as Record<string, unknown>;
    const qty = Number(i.qty) || 1;
    const hargaSatuan = Number(i.hargaSatuan) || 0;
    const total = Number(i.total) || qty * hargaSatuan;
    return {
      item: String(i.item ?? "Item").trim() || "Item",
      qty,
      hargaSatuan,
      total,
      kategori: i.kategori ? String(i.kategori) : null,
    };
  });

  const kosong = Boolean(obj.kosong) || items.length === 0;
  const ringkasan =
    typeof obj.ringkasan === "string" && obj.ringkasan.trim()
      ? obj.ringkasan.trim()
      : kosong
        ? "Aku belum menemukan transaksi pada pesan itu."
        : "Transaksi tercatat.";

  return { tipe, items, ringkasan, kosong };
}

/** Parse input teks bebas menjadi transaksi terstruktur. */
export async function parseTeks(teks: string): Promise<HasilParsing> {
  const ai = getClient();
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: getModel(),
      contents: [{ role: "user", parts: [{ text: teks }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    }),
  );

  const text = response.text ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }
  return normalisasiHasil(parsed, teks);
}

// Format audio yang diterima dari browser MediaRecorder yang kita dukung.
const MIME_AUDIO_DIDUKUNG = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/aac",
  "audio/flac",
];

function normalisasiMime(mimeType: string): string {
  // MediaRecorder sering memberi "audio/webm;codecs=opus" — Gemini cukup butuh tipe dasarnya.
  return mimeType.split(";")[0].trim().toLowerCase();
}

export function isMimeAudioDidukung(mimeType: string): boolean {
  return MIME_AUDIO_DIDUKUNG.includes(normalisasiMime(mimeType));
}

/**
 * Parse rekaman suara (voice note) menjadi transaksi terstruktur.
 * Gemini mentranskrip audio sekaligus mengekstrak transaksi dalam satu panggilan.
 */
export async function parseAudio(
  base64: string,
  mimeType: string,
): Promise<HasilParsing> {
  const ai = getClient();
  const mime = normalisasiMime(mimeType);

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: getModel(),
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Dengarkan rekaman suara berikut (Bahasa Indonesia) lalu catat transaksinya.",
            },
            { inlineData: { mimeType: mime, data: base64 } },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2,
      },
    }),
  );

  const text = response.text ?? "{}";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {};
  }
  return normalisasiHasil(parsed, "[voice note]");
}

// ── Narasi insight untuk laporan ──────────────────────────────────────────

const INSIGHT_SYSTEM = `Kamu adalah penasihat keuangan untuk pelaku UMKM Indonesia.
Kamu menerima ringkasan angka yang SUDAH dihitung. Tugasmu HANYA menarasikannya menjadi insight yang membantu.

Aturan ketat:
- JANGAN mengarang atau menghitung ulang angka. Pakai hanya angka yang diberikan.
- Tulis 2 sampai 4 kalimat dalam Bahasa Indonesia yang hangat, ringkas, dan mudah dipahami orang awam.
- Beri minimal satu saran konkret yang bisa ditindaklanjuti (mis. soal item terlaris, margin, atau pengeluaran terbesar).
- Jika labanya negatif, ingatkan dengan halus tanpa menggurui.
- Jangan gunakan format markdown, tanda bintang, atau heading. Teks biasa saja.`;

function ringkasStatistikUntukPrompt(
  stats: StatistikKeuangan,
  labelPeriode: string,
): string {
  const terlaris =
    stats.itemTerlaris.length > 0
      ? stats.itemTerlaris
          .map(
            (i) =>
              `${i.nama} (${formatRupiah(i.totalNilai)}, ${i.totalQty} unit)`,
          )
          .join("; ")
      : "tidak ada";

  const kurangLaris =
    stats.itemKurangLaris && stats.itemKurangLaris.length > 0
      ? stats.itemKurangLaris
          .map(
            (i) =>
              `${i.nama} (${formatRupiah(i.totalNilai)}, ${i.totalQty} unit)`,
          )
          .join("; ")
      : "tidak ada";

  const pengeluaran =
    stats.pengeluaranTeratas.length > 0
      ? stats.pengeluaranTeratas
          .map((i) => `${i.nama} (${formatRupiah(i.totalNilai)})`)
          .join("; ")
      : "tidak ada";

  return [
    `Periode: ${labelPeriode}`,
    `Jumlah transaksi: ${stats.jumlahTransaksi}`,
    `Total pemasukan: ${formatRupiah(stats.totalPemasukan)}`,
    `Total pengeluaran: ${formatRupiah(stats.totalPengeluaran)}`,
    `Laba (pemasukan - pengeluaran): ${formatRupiah(stats.laba)}`,
    `Rata-rata pemasukan per hari aktif: ${formatRupiah(stats.rataPemasukanPerHari)} (dari ${stats.jumlahHariAktif} hari)`,
    `Item terlaris (berdasarkan kuantitas): ${terlaris}`,
    `Item paling tidak laris (berdasarkan kuantitas): ${kurangLaris}`,
    `Pengeluaran terbesar: ${pengeluaran}`,
  ].join("\n");
}

/**
 * Hasilkan narasi insight dari statistik yang sudah dihitung.
 * AI hanya menarasikan; angka tidak pernah dikarang.
 */
export async function buatNarasiInsight(
  stats: StatistikKeuangan,
  labelPeriode: string,
): Promise<string> {
  if (stats.jumlahTransaksi === 0) {
    return `Belum ada transaksi pada periode ${labelPeriode.toLowerCase()}. Mulai catat penjualan dan pengeluaranmu untuk melihat insight di sini.`;
  }

  const ai = getClient();
  const response = await withRetry(() =>
    ai.models.generateContent({
      model: getModel(),
      contents: [
        {
          role: "user",
          parts: [{ text: ringkasStatistikUntukPrompt(stats, labelPeriode) }],
        },
      ],
      config: {
        systemInstruction: INSIGHT_SYSTEM,
        temperature: 0.5,
      },
    }),
  );

  const teks = response.text?.trim();
  return teks && teks.length > 0
    ? teks
    : "Ringkasan insight belum tersedia. Coba lagi sebentar.";
}
