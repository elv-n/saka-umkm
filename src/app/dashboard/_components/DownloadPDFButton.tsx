"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";

interface ReportUser {
  namaPemilik: string;
  namaUsaha: string;
  alamat?: string | null;
  nomorHP?: string | null;
  bidangUsaha?: string | null;
}

interface ReportTransaksi {
  id: string;
  tanggal: string;
  tipe: "PEMASUKAN" | "PENGELUARAN";
  item: string;
  qty: number;
  hargaSatuan: number;
  total: number;
  kategori: string | null;
}

interface ItemRingkas {
  nama: string;
  totalNilai: number;
  totalQty: number;
  jumlahTransaksi: number;
}

interface ReportStatistik {
  jumlahTransaksi: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  laba: number;
  itemTerlaris: ItemRingkas[];
  pengeluaranTeratas: ItemRingkas[];
  jumlahHariAktif: number;
  rataPemasukanPerHari: number;
}

interface ReportData {
  user: ReportUser;
  transaksi: ReportTransaksi[];
  statistik: ReportStatistik;
  periode: string;
  label: string;
}

function fmtRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function fmtTanggal(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function fmtCetak(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export default function DownloadPDFButton({
  periode,
  dateString,
  monthString,
  yearString,
}: {
  periode: string;
  dateString: string;
  monthString: string;
  yearString: string;
}) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function handleDownload() {
    setLoading(true);
    try {
      // 1. Build API URL
      const params = new URLSearchParams();
      params.set("periode", periode);
      if (periode === "hari") params.set("tanggal", dateString);
      if (periode === "bulan") params.set("bulan", monthString);
      if (periode === "tahun") params.set("tahun", yearString);

      const res = await fetch(`/api/report?${params.toString()}`);
      if (!res.ok) {
        alert("Gagal mengambil data laporan. Coba lagi.");
        return;
      }
      const data: ReportData = await res.json();

      // 2. Dynamic import jspdf (avoid SSR issues)
      const { jsPDF } = await import("jspdf");
      const autoTableDefault = (await import("jspdf-autotable")).default;
      const autoTable = typeof autoTableDefault === "function" ? autoTableDefault : (autoTableDefault as any).default;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // ── Colors ───
      const blue = [5, 150, 105] as const;     // #059669 (emerald-600)
      const darkText = [15, 23, 42] as const;   // slate-900
      const mutedText = [100, 116, 139] as const; // slate-500
      const greenText = [5, 150, 105] as const;  // emerald-600
      const redText = [225, 29, 72] as const;    // rose-600
      const lightBg = [248, 250, 252] as const;  // slate-50

      // ── Helper: add footer on each page ───
      function addFooter() {
        const footerY = pageHeight - 8;
        doc.setFontSize(7);
        doc.setTextColor(...mutedText);
        doc.text(
          `Dicetak oleh SAKA • ${fmtCetak()} • Laporan ini dihasilkan secara otomatis`,
          pageWidth / 2,
          footerY,
          { align: "center" },
        );
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
      }

      // ── Helper: check page break ───
      function checkPageBreak(needed: number) {
        if (y + needed > pageHeight - 15) {
          addFooter();
          doc.addPage();
          y = margin;
        }
      }

      // ════════════════════════════════════════════════════
      //  HEADER BLOCK
      // ════════════════════════════════════════════════════

      // Blue accent bar at top
      doc.setFillColor(...blue);
      doc.rect(0, 0, pageWidth, 4, "F");

      y = 14;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...darkText);
      doc.text("LAPORAN KEUANGAN", margin, y);
      y += 7;

      // Business name
      doc.setFontSize(13);
      doc.setTextColor(...blue);
      doc.text(data.user.namaUsaha || "Usaha Saya", margin, y);
      y += 6;

      // Owner & contact info
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      const infoParts: string[] = [];
      if (data.user.namaPemilik) infoParts.push(`Pemilik: ${data.user.namaPemilik}`);
      if (data.user.bidangUsaha) infoParts.push(`Bidang: ${data.user.bidangUsaha}`);
      if (data.user.nomorHP) infoParts.push(`HP: ${data.user.nomorHP}`);
      if (infoParts.length > 0) {
        doc.text(infoParts.join("  •  "), margin, y);
        y += 4;
      }
      if (data.user.alamat) {
        doc.text(`Alamat: ${data.user.alamat}`, margin, y);
        y += 4;
      }

      y += 1;

      // Period & print date
      doc.setFillColor(...lightBg);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...darkText);
      doc.text(`Periode: ${data.label}`, margin + 4, y + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...mutedText);
      doc.text(`Tanggal Cetak: ${fmtCetak()}`, margin + 4, y + 9.5);
      y += 16;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // ════════════════════════════════════════════════════
      //  RINGKASAN KEUANGAN
      // ════════════════════════════════════════════════════

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...darkText);
      doc.text("RINGKASAN KEUANGAN", margin, y);
      y += 6;

      const laba = data.statistik.laba;
      const summaryRows = [
        ["Total Pemasukan", fmtRupiah(data.statistik.totalPemasukan)],
        ["Total Pengeluaran", fmtRupiah(data.statistik.totalPengeluaran)],
        ["Laba / Rugi (Saldo)", fmtRupiah(laba)],
        ["Jumlah Transaksi", String(data.statistik.jumlahTransaksi)],
        ["Jumlah Hari Aktif", String(data.statistik.jumlahHariAktif)],
        ["Rata-rata Pemasukan/Hari", fmtRupiah(data.statistik.rataPemasukanPerHari)],
      ];

      autoTable(doc, {
        startY: y,
        head: [["Keterangan", "Nilai"]],
        body: summaryRows,
        margin: { left: margin, right: margin },
        theme: "grid",
        headStyles: {
          fillColor: [...blue],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "left" as const,
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [...darkText],
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.55, fontStyle: "bold" as const },
          1: { cellWidth: contentWidth * 0.45, halign: "right" as const },
        },
        alternateRowStyles: { fillColor: [...lightBg] },
        didParseCell: (hookData: any) => {
          if (hookData.section === "body" && hookData.row.index === 2 && hookData.column.index === 1) {
            hookData.cell.styles.textColor = laba >= 0 ? [...greenText] : [...redText];
            hookData.cell.styles.fontStyle = "bold";
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;

      // ════════════════════════════════════════════════════
      //  DAFTAR TRANSAKSI
      // ════════════════════════════════════════════════════

      if (data.transaksi.length > 0) {
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...darkText);
        doc.text(`DAFTAR TRANSAKSI (${data.transaksi.length})`, margin, y);
        y += 6;

        const txRows = data.transaksi.map((t, i) => [
          String(i + 1),
          fmtTanggal(t.tanggal),
          t.item,
          t.tipe === "PEMASUKAN" ? "Masuk" : "Keluar",
          String(t.qty),
          fmtRupiah(t.hargaSatuan),
          fmtRupiah(t.total),
        ]);

        autoTable(doc, {
          startY: y,
          head: [["No", "Tanggal", "Item", "Tipe", "Qty", "Harga Satuan", "Total"]],
          body: txRows,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: {
            fillColor: [...blue],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
            halign: "center" as const,
          },
          bodyStyles: {
            fontSize: 7,
            textColor: [...darkText],
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 8, halign: "center" as const },
            1: { cellWidth: 30 },
            2: { cellWidth: "auto" as const },
            3: { cellWidth: 14, halign: "center" as const },
            4: { cellWidth: 10, halign: "center" as const },
            5: { cellWidth: 25, halign: "right" as const },
            6: { cellWidth: 25, halign: "right" as const },
          },
          alternateRowStyles: { fillColor: [...lightBg] },
          didParseCell: (hookData: any) => {
            if (hookData.section === "body" && hookData.column.index === 3) {
              const val = hookData.cell.raw;
              if (val === "Masuk") {
                hookData.cell.styles.textColor = [...greenText];
                hookData.cell.styles.fontStyle = "bold";
              } else {
                hookData.cell.styles.textColor = [...redText];
                hookData.cell.styles.fontStyle = "bold";
              }
            }
            if (hookData.section === "body" && hookData.column.index === 6) {
              hookData.cell.styles.fontStyle = "bold";
            }
          },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ════════════════════════════════════════════════════
      //  PRODUK TERLARIS
      // ════════════════════════════════════════════════════

      if (data.statistik.itemTerlaris.length > 0) {
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...darkText);
        doc.text("PRODUK TERLARIS", margin, y);
        y += 6;

        const topRows = data.statistik.itemTerlaris.map((item, i) => [
          String(i + 1),
          item.nama,
          String(item.totalQty),
          fmtRupiah(item.totalNilai),
          String(item.jumlahTransaksi),
        ]);

        autoTable(doc, {
          startY: y,
          head: [["No", "Nama Produk", "Qty Terjual", "Total Nilai", "Jml Transaksi"]],
          body: topRows,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: {
            fillColor: [5, 150, 105],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center" as const,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [...darkText],
            cellPadding: 2.5,
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" as const },
            1: { cellWidth: "auto" as const },
            2: { cellWidth: 22, halign: "center" as const },
            3: { cellWidth: 30, halign: "right" as const, fontStyle: "bold" as const },
            4: { cellWidth: 25, halign: "center" as const },
          },
          alternateRowStyles: { fillColor: [236, 253, 245] },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ════════════════════════════════════════════════════
      //  PENGELUARAN TERBESAR
      // ════════════════════════════════════════════════════

      if (data.statistik.pengeluaranTeratas.length > 0) {
        checkPageBreak(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...darkText);
        doc.text("PENGELUARAN TERBESAR", margin, y);
        y += 6;

        const expRows = data.statistik.pengeluaranTeratas.map((item, i) => [
          String(i + 1),
          item.nama,
          fmtRupiah(item.totalNilai),
          String(item.jumlahTransaksi),
        ]);

        autoTable(doc, {
          startY: y,
          head: [["No", "Kategori / Item", "Total Nilai", "Jml Transaksi"]],
          body: expRows,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: {
            fillColor: [225, 29, 72],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
            halign: "center" as const,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [...darkText],
            cellPadding: 2.5,
          },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" as const },
            1: { cellWidth: "auto" as const },
            2: { cellWidth: 35, halign: "right" as const, fontStyle: "bold" as const },
            3: { cellWidth: 25, halign: "center" as const },
          },
          alternateRowStyles: { fillColor: [255, 241, 242] },
        });

        y = (doc as any).lastAutoTable.finalY + 10;
      }

      // ── Footer on last page ───
      addFooter();

      // 3. Save the file
      const fileName = `Laporan_${data.user.namaUsaha?.replace(/\s+/g, "_") || "UMKM"}_${data.label.replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("Gagal membuat PDF:", err);
      alert("Gagal membuat laporan PDF. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-sm font-extrabold transition cursor-pointer select-none whitespace-nowrap disabled:opacity-60 active:scale-95 shadow-sm shadow-emerald-600/15 shrink-0"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="hidden sm:inline">Membuat PDF…</span>
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download PDF</span>
        </>
      )}
    </button>
  );
}
