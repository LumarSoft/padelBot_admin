import { proxyToApi } from "@/lib/api/proxy";

export async function GET() {
  return proxyToApi("/stats/overview");
}
