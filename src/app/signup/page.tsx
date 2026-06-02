import { redirect } from "next/navigation";

import AuthForm from "@/app/_components/AuthForm";
import { signupAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  if (await getCurrentUser()) {
    redirect("/");
  }
  return (
    <main className="h-screen w-screen overflow-y-auto bg-white">
      <AuthForm mode="signup" action={signupAction} />
    </main>
  );
}
