import { NextRequest, NextResponse } from "next/server";

import { AuthError, requireUserId } from "@/lib/auth";
import {
  GeminiConfigError,
  GeminiRateLimitError,
  buatNarasiInsight,
} from "@/lib/gemini";
import { ambilTransaksi } from "@/lib/store";
import { hitungStatistik } from "@/lib/stats";
import {
  PERIODE_LABEL,
  isPeriode,
  rentangUntukPeriode,
} from "@/lib/periode";

export async function GET(request: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const periodeParam = request.nextUrl.searchParams.get("periode");
  const tanggalParam = request.nextUrl.searchParams.get("tanggal");
  const periode = isPeriode(periodeParam) ? periodeParam : "bulan";

  let acuan = new Date();
  if (tanggalParam) {
    if (periode === "hari") {
      const parsedDate = new Date(tanggalParam);
      if (!isNaN(parsedDate.getTime())) {
        acuan = parsedDate;
      }
    } else if (periode === "bulan") {
      const parts = tanggalParam.split("-");
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          acuan = new Date(y, m, 1);
        }
      }
    } else if (periode === "tahun") {
      const y = parseInt(tanggalParam, 10);
      if (!isNaN(y)) {
        acuan = new Date(y, 0, 1);
      }
    }
  }
  const rentang = rentangUntukPeriode(periode, acuan);

  try {
    const transaksi = await ambilTransaksi(userId, { rentang, limit: 1000 });
    const statistik = hitungStatistik(transaksi);

    let labelPeriode = PERIODE_LABEL[periode];
    if (tanggalParam) {
      if (periode === "hari") {
        const parsedDate = new Date(tanggalParam);
        if (!isNaN(parsedDate.getTime())) {
          labelPeriode = parsedDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        }
      } else if (periode === "bulan") {
        const parts = tanggalParam.split("-");
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            const d = new Date(y, m, 1);
            labelPeriode = d.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            });
          }
        }
      } else if (periode === "tahun") {
        const y = parseInt(tanggalParam, 10);
        if (!isNaN(y)) {
          labelPeriode = `Tahun ${y}`;
        }
      }
    }
    const narasi = await buatNarasiInsight(statistik, labelPeriode);

    return NextResponse.json({ periode, statistik, narasi });
  } catch (err) {
    if (err instanceof GeminiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof GeminiRateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    console.error("[/api/insight] gagal:", err);
    return NextResponse.json(
      { error: "Gagal membuat insight." },
      { status: 500 },
    );
  }
}
