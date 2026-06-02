"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { pilihMimeRekaman } from "@/lib/audio";

export type StatusRekam = "idle" | "recording" | "unsupported";

export interface HasilRekam {
  blob: Blob;
  mimeType: string;
  durasiMs: number;
}

/**
 * Hook perekam suara berbasis MediaRecorder.
 * mulai() meminta izin mikrofon & mulai merekam; selesai() mengembalikan Blob.
 */
export function useRecorder() {
  // Mulai dari "idle" agar render server & render klien pertama identik
  // (hindari hydration mismatch). Dukungan dideteksi setelah mount.
  const [status, setStatus] = useState<StatusRekam>("idle");
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mulaiMsRef = useRef<number>(0);

  // Deteksi dukungan mikrofon hanya di klien, setelah hidrasi.
  useEffect(() => {
    const didukung =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined";
    if (!didukung) {
      setStatus("unsupported");
    }
  }, []);

  const bersihkan = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const mulai = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setStatus("unsupported");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pilihMimeRekaman();
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      recorderRef.current = recorder;
      mulaiMsRef.current = Date.now();
      setStatus("recording");
      return true;
    } catch (err) {
      bersihkan();
      setStatus("idle");
      setError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Izin mikrofon ditolak. Aktifkan di pengaturan browser."
          : "Tidak bisa mengakses mikrofon.",
      );
      return false;
    }
  }, [bersihkan]);

  const selesai = useCallback((): Promise<HasilRekam | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const durasiMs = Date.now() - mulaiMsRef.current;
        bersihkan();
        setStatus("idle");
        resolve(blob.size > 0 ? { blob, mimeType, durasiMs } : null);
      };
      recorder.stop();
    });
  }, [bersihkan]);

  const batal = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.onstop = () => {
        bersihkan();
        setStatus("idle");
      };
      recorder.stop();
    } else {
      bersihkan();
      setStatus("idle");
    }
  }, [bersihkan]);

  return { status, error, mulai, selesai, batal };
}
