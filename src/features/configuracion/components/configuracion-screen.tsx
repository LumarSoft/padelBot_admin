"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Bot, Building2, CalendarClock, Repeat, Users, Wallet } from "lucide-react";
import { Tabs, TabsList, TabsTab, TabsPanel, TabsIndicator } from "@/components/ui/tabs";
import { ClubProfileManager } from "@/features/configuracion/components/club-profile-manager";
import { CourtsManager } from "@/features/configuracion/components/courts-manager";
import { FaqManager } from "@/features/configuracion/components/faq-manager";
import { RecurringBookingsManager } from "@/features/configuracion/components/recurring-bookings-manager";
import { TransferConfigManager } from "@/features/configuracion/components/transfer-config-manager";
import { TeamManager } from "@/features/configuracion/components/team-manager";
import { SetupChecklist } from "@/features/onboarding/components/setup-checklist";
import { HelpContactCard } from "@/features/onboarding/components/help-contact-card";

/**
 * Same order as the `/setup` wizard (`features/setup/lib/steps.ts`): complejo → canchas →
 * cobros → bot → fijos → equipo. An owner who just finished the guided setup finds each
 * setting where the wizard left it, and what the bot can't run without comes before the
 * optional parts. The `value`s are part of the URL (`?tab=pagos`) — don't rename them.
 */
const TABS = [
  { value: "complejo", label: "Complejo", icon: Building2 },
  { value: "canchas", label: "Canchas", icon: CalendarClock },
  { value: "pagos", label: "Pagos", icon: Wallet },
  { value: "bot", label: "Bot", icon: Bot },
  { value: "fijos", label: "Turnos fijos", icon: Repeat },
  { value: "equipo", label: "Equipo", icon: Users },
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
      router.replace(`/panel/configuracion?tab=${value}`, { scroll: false });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SetupChecklist clubName={clubName} />

      <Tabs value={tab} onValueChange={handleChange} className="gap-6">
        {/* Six tabs don't fit on a phone. Let the rail scroll rather than wrap it — the
            sliding indicator is absolutely positioned and needs them on one row. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList>
            <TabsIndicator />
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTab key={value} value={value}>
                <Icon />
                {label}
              </TabsTab>
            ))}
          </TabsList>
        </div>

        {/* Each manager owns its own titled section (SettingsSection), so the tab panels
            stay a plain shell instead of half the headings living up here. */}
        <TabsPanel value="complejo" className="flex flex-col gap-6">
          <ClubProfileManager />
          <HelpContactCard />
        </TabsPanel>

        <TabsPanel value="canchas">
          <CourtsManager />
        </TabsPanel>

        <TabsPanel value="pagos">
          <TransferConfigManager />
        </TabsPanel>

        <TabsPanel value="bot">
          <FaqManager />
        </TabsPanel>

        <TabsPanel value="fijos">
          <RecurringBookingsManager />
        </TabsPanel>

        <TabsPanel value="equipo">
          <TeamManager />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
