import { proxyToApi } from "@/lib/api/proxy";

export async function POST() {
  return proxyToApi("/help/first-day/dismiss", { method: "POST" });
}
