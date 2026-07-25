import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Multi-line counterpart of `Input`. It repeats the same surface (radius, inset shadow,
 * focus ring, dark-mode fills) so a form that mixes both doesn't look like two different
 * design systems — the hand-rolled `<textarea class="border-input bg-background">` it
 * replaces did.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-16 w-full min-w-0 rounded-lg border border-input bg-foreground/[0.03] px-2.5 py-1.5 text-base shadow-[inset_0_1px_2px_--alpha(var(--color-black)/4%)] transition-[border-color,box-shadow,background-color] duration-200 ease-fluid outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/20 dark:focus-visible:bg-input/40 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
