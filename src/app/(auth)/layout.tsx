import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      {/* Dotted grid backdrop + drifting aurora glows. */}
      <div className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="bg-brand/20 animate-aurora pointer-events-none absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-24 size-[28rem] rounded-full bg-[oklch(0.75_0.12_195)]/15 blur-[110px]" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="animate-fade-up relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
