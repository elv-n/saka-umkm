import { NextResponse } from "next/server";
import { z } from "zod";

import { AuthError, requireUserId } from "@/lib/auth";
import {
  GeminiConfigError,
  GeminiRateLimitError,
  isMimeAudioDidukung,
  parseAudio,
  parseTeks,
} from "@/lib/gemini";
import { simpanTransaksi } from "@/lib/store";
import type { HasilParsing } from "@/lib/types";

// Batas ukuran audio base64 (~7MB biner -> cukup untuk voice note pendek).
const MAX_AUDIO_BASE64 = 10_000_000;

const bodySchema = z.union([
  z.object({
    teks: z.string().trim().min(1, "Pesan tidak boleh kosong.").max(1000),
  }),
  z.object({
    audio: z.string().min(1, "Audio kosong.").max(MAX_AUDIO_BASE64),
    mimeType: z.string().min(1, "Tipe audio tidak diketahui."),
  }),
]);

export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body harus berupa JSON yang valid." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Input tidak valid." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    let hasil: HasilParsing;
    let rawInput: string;

    if ("audio" in data) {
      if (!isMimeAudioDidukung(data.mimeType)) {
        return NextResponse.json(
          { error: `Format audio tidak didukung: ${data.mimeType}` },
          { status: 400 },
        );
      }
      hasil = await parseAudio(data.audio, data.mimeType);
      rawInput = "[voice note]";
    } else {
      hasil = await parseTeks(data.teks);
      rawInput = data.teks;
    }

    if (hasil.kosong) {
      return NextResponse.json({
        kosong: true,
        ringkasan: hasil.ringkasan,
        transaksi: [],
      });
    }

    const transaksi = await simpanTransaksi(userId, hasil, rawInput);

    return NextResponse.json({
      kosong: false,
      tipe: hasil.tipe,
      ringkasan: hasil.ringkasan,
      transaksi,
    });
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof GeminiRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("[/api/ingest] gagal:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pesan. Coba lagi." },
      { status: 500 },
    );
  }
}
