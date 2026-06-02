import "server-only";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Dipakai API route: kembalikan userId atau lempar AuthError (untuk 401). */
export async function requireUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new AuthError("Belum login.");
  }
  // Pastikan user masih APPROVED
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!user || user.status !== "APPROVED") {
    throw new AuthError("Akun belum disetujui atau tidak ditemukan.");
  }
  return userId;
}

/** Buat user baru. Lempar AuthError bila email sudah dipakai. */
export async function registerUser(input: {
  namaPemilik: string;
  namaUsaha?: string;
  nomorHP?: string;
  alamat?: string;
  bidangUsaha?: string;
  deskripsi?: string;
  email: string;
  password: string;
}): Promise<string> {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthError("Email sudah terdaftar. Silakan login.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      namaPemilik: input.namaPemilik.trim(),
      namaUsaha: input.namaUsaha?.trim() || "Usaha Saya",
      nomorHP: input.nomorHP?.trim() || null,
      alamat: input.alamat?.trim() || null,
      bidangUsaha: input.bidangUsaha?.trim() || null,
      deskripsi: input.deskripsi?.trim() || null,
      email,
      passwordHash,
      status: "PENDING",
    },
    select: { id: true },
  });
  return user.id;
}

/** Verifikasi kredensial login. Kembalikan userId atau lempar AuthError. */
export async function verifyCredentials(input: { email: string; password: string }): Promise<string> {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AuthError("Email atau kata sandi salah.");
  }
  const cocok = await bcrypt.compare(input.password, user.passwordHash);
  if (!cocok) {
    throw new AuthError("Email atau kata sandi salah.");
  }

  // Cek status approval
  if (user.status === "PENDING") {
    throw new AuthError("Akunmu masih menunggu persetujuan admin. Hubungi admin untuk informasi lebih lanjut.");
  }
  if (user.status === "REJECTED") {
    throw new AuthError("Pendaftaran akunmu ditolak. Hubungi admin untuk informasi lebih lanjut.");
  }

  return user.id;
}

/** Ambil data user lengkap untuk ditampilkan di profil (tanpa passwordHash). */
export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      namaPemilik: true,
      namaUsaha: true,
      email: true,
      nomorHP: true,
      alamat: true,
      bidangUsaha: true,
      deskripsi: true,
      status: true,
    },
  });
  if (!user || user.status !== "APPROVED") return null;
  return user;
}
