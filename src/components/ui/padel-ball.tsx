import { cn } from "@/lib/utils";

/** The GTP mark: an optic-yellow padel ball with its curved seam. */
export function PadelBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <circle cx="16" cy="16" r="15" fill="oklch(0.92 0.2 118)" />
      <path
        d="M4.5 7.5c5.5 3 5.5 14 0 17M27.5 7.5c-5.5 3-5.5 14 0 17"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
