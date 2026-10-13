import { cn } from "@/lib/utils";
import { PadelBall } from "@/components/ui/padel-ball";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/** GTP brand mark: the padel ball + optional wordmark. */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <PadelBall className="size-7" />
      {showWordmark && (
        <span className="text-[17px] font-bold tracking-tight">GTP</span>
      )}
    </span>
  );
}
