import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";
const ADMIN_COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 hari

export interface SessionPayload {
  userId: string;
  [key: string]: unknown;
}

export interface AdminSessionPayload {
  adminId: string;
  [key: string]: unknown;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET belum diatur (atau terlalu pendek). Tambahkan di file .env.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload | AdminSessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

async function decryptAdminSession(
  token: string | undefined,
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.adminId !== "string") return null;
    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

// ── User session ──────────────────────────────────────────────────────────

/** Buat sesi login dan set cookie httpOnly. */
export async function createSession(userId: string): Promise<void> {
  const token = await encryptSession({ userId });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Hapus sesi (logout). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Ambil userId dari sesi saat ini, atau null bila belum login. */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = await decryptSession(token);
  return payload?.userId ?? null;
}

// ── Admin session ─────────────────────────────────────────────────────────

/** Buat sesi admin dan set cookie httpOnly terpisah. */
export async function createAdminSession(adminId: string): Promise<void> {
  const token = await encryptSession({ adminId });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Hapus sesi admin (logout). */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({
    name: ADMIN_COOKIE_NAME,
    path: "/admin",
  });
}

/** Ambil adminId dari sesi admin saat ini, atau null bila belum login. */
export async function getAdminSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await decryptAdminSession(token);
  return payload?.adminId ?? null;
}
