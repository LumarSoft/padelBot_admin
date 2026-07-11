import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupFlowClient } from "@/features/signup/components/signup-flow-client";

export const metadata: Metadata = {
  title: "Pedí tu club · PadelBot",
  description:
    "Contanos de tu complejo en dos minutos y lo dejamos andando nosotros: canchas, cobros y el WhatsApp del bot.",
};

/**
 * The step-by-step signup. It lives OUTSIDE the (auth) route group on purpose: that layout
 * boxes its children into a 384px card, and this is a full-screen flow. It is also listed
 * in the proxy's PUBLIC_ROUTES — a prospect has no session, so anything else bounces the
 * landing's main CTA straight to /login.
 */
export default async function RegisterPage() {
  // Already a customer → they want the panel, not the signup.
  const session = await getSession();
  if (session) {
    redirect("/panel");
  }

  return <SignupFlowClient />;
}
