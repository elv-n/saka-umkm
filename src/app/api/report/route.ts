import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireUserId } from "@/lib/auth";
import { ambilTransaksi } from "@/lib/store";
import { hitungStatistik } from "@/lib/stats";
import { isPeriode, rentangUntukPeriode, PERIODE_LABEL, type Periode } from "@/lib/periode";
import { prisma } from "@/lib/prisma";

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

  const params = request.nextUrl.searchParams;
  const periodeParam = params.get("periode");
  const tanggalParam = params.get("tanggal");
  const bulanParam = params.get("bulan");
  const tahunParam = params.get("tahun");

  const periode: Periode = isPeriode(periodeParam) ? periodeParam : "bulan";

  // Calculate reference date (same logic as dashboard page)
  let acuan = new Date();
  if (periode === "hari" && tanggalParam) {
    const parsed = new Date(tanggalParam);
    if (!isNaN(parsed.getTime())) acuan = parsed;
  } else if (periode === "bulan" && bulanParam) {
    const parts = bulanParam.split("-");
    if (parts.length === 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) acuan = new Date(y, m, 1);
    }
  } else if (periode === "tahun" && tahunParam) {
    const y = parseInt(tahunParam, 10);
    if (!isNaN(y)) acuan = new Date(y, 0, 1);
  }

  const rentang = rentangUntukPeriode(periode, acuan);

  // Build human-readable period label
  let label = PERIODE_LABEL[periode];
  if (periode === "hari") {
    label = acuan.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else if (periode === "bulan") {
    label = acuan.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  } else if (periode === "tahun") {
    label = `Tahun ${acuan.getFullYear()}`;
  }

  try {
    const [transaksi, user] = await Promise.all([
      ambilTransaksi(userId, { rentang, limit: 1000 }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          namaPemilik: true,
          namaUsaha: true,
          alamat: true,
          nomorHP: true,
          bidangUsaha: true,
        },
      }),
    ]);

    const statistik = hitungStatistik(transaksi);

    return NextResponse.json({
      user: user ?? { namaPemilik: "Pengguna", namaUsaha: "Usaha Saya" },
      transaksi,
      statistik,
      periode,
      label,
    });
  } catch (err) {
    console.error("[/api/report] gagal:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan." },
      { status: 500 },
    );
  }
}
