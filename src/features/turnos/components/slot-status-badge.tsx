import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SlotStatus } from "@/types/api/turnos";

const CONFIG: Record<SlotStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Disponible",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  BOOKED: {
    label: "Reservado",
    className: "bg-brand/15 text-brand",
  },
  BLOCKED: {
    label: "Bloqueado",
    className: "bg-muted text-muted-foreground",
  },
};

export function SlotStatusBadge({ status }: { status: SlotStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", className)}>
      {label}
    </Badge>
  );
}
