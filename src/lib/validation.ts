import { z } from "zod";

export const signupSchema = z.object({
  namaPemilik: z.string().trim().min(2, "Nama pemilik minimal 2 karakter.").max(60),
  namaUsaha: z.string().trim().min(2, "Nama usaha minimal 2 karakter.").max(100),
  nomorHP: z.string().trim().min(8, "Nomor HP minimal 8 digit.").max(20),
  alamat: z.string().trim().min(5, "Alamat minimal 5 karakter.").max(200),
  bidangUsaha: z.string().trim().min(2, "Bidang usaha wajib diisi.").max(100),
  deskripsi: z.string().trim().max(500).optional(),
  email: z.string().trim().toLowerCase().email("Email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter.").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export type AuthFormState =
  | {
      error?: string;
      success?: string;
      fields?: {
        namaPemilik?: string;
        namaUsaha?: string;
        nomorHP?: string;
        alamat?: string;
        bidangUsaha?: string;
        deskripsi?: string;
        email?: string;
      };
    }
  | undefined;
