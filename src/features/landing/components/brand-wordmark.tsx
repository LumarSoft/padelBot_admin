import { cn } from "@/lib/utils";

/** A padel ball: optic-yellow disc with its curved seam. */
export function PadelBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="15" className="fill-ball" />
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

/** GTP brand mark for the public landing — the ball plus the wordmark. */
export function BrandWordmark({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <PadelBall className="size-7" />
      {showWordmark && (
        <span className="font-display text-2xl leading-none font-extrabold tracking-wide">
          GTP
        </span>
      )}
    </span>
  );
}
