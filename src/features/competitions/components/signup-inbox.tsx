"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSignupRequests } from "@/features/competitions/hooks/use-signup-requests";
import { SignupRequestRow } from "@/features/competitions/components/signup-request-row";
import { KIND_LABEL, groupBy } from "@/features/competitions/lib/labels";

/**
 * Header inbox: players who asked the WhatsApp bot to sign up for a torneo or peña, grouped by
 * event ("3 quieren anotarse a Torneo Primavera"). The bot already handed each chat to a person.
 */
export function SignupInbox() {
  const [open, setOpen] = useState(false);
  const { data } = useSignupRequests({ status: "PENDING" });
  const pending = data ?? [];
  const groups = groupBy(pending, (r) => r.competitionId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              pending.length > 0
                ? `Inscripciones por WhatsApp: ${pending.length} sin atender`
                : "Inscripciones por WhatsApp"
            }
          />
        }
      >
        <Trophy className="size-4" />
        {pending.length > 0 && (
          <span className="bg-brand absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4 font-semibold text-white">
            {pending.length > 99 ? "99+" : pending.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-border/60 border-b px-4 py-3">
          <p className="text-sm font-medium">Inscripciones por WhatsApp</p>
          <p className="text-muted-foreground text-xs">
            Jugadores que pidieron anotarse desde el bot. Escribiles y cargá la pareja en el evento.
          </p>
        </div>
        {pending.length === 0 ? (
          <p className="text-muted-foreground px-4 py-6 text-center text-sm">No hay pedidos sin atender.</p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto px-4 py-2">
            {groups.map(([competitionId, requests]) => {
              const competition = requests[0].competition;
              return (
                <section key={competitionId} className="border-border/40 border-b py-2 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-semibold">{requests.length}</span>{" "}
                      {requests.length === 1 ? "quiere" : "quieren"} anotarse a{" "}
                      <span className="font-semibold">{competition.name}</span>
                    </p>
                    <Link
                      href={`${KIND_LABEL[competition.kind].path}/${competitionId}`}
                      onClick={() => setOpen(false)}
                      className="text-brand shrink-0 text-xs font-medium"
                    >
                      Ver {competition.kind === "PENA" ? "peña" : "torneo"}
                    </Link>
                  </div>
                  {requests.map((request) => (
                    <SignupRequestRow key={request.id} request={request} onNavigate={() => setOpen(false)} />
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
