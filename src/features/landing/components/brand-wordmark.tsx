import { PadelBall } from "@/components/ui/padel-ball";
import { cn } from "@/lib/utils";

/** GTP brand mark for the public landing — the ball plus the display wordmark. */
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
