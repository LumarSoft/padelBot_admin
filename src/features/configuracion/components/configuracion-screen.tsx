"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CalendarClock, Repeat, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTab, TabsPanel, TabsIndicator } from "@/components/ui/tabs";
import { ClubProfileManager } from "@/features/configuracion/components/club-profile-manager";
import { CourtsManager } from "@/features/configuracion/components/courts-manager";
import { RecurringBookingsManager } from "@/features/configuracion/components/recurring-bookings-manager";
import { TransferConfigManager } from "@/features/configuracion/components/transfer-config-manager";
import { SetupChecklist } from "@/features/onboarding/components/setup-checklist";
import { HelpContactCard } from "@/features/onboarding/components/help-contact-card";

const TABS = [
  { value: "complejo", label: "Complejo", icon: Building2 },
  { value: "pagos", label: "Pagos", icon: Wallet },
  { value: "canchas", label: "Canchas", icon: CalendarClock },
  { value: "fijos", label: "Turnos fijos", icon: Repeat },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((tab) => tab.value === value);
}

export function ConfiguracionScreen({ clubName }: { clubName?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  // The active tab is derived from the URL so deep links (e.g. the setup
  // checklist's "?tab=pagos") just work — no local state to keep in sync.
  const requested = searchParams.get("tab");
  const tab: TabValue = isTabValue(requested) ? requested : "complejo";

  function handleChange(value: unknown): void {
    if (typeof value === "string" && isTabValue(value)) {
      router.replace(`/configuracion?tab=${value}`, { scroll: false });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <SetupChecklist clubName={clubName} />

      <Tabs value={tab} onValueChange={handleChange}>
        <TabsList>
          <TabsIndicator />
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTab key={value} value={value}>
              <Icon />
              {label}
            </TabsTab>
          ))}
        </TabsList>

        <TabsPanel value="complejo" className="flex flex-col gap-6 pt-2">
          <div>
            <h2 className="text-base font-semibold">Datos del complejo</h2>
            <p className="text-muted-foreground text-sm">
              Editá el nombre con el que el bot y el panel identifican tu complejo.
            </p>
          </div>
          <ClubProfileManager />
          <HelpContactCard />
        </TabsPanel>

        <TabsPanel value="pagos" className="pt-2">
          <TransferConfigManager />
        </TabsPanel>

        <TabsPanel value="canchas" className="pt-2">
          <CourtsManager />
        </TabsPanel>

        <TabsPanel value="fijos" className="pt-2">
          <RecurringBookingsManager />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
