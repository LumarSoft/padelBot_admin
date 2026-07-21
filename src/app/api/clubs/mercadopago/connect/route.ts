import { proxyToApi } from "@/lib/api/proxy";

export async function POST() {
  return proxyToApi("/clubs/me/mercadopago/connect", { method: "POST" });
}
