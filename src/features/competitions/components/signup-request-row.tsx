"use client";

import Link from "next/link";
import { Check, MessageCircle, X } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetSignupRequestStatus } from "@/features/competitions/hooks/use-signup-requests";
import { timeAgo } from "@/features/competitions/lib/labels";
import type { CompetitionSignupRequest } from "@/types/api/competition-signups";

/** One player who asked the bot to sign up: who, when, and what the desk can do about it. */
export function SignupRequestRow({ request, onNavigate }: { request: CompetitionSignupRequest; onNavigate?: () => void }) {
  const setStatus = useSetSignupRequestStatus();

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{request.playerName ?? `+${request.waId}`}</p>
        <p className="text-muted-foreground truncate text-xs">
          {request.playerName ? `+${request.waId} · ` : ""}
          {timeAgo(request.createdAt)}
        </p>
      </div>
      <Link
        href={`/panel/conversaciones?waId=${request.waId}`}
        onClick={onNavigate}
        title="Abrir el chat"
        aria-label={`Abrir el chat con ${request.playerName ?? request.waId}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
      >
        <MessageCircle />
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Ya lo atendimos"
        aria-label="Marcar como atendida"
        disabled={setStatus.isPending}
        onClick={() => setStatus.mutate({ id: request.id, status: "HANDLED" })}
      >
        <Check />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Descartar"
        aria-label="Descartar solicitud"
        disabled={setStatus.isPending}
        onClick={() => setStatus.mutate({ id: request.id, status: "DISMISSED" })}
      >
        <X />
      </Button>
    </div>
  );
}
