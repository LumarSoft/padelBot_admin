"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTab,
  TabsPanel,
  TabsIndicator,
} from "@/components/ui/tabs";
import { useCourts } from "@/features/turnos/hooks/use-courts";
import { CreateBookingDialog } from "@/features/reservas/components/create-booking-dialog";
import { AgendaGrid } from "@/features/agenda/components/agenda-grid";
import { WeekStrip } from "@/features/agenda/components/week-strip";
import { BookingsList } from "@/features/agenda/components/bookings-list";
import { BulkBlockDialog } from "@/features/agenda/components/bulk-block-dialog";
import { formatDayLabel, shiftDay, todayKey } from "@/features/agenda/lib/schedule";

export function AgendaScreen({ initialDayKey }: { initialDayKey?: string } = {}) {
  const [dayKey, setDayKey] = useState(initialDayKey ?? todayKey());
  const [courtId, setCourtId] = useState("");

  const courtsQuery = useCourts();
  const courts = courtsQuery.data ?? [];
  const isToday = dayKey === todayKey();

  return (
    <div className="stagger-children flex flex-col gap-6">
      <PageHeader
        title="Agenda"
        description="La grilla del día: reservá, cancelá, reprogramá o bloqueá turnos en un solo lugar."
        actions={
          <div className="flex items-center gap-2">
            <BulkBlockDialog />
            <CreateBookingDialog />
          </div>
        }
      />

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsIndicator />
          <TabsTab value="calendario">
            <CalendarDays />
            Calendario
          </TabsTab>
          <TabsTab value="lista">
            <List />
            Lista
          </TabsTab>
        </TabsList>

        <TabsPanel value="calendario" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Día anterior"
                onClick={() => setDayKey((d) => shiftDay(d, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant={isToday ? "secondary" : "outline"}
                size="sm"
                onClick={() => setDayKey(todayKey())}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Día siguiente"
                onClick={() => setDayKey((d) => shiftDay(d, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <span className="ml-1 text-sm font-medium capitalize">
                {formatDayLabel(dayKey)}
              </span>
            </div>

            {courts.length > 0 && (
              <Select value={courtId} onValueChange={(v) => setCourtId(v ?? "")}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    {(v) =>
                      !v || v === ""
                        ? "Todas las canchas"
                        : (courts.find((c) => c.id === v)?.name ?? "")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las canchas</SelectItem>
                  {courts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <WeekStrip dayKey={dayKey} courts={courts} onSelectDay={setDayKey} />

          <AgendaGrid dayKey={dayKey} courtId={courtId} />
        </TabsPanel>

        <TabsPanel value="lista">
          <BookingsList />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
