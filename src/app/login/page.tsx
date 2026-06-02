import { redirect } from "next/navigation";

import AuthForm from "@/app/_components/AuthForm";
import { loginAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/");
  }
  return (
    <main className="h-screen w-screen overflow-y-auto bg-white">
      <AuthForm mode="login" action={loginAction} />
    </main>
  );
}
