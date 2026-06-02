import "server-only";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getAdminSessionId } from "@/lib/session";

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

/** Verifikasi kredensial admin. Kembalikan adminId atau lempar error. */
export async function verifyAdminCredentials(input: {
  username: string;
  password: string;
}): Promise<string> {
  const admin = await prisma.admin.findUnique({
    where: { username: input.username.trim() },
  });
  if (!admin) {
    throw new AdminAuthError("Username atau kata sandi salah.");
  }
  const cocok = await bcrypt.compare(input.password, admin.passwordHash);
  if (!cocok) {
    throw new AdminAuthError("Username atau kata sandi salah.");
  }
  return admin.id;
}

/** Pastikan ada sesi admin yang valid. Kembalikan data admin atau lempar error. */
export async function requireAdmin(): Promise<{ id: string; username: string }> {
  const adminId = await getAdminSessionId();
  if (!adminId) {
    throw new AdminAuthError("Belum login sebagai admin.");
  }
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, username: true },
  });
  if (!admin) {
    throw new AdminAuthError("Admin tidak ditemukan.");
  }
  return admin;
}

/** Ambil data admin saat ini, atau null bila belum login atau tidak ditemukan. */
export async function getCurrentAdmin(): Promise<{ id: string; username: string } | null> {
  const adminId = await getAdminSessionId();
  if (!adminId) return null;
  return prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, username: true },
  });
}

