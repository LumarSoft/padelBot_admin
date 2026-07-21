import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types/api/bookings";

const CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  PENDING_PAYMENT: {
    label: "Pago pendiente",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  CONFIRMED: {
    label: "Confirmada",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelada",
    className: "bg-muted text-muted-foreground",
  },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = CONFIG[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", className)}>
      {label}
    </Badge>
  );
}
