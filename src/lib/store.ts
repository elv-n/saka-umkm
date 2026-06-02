import "server-only";

import { prisma } from "@/lib/prisma";
import { HasilParsing, TransaksiDTO } from "@/lib/types";

/** Simpan hasil parsing AI sebagai satu atau lebih transaksi milik user. */
export async function simpanTransaksi(
  userId: string,
  hasil: HasilParsing,
  rawInput: string,
): Promise<TransaksiDTO[]> {
  const created = await prisma.$transaction(
    hasil.items.map((item) =>
      prisma.transaction.create({
        data: {
          userId,
          tipe: hasil.tipe,
          item: item.item,
          qty: item.qty,
          hargaSatuan: item.hargaSatuan,
          total: item.total,
          kategori: item.kategori ?? null,
          rawInput,
        },
      }),
    ),
  );

  return created.map(toDTO);
}

export interface RentangTanggal {
  dari?: Date;
  sampai?: Date;
}

/** Ambil transaksi milik user, opsional difilter rentang tanggal. */
export async function ambilTransaksi(
  userId: string,
  opts: { limit?: number; rentang?: RentangTanggal } = {},
): Promise<TransaksiDTO[]> {
  const { limit = 100, rentang } = opts;
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      ...(rentang?.dari || rentang?.sampai
        ? {
            tanggal: {
              ...(rentang.dari ? { gte: rentang.dari } : {}),
              ...(rentang.sampai ? { lte: rentang.sampai } : {}),
            },
          }
        : {}),
    },
    orderBy: { tanggal: "desc" },
    take: limit,
  });
  return rows.map(toDTO);
}

type TransactionRow = Awaited<
  ReturnType<typeof prisma.transaction.findFirstOrThrow>
>;

function toDTO(row: TransactionRow): TransaksiDTO {
  return {
    id: row.id,
    tanggal: row.tanggal.toISOString(),
    tipe: row.tipe === "PENGELUARAN" ? "PENGELUARAN" : "PEMASUKAN",
    item: row.item,
    qty: row.qty,
    hargaSatuan: row.hargaSatuan,
    total: row.total,
    kategori: row.kategori,
    rawInput: row.rawInput,
  };
}

/** Ambil semua tahun unik yang memiliki data transaksi untuk user tersebut. */
export async function ambilTahunTransaksi(userId: string): Promise<number[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId },
    select: { tanggal: true },
  });
  const yearsSet = new Set<number>();
  for (const row of rows) {
    yearsSet.add(row.tanggal.getFullYear());
  }
  const years = Array.from(yearsSet).sort((a, b) => b - a);
  if (years.length === 0) {
    years.push(new Date().getFullYear());
  }
  return years;
}

/** Hapus transaksi milik user tertentu secara aman. */
export async function hapusTransaksi(userId: string, id: string): Promise<boolean> {
  const deleted = await prisma.transaction.deleteMany({
    where: { id, userId },
  });
  return deleted.count > 0;
}

/** Ubah detail transaksi milik user tertentu secara aman. */
export async function ubahTransaksi(
  userId: string,
  id: string,
  data: {
    tipe: "PEMASUKAN" | "PENGELUARAN";
    item: string;
    qty: number;
    hargaSatuan: number;
    total: number;
    kategori?: string | null;
  },
): Promise<TransaksiDTO | null> {
  const tx = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!tx) return null;

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      tipe: data.tipe,
      item: data.item,
      qty: data.qty,
      hargaSatuan: data.hargaSatuan,
      total: data.total,
      kategori: data.kategori ?? null,
    },
  });
  return toDTO(updated);
}

