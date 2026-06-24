import Link from "next/link";
import {
  CalendarClock,
  CalendarCheck,
  MessagesSquare,
  Settings,
  ArrowUpRight,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SetupChecklist } from "@/features/onboarding/components/setup-checklist";
import { OverviewStats } from "@/features/dashboard/components/overview-stats";

const SHORTCUTS = [
  {
    href: "/turnos",
    title: "Turnos",
    description: "Administrá canchas, horarios y precios.",
    icon: CalendarClock,
  },
  {
    href: "/reservas",
    title: "Reservas",
    description: "Revisá estados, editá y cancelá reservas.",
    icon: CalendarCheck,
  },
  {
    href: "/conversaciones",
    title: "Conversaciones",
    description: "Seguí el bot y tomá el control cuando haga falta.",
    icon: MessagesSquare,
  },
  {
    href: "/configuracion",
    title: "Configuración",
    description: "Datos del club y conexión de WhatsApp.",
    icon: Settings,
  },
];

export default async function OverviewPage() {
  const session = await getSession();

  return (
    <div className="animate-in fade-in-50 flex flex-col gap-8 duration-500">
      <PageHeader
        title={`Hola, ${session?.name?.split(" ")[0] ?? ""}`}
        description={`Esto es lo que pasa hoy en ${session?.clubName}.`}
      />

      {session?.role === "owner" && (
        <SetupChecklist clubName={session?.clubName} hideWhenComplete />
      )}

      <OverviewStats />

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SHORTCUTS.map(({ href, title, description, icon: Icon }) => (
            <Link key={href} href={href} className="group">
              <Card className="hover:border-brand/40 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{title}</p>
                      <ArrowUpRight className="text-muted-foreground size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
