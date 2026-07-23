"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, Lock } from "lucide-react";
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
import { formatDayLabel, shiftDay, todayKey } from "@/features/agenda/lib/schedule";

export function AgendaScreen({ initialDayKey }: { initialDayKey?: string } = {}) {
  const [dayKey, setDayKey] = useState(initialDayKey ?? todayKey());
  const [courtId, setCourtId] = useState("");
  // Bulk block/unblock is done by ticking cells straight on the grid.
  const [selectionMode, setSelectionMode] = useState(false);

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
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              onClick={() => setSelectionMode((v) => !v)}
            >
              <Lock className="size-4" />
              {selectionMode ? "Salir de selección" : "Bloquear turnos"}
            </Button>
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

          {selectionMode && (
            <div className="border-brand/30 bg-brand/5 text-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Lock className="text-brand size-4 shrink-0" />
              Tocá los turnos que querés bloquear (o desbloquear) y confirmá abajo. Cambiá de
              día para bloquear en otra fecha. Las reservas no se pueden seleccionar.
            </div>
          )}

          <AgendaGrid
            dayKey={dayKey}
            courtId={courtId}
            selectionMode={selectionMode}
            onExitSelection={() => setSelectionMode(false)}
          />
        </TabsPanel>

        <TabsPanel value="lista">
          <BookingsList />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
