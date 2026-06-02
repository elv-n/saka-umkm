// Helper sisi klien untuk merekam & mengonversi audio (tanpa "server-only").

/** Pilih mimeType rekaman yang didukung browser & Gemini. */
export function pilihMimeRekaman(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const kandidat = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const m of kandidat) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "audio/webm";
}

/** Ubah Blob audio menjadi base64 murni (tanpa prefix data URL). */
export function blobKeBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const hasil = reader.result;
      if (typeof hasil !== "string") {
        reject(new Error("Gagal membaca audio."));
        return;
      }
      // hasil berbentuk "data:audio/webm;base64,XXXX" -> ambil setelah koma.
      const koma = hasil.indexOf(",");
      resolve(koma >= 0 ? hasil.slice(koma + 1) : hasil);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca audio."));
    reader.readAsDataURL(blob);
  });
}
