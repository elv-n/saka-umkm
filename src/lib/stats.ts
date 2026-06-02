// Agregasi statistik transaksi (deterministik, dihitung di kode bukan oleh AI).
import type { TransaksiDTO } from "@/lib/types";

export interface ItemRingkas {
  nama: string;
  totalNilai: number;
  totalQty: number;
  jumlahTransaksi: number;
}

export interface StatistikKeuangan {
  jumlahTransaksi: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  laba: number; // pemasukan - pengeluaran
  // Item penjualan (PEMASUKAN) teratas berdasarkan kuantitas.
  itemTerlaris: ItemRingkas[];
  // Item penjualan (PEMASUKAN) terbawah berdasarkan kuantitas.
  itemKurangLaris: ItemRingkas[];
  // Kategori pengeluaran teratas berdasarkan nilai.
  pengeluaranTeratas: ItemRingkas[];
  // Jumlah hari berbeda yang memiliki transaksi (untuk rata-rata).
  jumlahHariAktif: number;
  rataPemasukanPerHari: number;
}

function tanggalLokal(iso: string): string {
  // Kunci hari berdasarkan tanggal lokal (YYYY-MM-DD).
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function agregasiItem(
  transaksi: TransaksiDTO[],
  kunci: (t: TransaksiDTO) => string,
): ItemRingkas[] {
  const peta = new Map<string, ItemRingkas>();
  for (const t of transaksi) {
    const nama = kunci(t);
    const ada = peta.get(nama);
    if (ada) {
      ada.totalNilai += t.total;
      ada.totalQty += t.qty;
      ada.jumlahTransaksi += 1;
    } else {
      peta.set(nama, {
        nama,
        totalNilai: t.total,
        totalQty: t.qty,
        jumlahTransaksi: 1,
      });
    }
  }
  return [...peta.values()];
}

export function hitungStatistik(transaksi: TransaksiDTO[]): StatistikKeuangan {
  const pemasukan = transaksi.filter((t) => t.tipe === "PEMASUKAN");
  const pengeluaran = transaksi.filter((t) => t.tipe === "PENGELUARAN");

  const totalPemasukan = pemasukan.reduce((s, t) => s + t.total, 0);
  const totalPengeluaran = pengeluaran.reduce((s, t) => s + t.total, 0);

  const semuaPemasukanItem = agregasiItem(pemasukan, (t) => t.item);
  const itemTerlaris = [...semuaPemasukanItem]
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);
  const itemKurangLaris = [...semuaPemasukanItem]
    .sort((a, b) => a.totalQty - b.totalQty)
    .slice(0, 5);

  const pengeluaranTeratas = agregasiItem(
    pengeluaran,
    (t) => t.kategori || t.item,
  )
    .sort((a, b) => b.totalNilai - a.totalNilai)
    .slice(0, 5);

  const hariAktif = new Set(transaksi.map((t) => tanggalLokal(t.tanggal)));
  const jumlahHariAktif = hariAktif.size;

  return {
    jumlahTransaksi: transaksi.length,
    totalPemasukan,
    totalPengeluaran,
    laba: totalPemasukan - totalPengeluaran,
    itemTerlaris,
    itemKurangLaris,
    pengeluaranTeratas,
    jumlahHariAktif,
    rataPemasukanPerHari:
      jumlahHariAktif > 0 ? Math.round(totalPemasukan / jumlahHariAktif) : 0,
  };
}

// ── Seri waktu untuk grafik tren ──────────────────────────────────────────

export interface TitikSeri {
  label: string; // label sumbu X (mis. "1 Jun" atau "Jun")
  pemasukan: number;
  pengeluaran: number;
}

export type Granularitas = "harian" | "bulanan";

const NAMA_BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/**
 * Bangun seri waktu pemasukan vs pengeluaran.
 * - "harian": dikelompokkan per tanggal (cocok untuk periode hari/bulan).
 * - "bulanan": dikelompokkan per bulan (cocok untuk periode tahun/semua).
 */
export function bangunSeriWaktu(
  transaksi: TransaksiDTO[],
  granularitas: Granularitas,
): TitikSeri[] {
  const peta = new Map<string, { urut: number; label: string; pemasukan: number; pengeluaran: number }>();

  for (const t of transaksi) {
    const d = new Date(t.tanggal);
    let kunci: string;
    let urut: number;
    let label: string;

    if (granularitas === "bulanan") {
      kunci = `${d.getFullYear()}-${d.getMonth()}`;
      urut = d.getFullYear() * 12 + d.getMonth();
      label = NAMA_BULAN[d.getMonth()];
    } else {
      kunci = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      urut = d.getTime() - (d.getTime() % 86400000);
      label = `${d.getDate()} ${NAMA_BULAN[d.getMonth()]}`;
    }

    const ada = peta.get(kunci);
    if (ada) {
      if (t.tipe === "PEMASUKAN") ada.pemasukan += t.total;
      else ada.pengeluaran += t.total;
    } else {
      peta.set(kunci, {
        urut,
        label,
        pemasukan: t.tipe === "PEMASUKAN" ? t.total : 0,
        pengeluaran: t.tipe === "PENGELUARAN" ? t.total : 0,
      });
    }
  }

  return [...peta.values()]
    .sort((a, b) => a.urut - b.urut)
    .map(({ label, pemasukan, pengeluaran }) => ({ label, pemasukan, pengeluaran }));
}
