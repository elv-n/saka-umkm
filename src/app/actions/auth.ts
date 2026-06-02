"use server";

import { redirect } from "next/navigation";

import { AuthError, registerUser, verifyCredentials } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { loginSchema, signupSchema, type AuthFormState } from "@/lib/validation";

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    namaPemilik: formData.get("namaPemilik"),
    namaUsaha: formData.get("namaUsaha"),
    nomorHP: formData.get("nomorHP"),
    alamat: formData.get("alamat"),
    bidangUsaha: formData.get("bidangUsaha"),
    deskripsi: formData.get("deskripsi"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
      fields: {
        namaPemilik: String(formData.get("namaPemilik") ?? ""),
        namaUsaha: String(formData.get("namaUsaha") ?? ""),
        nomorHP: String(formData.get("nomorHP") ?? ""),
        alamat: String(formData.get("alamat") ?? ""),
        bidangUsaha: String(formData.get("bidangUsaha") ?? ""),
        deskripsi: String(formData.get("deskripsi") ?? ""),
        email: String(formData.get("email") ?? ""),
      },
    };
  }

  try {
    await registerUser(parsed.data);
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: err.message,
        fields: {
          namaPemilik: parsed.data.namaPemilik,
          namaUsaha: parsed.data.namaUsaha,
          nomorHP: parsed.data.nomorHP,
          alamat: parsed.data.alamat,
          bidangUsaha: parsed.data.bidangUsaha,
          deskripsi: parsed.data.deskripsi,
          email: parsed.data.email,
        },
      };
    }
    throw err;
  }

  // Tidak membuat session — user harus menunggu approval admin
  redirect("/pending");
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Input tidak valid.",
      fields: { email: String(formData.get("email") ?? "") },
    };
  }

  let userId: string;
  try {
    userId = await verifyCredentials(parsed.data);
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.message, fields: { email: parsed.data.email } };
    }
    throw err;
  }

  await createSession(userId);
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
