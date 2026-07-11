import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Crear club · PadelBot",
};

export default async function RegisterPage() {
  // Already signed in → straight to the dashboard.
  const session = await getSession();
  if (session) {
    redirect("/panel");
  }

  return <RegisterForm />;
}
