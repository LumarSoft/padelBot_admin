import { cn } from "@/lib/utils";
import { PadelBall } from "@/components/ui/padel-ball";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  /** Extra classes for the "GTP" text (the collapsing sidebar fades it out). */
  wordmarkClassName?: string;
}

/** GTP brand mark: the padel ball + optional wordmark. */
export function Logo({ className, showWordmark = true, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <PadelBall className="size-7 shrink-0" />
      {showWordmark && (
        <span className={cn("text-[17px] font-bold tracking-tight", wordmarkClassName)}>GTP</span>
      )}
    </span>
  );
}
