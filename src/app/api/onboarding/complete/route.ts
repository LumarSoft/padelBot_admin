import { proxyToApi } from "@/lib/api/proxy";

export async function POST() {
  return proxyToApi("/onboarding/complete", { method: "POST" });
}
