import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** One line of context under the number. Without it a metric is trivia, not a signal. */
  hint?: ReactNode;
  tone?: "default" | "warning" | "danger";
}

export function StatTile({ label, value, hint, tone = "default" }: StatTileProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p
          className={cn(
            "font-heading text-2xl font-semibold tabular-nums",
            tone === "warning" && "text-amber-600 dark:text-amber-400",
            tone === "danger" && "text-destructive",
          )}
        >
          {value}
        </p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
