import { NextRequest, NextResponse } from "next/server";

import { AuthError, requireUserId } from "@/lib/auth";
import { ambilTransaksi } from "@/lib/store";
import { isPeriode, rentangUntukPeriode } from "@/lib/periode";

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
  const periode = isPeriode(periodeParam) ? periodeParam : "semua";
  const rentang = rentangUntukPeriode(periode);

  try {
    const transaksi = await ambilTransaksi(userId, { rentang });
    return NextResponse.json({ periode, transaksi });
  } catch (err) {
    console.error("[/api/transactions] gagal:", err);
    return NextResponse.json(
      { error: "Gagal memuat transaksi." },
      { status: 500 },
    );
  }
}
