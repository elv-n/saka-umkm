import type { RentangTanggal } from "@/lib/store";

export type Periode = "hari" | "bulan" | "tahun" | "semua";

export const PERIODE_LABEL: Record<Periode, string> = {
  hari: "Hari ini",
  bulan: "Bulan ini",
  tahun: "Tahun ini",
  semua: "Semua",
};

export function isPeriode(v: string | null | undefined): v is Periode {
  return v === "hari" || v === "bulan" || v === "tahun" || v === "semua";
}

/**
 * Hitung rentang tanggal untuk periode tertentu, relatif terhadap `acuan`
 * (default: sekarang). Mengembalikan undefined untuk "semua".
 */
export function rentangUntukPeriode(
  periode: Periode,
  acuan: Date = new Date(),
): RentangTanggal | undefined {
  if (periode === "semua") return undefined;

  if (periode === "hari") {
    const dari = new Date(acuan);
    dari.setHours(0, 0, 0, 0);
    const sampai = new Date(acuan);
    sampai.setHours(23, 59, 59, 999);
    return { dari, sampai };
  }

  if (periode === "bulan") {
    const dari = new Date(acuan.getFullYear(), acuan.getMonth(), 1, 0, 0, 0, 0);
    const sampai = new Date(
      acuan.getFullYear(),
      acuan.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return { dari, sampai };
  }

  // tahun
  const dari = new Date(acuan.getFullYear(), 0, 1, 0, 0, 0, 0);
  const sampai = new Date(acuan.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { dari, sampai };
}
