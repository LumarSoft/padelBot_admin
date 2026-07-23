import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Ingresar · GTP Admin",
};

export default async function LoginPage() {
  // Already signed in → straight to the dashboard.
  const session = await getSession();
  if (session) {
    redirect("/panel");
  }

  return <LoginForm />;
}
