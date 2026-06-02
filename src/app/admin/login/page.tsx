import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth";
import AdminLoginForm from "@/app/admin/_components/AdminLoginForm";

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/admin");
  }

  return (
    <main className="h-screen w-screen overflow-y-auto bg-white">
      <AdminLoginForm />
    </main>
  );
}
