import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/clubs/me/mercadopago");
}

export async function DELETE() {
  return proxyToApi("/clubs/me/mercadopago", { method: "DELETE" });
}
