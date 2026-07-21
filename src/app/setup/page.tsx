import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { SetupWizard } from "@/features/setup/components/setup-wizard";

export const metadata: Metadata = {
  title: "Puesta a punto · GTP",
};

export default async function SetupPage() {
  const user = await requireSession();

  // The wizard writes club-wide settings (payments, courts, team) — owner-only, same as
  // Configuración. Staff land back on the panel.
  if (user.role !== "owner") {
    redirect("/panel");
  }

  return (
    <Suspense>
      <SetupWizard clubName={user.clubName} />
    </Suspense>
  );
}
