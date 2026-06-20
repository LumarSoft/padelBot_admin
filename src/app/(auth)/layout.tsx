import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6">
      {/* Dotted grid backdrop + soft brand glow. */}
      <div className="bg-dot-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="bg-brand/20 pointer-events-none absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full blur-[120px]" />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
