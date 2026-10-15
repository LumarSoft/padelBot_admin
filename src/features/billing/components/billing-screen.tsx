"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { lumarsoftWhatsApp } from "@/lib/contact";
import { formatCount, monthName } from "@/features/plan/lib/format";
import { BuyCreditsDialog } from "@/features/billing/components/buy-credits-dialog";
import { useBilling, useConfirmPurchase } from "@/features/billing/hooks/use-billing";
import type { BillingOverview, CreditPackStatus } from "@/types/api/billing";

const STATUS_LABEL: Record<BillingOverview["subscription"]["status"], string> = {
  ACTIVE: "Activa",
  TRIAL: "Prueba gratis",
  PAST_DUE: "Vencida",
  CANCELLED: "Inactiva",
};

const PURCHASE_LABEL: Record<CreditPackStatus, string> = {
  APPROVED: "Acreditado",
  PENDING: "En proceso",
  REJECTED: "No aprobado",
};

/** "2026-11-10T…" → "10 de noviembre" (with the year when it isn't this one). */
function longDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
  });
}

/**
 * Facturación: the plan the club is on, this month's credits with the button to buy more, and
 * where to ask for help. Also where MercadoPago returns the owner after paying a pack.
 */
export function BillingScreen() {
  const { data, isLoading } = useBilling();
  const [buying, setBuying] = useState(false);
  usePurchaseReturn(() => setBuying(true));

  if (isLoading || !data) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SubscriptionCard data={data} />
        <CreditsCard data={data} onBuy={() => setBuying(true)} />
      </div>

      {data.purchases.length > 0 && <PurchaseHistory data={data} />}

      <Card size="sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">¿Necesitás ayuda?</p>
            <p className="text-muted-foreground text-xs">
              Con tu plan, tus créditos o un pago: escribinos y lo resolvemos.
            </p>
          </div>
          <WhatsAppLink href={lumarsoftWhatsApp("help")}>WhatsApp</WhatsAppLink>
        </CardContent>
      </Card>

      {buying && (
        <BuyCreditsDialog
          open
          onOpenChange={setBuying}
          catalog={data.catalog}
          validityMonths={data.validityMonths}
        />
      )}
    </div>
  );
}

function SubscriptionCard({ data }: { data: BillingOverview }) {
  const { subscription } = data;
  const renewsAt = subscription.renewsAt;
  const past = renewsAt !== null && new Date(renewsAt) < new Date();
  const when =
    renewsAt === null
      ? null
      : subscription.status === "TRIAL"
        ? `${past ? "La prueba terminó el" : "La prueba termina el"} ${longDate(renewsAt)}`
        : `${past ? "Venció el" : "Renueva el"} ${longDate(renewsAt)}`;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <CreditCard className="text-brand size-4" />
          <h2 className="text-sm font-medium">Tu suscripción</h2>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-heading text-2xl font-semibold">Plan {data.plan.name}</p>
          <Badge variant={subscription.severity === "ok" || subscription.severity === "trial" ? "secondary" : "destructive"}>
            {STATUS_LABEL[subscription.status]}
          </Badge>
        </div>
        {when && <p className="text-muted-foreground text-sm">{when}</p>}
        <a
          href={lumarsoftWhatsApp("upgrade")}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "mt-auto self-start")}
        >
          Cambiar plan
        </a>
      </CardContent>
    </Card>
  );
}

function CreditsCard({ data, onBuy }: { data: BillingOverview; onBuy: () => void }) {
  const { credits } = data;
  const total = credits.available ?? credits.included;
  const share = total ? Math.min(100, (credits.used / total) * 100) : 0;
  const over = total !== null && credits.used >= total;
  const nextExpiry = data.packs[0]?.expiresAt;

  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand size-4" />
          <h2 className="text-sm font-medium">Créditos de IA de {monthName(credits.month)}</h2>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-heading text-2xl font-semibold tabular-nums">
            {formatCount(credits.used)}
            {total !== null && (
              <span className="text-muted-foreground text-base font-normal"> / {formatCount(total)}</span>
            )}
          </p>
          {total !== null && (
            <div aria-hidden className="bg-muted h-1.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  over ? "bg-red-500" : share >= 80 ? "bg-amber-500" : "bg-brand",
                )}
                style={{ width: `${share}%` }}
              />
            </div>
          )}
          <p className="text-muted-foreground text-xs text-pretty">
            {credits.extraBalance > 0
              ? `Incluye ${formatCount(credits.extraBalance)} créditos extra${nextExpiry ? `, el primer paquete vence el ${longDate(nextExpiry)}` : ""}. `
              : ""}
            Cada mensaje que el bot manda por WhatsApp usa un crédito. Los del plan se renuevan el 1° de
            cada mes.
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Button onClick={onBuy} disabled={!data.canBuy}>
            Comprar más créditos
          </Button>
          {!data.canBuy && (
            <span className="text-muted-foreground text-xs">Necesitás tener el plan activo.</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PurchaseHistory({ data }: { data: BillingOverview }) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Compras de créditos</h2>
        <ul className="divide-border/60 divide-y text-sm">
          {data.purchases.map((purchase) => (
            <li key={purchase.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
              <span className="font-medium tabular-nums">{formatCount(purchase.credits)} créditos</span>
              <span className="text-muted-foreground tabular-nums">{formatPrice(purchase.priceCents)}</span>
              <span className="text-muted-foreground text-xs">
                {longDate(purchase.approvedAt ?? purchase.createdAt)}
                {purchase.expiresAt && ` · vence el ${longDate(purchase.expiresAt)}`}
              </span>
              <Badge
                className="ml-auto"
                variant={purchase.status === "REJECTED" ? "destructive" : "secondary"}
              >
                {PURCHASE_LABEL[purchase.status]}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/**
 * MercadoPago sends the owner back to `?compra=<purchase>&payment_id=…`. The API checks that
 * payment and credits the pack; the toast says how it went and the URL is cleaned up. Also opens
 * the buy dialog for `?comprar=1` (the credits banner's button).
 */
function usePurchaseReturn(openBuyDialog: () => void) {
  const params = useSearchParams();
  const router = useRouter();
  const confirm = useConfirmPurchase();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const purchaseId = params.get("compra");
    const wantsToBuy = params.get("comprar") === "1";
    if (!purchaseId && !wantsToBuy) return;
    handled.current = true;
    router.replace("/panel/facturacion", { scroll: false });

    if (wantsToBuy) {
      openBuyDialog();
      return;
    }
    const paymentId = params.get("payment_id");
    if (!purchaseId || !paymentId || paymentId === "null") {
      toast("No se completó la compra. Podés intentarlo de nuevo cuando quieras.");
      return;
    }
    confirm.mutate(
      { purchaseId, paymentId },
      {
        onSuccess: (purchase) => {
          if (purchase.status === "APPROVED") {
            toast.success(`¡Listo! Sumamos ${formatCount(purchase.credits)} créditos.`);
          } else if (purchase.status === "PENDING") {
            toast("Tu pago está en proceso. Los créditos se suman apenas MercadoPago lo apruebe.");
          } else {
            toast.error("MercadoPago no aprobó el pago, así que no sumamos los créditos.");
          }
        },
        onError: (error: Error) => toast.error(error.message),
      },
    );
  }, [params, router, confirm, openBuyDialog]);
}
