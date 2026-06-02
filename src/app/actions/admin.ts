"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { AdminAuthError, verifyAdminCredentials, requireAdmin } from "@/lib/admin-auth";
import { createAdminSession, destroyAdminSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// ── Types ─────────────────────────────────────────────────────────────────

export type AdminLoginState =
  | { error?: string; fields?: { username?: string } }
  | undefined;

// ── Auth actions ──────────────────────────────────────────────────────────

export async function adminLoginAction(
  _prev: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan kata sandi wajib diisi.", fields: { username } };
  }

  try {
    const adminId = await verifyAdminCredentials({ username, password });
    await createAdminSession(adminId);
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { error: err.message, fields: { username } };
    }
    throw err;
  }

  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

// ── User management actions ───────────────────────────────────────────────

export async function approveUserAction(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin");
}

export async function rejectUserAction(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED" },
  });
  revalidatePath("/admin");
}

// ── System config actions ─────────────────────────────────────────────────

export async function updateConfigAction(key: string, value: string): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  if (!key || typeof value !== "string") {
    return { success: false, error: "Key dan value wajib diisi." };
  }

  await prisma.systemConfig.upsert({
    where: { key },
    update: { value, updatedBy: admin.username },
    create: { key, value, updatedBy: admin.username },
  });

  revalidatePath("/admin");
  return { success: true };
}

// ── Admin management actions ──────────────────────────────────────────────

export async function addAdminAction(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const currentAdmin = await requireAdmin();

  if (!username.trim() || !password) {
    return { success: false, error: "Username dan kata sandi wajib diisi." };
  }

  const existing = await prisma.admin.findUnique({
    where: { username: username.trim() },
  });

  if (existing) {
    return { success: false, error: "Username sudah digunakan." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      username: username.trim(),
      passwordHash,
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function deleteAdminAction(adminId: string): Promise<{ success: boolean; error?: string }> {
  const currentAdmin = await requireAdmin();

  if (currentAdmin.id === adminId) {
    return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." };
  }

  const target = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!target) {
    return { success: false, error: "Akun admin tidak ditemukan." };
  }

  await prisma.admin.delete({
    where: { id: adminId },
  });

  revalidatePath("/admin");
  return { success: true };
}
