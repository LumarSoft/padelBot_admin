import { Skeleton } from "@/components/ui/skeleton";

/**
 * What a panel screen shows the instant it's clicked, while its server part loads: the shape
 * of a page (title, a row of cards, a table) so the click reads as answered, never as frozen.
 */
export default function PanelLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Cargando">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-10 rounded-xl" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 rounded-xl" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  );
}
