import { proxyToApi } from "@/lib/api/proxy";

export async function GET(): Promise<Response> {
  return proxyToApi("/conversations");
}
