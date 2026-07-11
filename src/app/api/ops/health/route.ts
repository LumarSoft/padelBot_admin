import { proxyToOpsApi } from "@/lib/api/ops-proxy";

export async function GET() {
  return proxyToOpsApi("/ops/health");
}
