import { cn } from "@/lib/utils";

/** A pulsing placeholder block for content that's on its way. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("bg-foreground/[0.06] animate-pulse rounded-lg dark:bg-white/[0.07]", className)}
      {...props}
    />
  );
}

export { Skeleton };
