import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getOpsSession } from "@/lib/ops-session";
import { OpsLoginForm } from "@/features/ops/components/ops-login-form";

export const metadata: Metadata = {
  title: "Consola · Lumarsoft",
  // Internal tool — keep it out of search results even if the URL leaks.
  robots: { index: false, follow: false },
};

export default async function OpsLoginPage() {
  const admin = await getOpsSession();
  if (admin) redirect("/ops");

  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div aria-hidden className="ambient-bg" />
      <OpsLoginForm />
    </div>
  );
}
