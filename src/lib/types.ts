// Tipe domain bersama untuk asisten keuangan UMKM.

export const TIPE_PEMASUKAN = "PEMASUKAN" as const;
export const TIPE_PENGELUARAN = "PENGELUARAN" as const;

export type TipeTransaksi = typeof TIPE_PEMASUKAN | typeof TIPE_PENGELUARAN;

// Satu baris item dalam sebuah transaksi (hasil ekstraksi AI).
export interface ItemTransaksi {
  item: string;
  qty: number;
  hargaSatuan: number;
  total: number;
  kategori?: string | null;
}

// Hasil parsing AI dari satu input (teks/suara) pengguna.
export interface HasilParsing {
  tipe: TipeTransaksi;
  items: ItemTransaksi[];
  // Ringkasan singkat untuk dikonfirmasi ke pengguna.
  ringkasan: string;
  // True jika AI tidak menemukan transaksi yang bisa dicatat.
  kosong: boolean;
}

// Bentuk transaksi yang dikirim ke klien (serializable).
export interface TransaksiDTO {
  id: string;
  tanggal: string;
  tipe: TipeTransaksi;
  item: string;
  qty: number;
  hargaSatuan: number;
  total: number;
  kategori: string | null;
  rawInput: string | null;
}
