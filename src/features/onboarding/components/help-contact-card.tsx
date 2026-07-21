import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  lumarsoftEmail,
  lumarsoftWhatsApp,
  LUMARSOFT,
  type ContactIntent,
} from "@/lib/contact";

interface HelpContactCardProps {
  /** Shapes the pre-filled WhatsApp / email message. */
  intent?: ContactIntent;
  title?: string;
  description?: string;
}

/**
 * "Contactá a Lumarsoft" card. Reused by the onboarding checklist (and meant to be
 * reused by the landing CTAs) so contact data and copy live in one place.
 */
export function HelpContactCard({
  intent = "help",
  title = "¿Necesitás una mano?",
  description = "El equipo de Lumarsoft te ayuda a dejar tu complejo listo.",
}: HelpContactCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <WhatsAppLink href={lumarsoftWhatsApp(intent)}>
            WhatsApp
          </WhatsAppLink>
          <a
            href={lumarsoftEmail(intent)}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto px-3.5 py-2",
            )}
            title={LUMARSOFT.email}
          >
            <Mail className="size-4" />
            Mail
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
