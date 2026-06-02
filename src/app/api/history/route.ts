import { NextResponse } from "next/server";
import { AuthError, requireUserId } from "@/lib/auth";
import { ambilTransaksi } from "@/lib/store";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  try {
    const transaksi = await ambilTransaksi(userId, { limit: 100 });
    return NextResponse.json({ transaksi });
  } catch (err) {
    console.error("[/api/history] gagal:", err);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat transaksi." },
      { status: 500 },
    );
  }
}
