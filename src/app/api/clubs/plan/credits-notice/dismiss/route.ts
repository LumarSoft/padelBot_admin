import { proxyToApi } from "@/lib/api/proxy";

export async function POST() {
  return proxyToApi("/clubs/me/plan/credits-notice/dismiss", { method: "POST" });
}
