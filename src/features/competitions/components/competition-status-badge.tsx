import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/features/competitions/lib/labels";
import type { CompetitionStatus } from "@/types/api/competitions";

const TONE: Record<CompetitionStatus, string> = {
  OPEN: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  IN_PROGRESS: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  FINISHED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function CompetitionStatusBadge({ status }: { status: CompetitionStatus }) {
  return (
    <Badge variant="secondary" className={cn(TONE[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
