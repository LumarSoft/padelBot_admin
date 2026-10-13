import { cn } from "@/lib/utils";

/**
 * Top-down padel court in chalk lines (20 × 10 m, to scale): outer walls,
 * the net, both service lines and the centre service line.
 */
export function CourtLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
      className={cn("stroke-current", className)}
    >
      <rect x="1" y="1" width="198" height="98" strokeWidth="0.8" />
      <line x1="100" y1="1" x2="100" y2="99" strokeWidth="1.4" />
      <line x1="30.5" y1="1" x2="30.5" y2="99" strokeWidth="0.6" />
      <line x1="169.5" y1="1" x2="169.5" y2="99" strokeWidth="0.6" />
      <line x1="30.5" y1="50" x2="169.5" y2="50" strokeWidth="0.6" />
    </svg>
  );
}
