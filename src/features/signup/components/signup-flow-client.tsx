"use client";

import dynamic from "next/dynamic";
import { Logo } from "@/components/ui/logo";

/**
 * The signup is mounted client-only.
 *
 * It restores a draft from `localStorage` at first render, which a server-rendered pass
 * cannot know about: the server would emit question 1 while the browser wants question 9,
 * and React would tear down the mismatch. Skipping SSR lets the restored answers just *be*
 * the initial state instead of something an effect patches in a frame later. There's
 * nothing to lose by it either — the flow is fully interactive and behind a CTA, so it has
 * no SEO or first-paint value to protect.
 */
const SignupFlow = dynamic(
  () => import("@/features/signup/components/signup-flow").then((m) => m.SignupFlow),
  {
    ssr: false,
    // Holds the page's shape for the instant the chunk takes, so nothing jumps.
    loading: () => (
      <div className="relative flex min-h-svh flex-col">
        <div aria-hidden className="ambient-bg" />
        <header className="flex h-16 shrink-0 items-center px-4 md:px-8">
          <Logo />
        </header>
      </div>
    ),
  },
);

export function SignupFlowClient() {
  return <SignupFlow />;
}
